<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cupon;
use App\Models\Pedido;
use App\Services\Tienda\ArmadoLaptop;
use App\Services\Tienda\Inventario;
use App\Support\UbigeoHuanuco;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Compra de una laptop, con o sin cuenta. El pago es simulado: el navegador valida la tarjeta
 * y solo manda la marca y los últimos 4 dígitos (como haría el token de una pasarela real).
 */
class PedidoController extends Controller
{
    // Tarjeta de prueba que simula un rechazo del banco, para poder mostrar ese caso.
    public const ULTIMOS4_RECHAZADA = '0002';

    public function index(Request $request)
    {
        return response()->json(
            Pedido::with(['personalizacion.laptop', 'personalizacion.items.item', 'eventos'])
                ->where('user_id', $request->user()->id)
                ->latest('id')
                ->get()
        );
    }

    public function store(Request $request, ArmadoLaptop $armado, Inventario $inventario)
    {
        $datos = $request->validate([
            ...ArmadoLaptop::reglas(),
            'nombre' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:150'],
            // Celular peruano: 9 dígitos que empiezan en 9.
            'telefono' => ['required', 'regex:/^9\d{8}$/'],
            'departamento' => ['required', Rule::in(Pedido::DEPARTAMENTOS)],
            // Huánuco: provincia y distrito de la lista oficial. Resto: ciudad en texto libre.
            'provincia' => ['required_if:departamento,'.UbigeoHuanuco::DEPARTAMENTO, 'nullable', 'string', 'max:60'],
            'distrito' => ['required_if:departamento,'.UbigeoHuanuco::DEPARTAMENTO, 'nullable', 'string', 'max:60'],
            'ciudad' => ['exclude_if:departamento,'.UbigeoHuanuco::DEPARTAMENTO, 'required', 'string', 'max:80'],
            'direccion' => ['required', 'string', 'max:200'],
            'referencia' => ['nullable', 'string', 'max:200'],
            'pago.marca' => ['required', Rule::in(['visa', 'mastercard', 'amex'])],
            'pago.ultimos4' => ['required', 'digits:4'],
            'acepta_terminos' => ['accepted'],
            'cupon' => ['nullable', 'string', 'max:30'],
            // Ambiental: recojo del equipo anterior para reciclaje (RAEE).
            'recojo_raee' => ['boolean'],
            'raee_detalle' => ['nullable', 'string', 'max:120'],
        ], [
            'telefono.regex' => 'Ingresa un celular de 9 dígitos que empiece en 9.',
            'acepta_terminos.accepted' => 'Debes aceptar los términos y la política de privacidad.',
        ]);

        if ($datos['pago']['ultimos4'] === self::ULTIMOS4_RECHAZADA) {
            return response()->json(['message' => 'Tu banco rechazó el pago (simulación). Prueba con otra tarjeta.'], 402);
        }

        $ubigeo = null;
        if ($datos['departamento'] === UbigeoHuanuco::DEPARTAMENTO) {
            $ubigeo = UbigeoHuanuco::ubigeo($datos['provincia'], $datos['distrito']);
            if ($ubigeo === null) {
                throw ValidationException::withMessages(['distrito' => 'Ese distrito no pertenece a la provincia elegida.']);
            }
        }

        $user = $request->user();

        $pedido = DB::transaction(function () use ($datos, $user, $armado, $ubigeo, $inventario) {
            $personalizacion = $armado->guardar($datos, $user);
            $envio = (float) config('tienda.costo_envio');
            $subtotal = (float) $personalizacion->precio_total;

            // Cupón (Marketing): se vuelve a validar aquí con el precio que calculó el servidor, y
            // se bloquea la fila para que dos compras a la vez no pasen el límite de usos.
            $cupon = null;
            if (! empty($datos['cupon'])) {
                $cupon = Cupon::lockForUpdate()->where('codigo', Str::upper(trim($datos['cupon'])))->first();
                $motivo = $cupon ? $cupon->motivoNoAplica($subtotal) : 'Ese cupón no existe.';
                if ($motivo) {
                    throw ValidationException::withMessages(['cupon' => $motivo]);
                }
                $cupon->increment('usos');
            }
            $descuento = $cupon?->descuentoPara($subtotal) ?? 0;

            $pedido = Pedido::create([
                'codigo' => Pedido::nuevoCodigo(),
                'user_id' => $user?->id,
                'personalizacion_id' => $personalizacion->id,
                'cupon_id' => $cupon?->id,
                'nombre' => $datos['nombre'],
                'email' => $datos['email'],
                'telefono' => $datos['telefono'],
                'departamento' => $datos['departamento'],
                'provincia' => $ubigeo ? $datos['provincia'] : null,
                'distrito' => $ubigeo ? $datos['distrito'] : null,
                'ubigeo' => $ubigeo,
                'ciudad' => $ubigeo ? null : $datos['ciudad'],
                'direccion' => $datos['direccion'],
                'referencia' => $datos['referencia'] ?? null,
                'recojo_raee' => $datos['recojo_raee'] ?? false,
                'raee_detalle' => ! empty($datos['recojo_raee']) ? ($datos['raee_detalle'] ?? null) : null,
                'metodo_pago' => 'tarjeta_simulada',
                'tarjeta_marca' => $datos['pago']['marca'],
                'tarjeta_ultimos4' => $datos['pago']['ultimos4'],
                'subtotal' => $subtotal,
                'descuento' => $descuento,
                'costo_envio' => $envio,
                // El IGV (Contabilidad) se calcula sobre este total, ya con el descuento.
                'total' => $subtotal - $descuento + $envio,
                'estado' => 'pagado',
            ]);

            // Sale la unidad del inventario. Si se agotó mientras el cliente pagaba, se lanza
            // un error de validación y la transacción deshace el pedido completo.
            $inventario->vender($pedido, $personalizacion->laptop);

            return $pedido;
        });

        // Quien compró sin cuenta solo puede ver su confirmación desde esta misma sesión.
        $request->session()->push('pedidos_propios', $pedido->codigo);

        return response()->json(['codigo' => $pedido->codigo, 'total' => $pedido->total], 201);
    }
}
