<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\Pedido;
use App\Models\Reclamo;
use App\Support\AccesoPedido;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * Libro de Reclamaciones virtual (Derecho). Toda tienda que vende al público en el Perú debe
 * tenerlo, también la tienda en línea, con un aviso visible (Ley 29571, art. 150, y su
 * reglamento, D.S. 011-2011-PCM). Se puede usar sin cuenta: el derecho a reclamar no depende
 * de estar registrado.
 *
 * La hoja tiene datos personales (documento, domicilio), así que solo la ve quien la presentó
 * en esta sesión o la recuperó con número + correo (session 'reclamos_propios'), su dueño si
 * tiene cuenta, o un admin. Para cualquier otro, el número "no existe" (404).
 */
class LibroReclamacionesController extends Controller
{
    public function create(Request $request)
    {
        $user = $request->user();
        $inicial = ['nombre' => $user?->name ?? '', 'email' => $user?->email ?? '', 'pedido_codigo' => ''];

        // Viene desde un pedido ("¿Tienes un problema con tu compra?"): si quien entra puede ver
        // ese pedido, se completan los datos del producto para que no tenga que escribirlos.
        $codigo = Str::upper(trim((string) $request->query('pedido', '')));
        if ($codigo !== '') {
            $pedido = Pedido::with('personalizacion.laptop')->where('codigo', $codigo)->first();
            if ($pedido && AccesoPedido::puedeVer($request, $pedido)) {
                $laptop = $pedido->personalizacion?->laptop;
                $inicial = [
                    'nombre' => $pedido->nombre,
                    'email' => $pedido->email,
                    'telefono' => $pedido->telefono,
                    'pedido_codigo' => $pedido->codigo,
                    'monto_reclamado' => (string) $pedido->total,
                    'descripcion_bien' => $laptop ? "Laptop {$laptop->marca} {$laptop->modelo}" : '',
                ];
            }
        }

        return Inertia::render('derecho/libro-reclamaciones', [
            'inicial' => $inicial,
            'proveedor' => config('tienda.emisor'),
            'plazoDias' => (int) config('derecho.plazo_respuesta_dias_habiles'),
        ]);
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'tipo' => ['required', Rule::in(Reclamo::TIPOS)],
            'nombre' => ['required', 'string', 'max:120'],
            'tipo_documento' => ['required', Rule::in(Reclamo::DOCUMENTOS)],
            'numero_documento' => [
                'required',
                'string',
                // DNI: 8 dígitos. Carné de extranjería y pasaporte: letras y números.
                $request->input('tipo_documento') === 'DNI' ? 'regex:/^\d{8}$/' : 'regex:/^[A-Za-z0-9]{6,12}$/',
            ],
            'domicilio' => ['required', 'string', 'max:200'],
            'telefono' => ['nullable', 'regex:/^9\d{8}$/'],
            'email' => ['required', 'email', 'max:150'],
            'menor_de_edad' => ['boolean'],
            'apoderado' => ['required_if_accepted:menor_de_edad', 'nullable', 'string', 'max:120'],
            'bien' => ['required', Rule::in(Reclamo::BIENES)],
            'pedido_codigo' => ['nullable', 'string', 'max:20'],
            'monto_reclamado' => ['nullable', 'numeric', 'min:0', 'max:999999'],
            'descripcion_bien' => ['required', 'string', 'max:200'],
            'detalle' => ['required', 'string', 'min:20', 'max:3000'],
            'pedido_consumidor' => ['required', 'string', 'min:10', 'max:1500'],
            'declara_veracidad' => ['accepted'],
        ], [
            'numero_documento.regex' => $request->input('tipo_documento') === 'DNI'
                ? 'El DNI tiene 8 dígitos.'
                : 'Escribe el número del documento (6 a 12 letras o números).',
            'telefono.regex' => 'Ingresa un celular de 9 dígitos que empiece en 9.',
            'apoderado.required_if_accepted' => 'Si eres menor de edad, indica el nombre de tu padre, madre o tutor.',
            'detalle.min' => 'Cuéntanos un poco más qué pasó (al menos 20 caracteres).',
            'pedido_consumidor.min' => 'Indica qué solución esperas (al menos 10 caracteres).',
            'declara_veracidad.accepted' => 'Debes confirmar que los datos son verdaderos.',
        ]);

        unset($datos['declara_veracidad']);
        $datos['pedido_codigo'] = isset($datos['pedido_codigo']) ? (Str::upper(trim($datos['pedido_codigo'])) ?: null) : null;
        if (empty($datos['menor_de_edad'])) {
            $datos['apoderado'] = null;
        }

        $reclamo = Reclamo::create([...$datos, 'user_id' => $request->user()?->id]);
        $request->session()->push('reclamos_propios', $reclamo->numero);

        return redirect()->route('reclamos.show', $reclamo->numero);
    }

    public function show(Request $request, string $numero)
    {
        $reclamo = Reclamo::where('numero', $numero)->firstOrFail();
        $user = $request->user();

        abort_unless(
            in_array($reclamo->numero, $request->session()->get('reclamos_propios', []), true)
                || ($user && ($user->puede('reclamos') || $reclamo->user_id === $user->id)),
            404,
        );

        return Inertia::render('derecho/hoja-reclamacion', [
            'reclamo' => $reclamo,
            'proveedor' => config('tienda.emisor'),
            'plazoDias' => (int) config('derecho.plazo_respuesta_dias_habiles'),
        ]);
    }

    /** Volver a ver una hoja (y la respuesta) desde otro navegador: número + correo. */
    public function consultar(Request $request)
    {
        $datos = $request->validate([
            'numero' => ['required', 'string', 'max:20'],
            'email' => ['required', 'email', 'max:150'],
        ]);

        $reclamo = Reclamo::where('numero', Str::upper(trim($datos['numero'])))->first();

        // Mismo mensaje si no existe o si el correo no coincide: no se revela qué números son válidos.
        if (! $reclamo || Str::lower(trim($reclamo->email)) !== Str::lower(trim($datos['email']))) {
            return redirect()->route('reclamos.create')
                ->withErrors(['numero' => 'No encontramos una hoja con ese número y correo.'])
                ->onlyInput('numero', 'email');
        }

        $request->session()->push('reclamos_propios', $reclamo->numero);

        return redirect()->route('reclamos.show', $reclamo->numero);
    }
}
