<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Services\Tienda\ArmadoLaptop;
use App\Support\UbigeoHuanuco;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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

    public function store(Request $request, ArmadoLaptop $armado)
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

        $pedido = DB::transaction(function () use ($datos, $user, $armado, $ubigeo) {
            $personalizacion = $armado->guardar($datos, $user);
            $envio = (float) config('tienda.costo_envio');

            return Pedido::create([
                'codigo' => Pedido::nuevoCodigo(),
                'user_id' => $user?->id,
                'personalizacion_id' => $personalizacion->id,
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
                'metodo_pago' => 'tarjeta_simulada',
                'tarjeta_marca' => $datos['pago']['marca'],
                'tarjeta_ultimos4' => $datos['pago']['ultimos4'],
                'subtotal' => $personalizacion->precio_total,
                'costo_envio' => $envio,
                'total' => (float) $personalizacion->precio_total + $envio,
                'estado' => 'pagado',
            ]);
        });

        // Quien compró sin cuenta solo puede ver su confirmación desde esta misma sesión.
        $request->session()->push('pedidos_propios', $pedido->codigo);

        return response()->json(['codigo' => $pedido->codigo, 'total' => $pedido->total], 201);
    }
}
