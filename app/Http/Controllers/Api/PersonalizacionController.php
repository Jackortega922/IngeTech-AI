<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accesorio;
use App\Models\Kit;
use App\Models\Laptop;
use App\Models\Personalizacion;
use App\Models\Recomendacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Guarda la personalización confirmada como cotización: el cliente la ve en su panel y el
 * admin la ve para que un asesor lo contacte y cierre la compra (no hay pago en línea).
 */
class PersonalizacionController extends Controller
{
    public function index(Request $request)
    {
        return response()->json(
            Personalizacion::with(['laptop', 'items.item'])
                ->where('user_id', $request->user()->id)
                ->latest('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        $datos = $request->validate([
            'laptop_id' => ['required', 'integer', 'exists:laptops,id'],
            'recomendacion_id' => ['nullable', 'integer', 'exists:recomendaciones,id'],
            'ram_gb' => ['required', 'integer'],
            'almacenamiento_gb' => ['required', 'integer'],
            'kit_id' => ['nullable', 'integer', 'exists:kits,id'],
            'accesorio_ids' => ['array'],
            'accesorio_ids.*' => ['integer', 'distinct', 'exists:accesorios,id'],
        ]);

        $laptop = Laptop::findOrFail($datos['laptop_id']);

        // Solo se puede enlazar una recomendación propia y que sea de esta misma laptop.
        if (! empty($datos['recomendacion_id'])) {
            $recomendacion = Recomendacion::with('perfilUsuario')->find($datos['recomendacion_id']);
            abort_unless($recomendacion->perfilUsuario?->user_id === $request->user()->id, 403);
            if ($recomendacion->laptop_id !== $laptop->id) {
                throw ValidationException::withMessages(['recomendacion_id' => 'La recomendación no corresponde a esta laptop.']);
            }
        }

        // Mismos límites que ofrece la pantalla: no bajar de lo que trae de fábrica ni pasar
        // de lo que la laptop admite.
        $ramMaxima = $laptop->ram_ampliable_gb ?? $laptop->ram_gb;
        if ($datos['ram_gb'] < $laptop->ram_gb || $datos['ram_gb'] > $ramMaxima) {
            throw ValidationException::withMessages(['ram_gb' => "La RAM debe estar entre {$laptop->ram_gb} y {$ramMaxima} GB."]);
        }
        if ($datos['almacenamiento_gb'] < $laptop->almacenamiento_gb || $datos['almacenamiento_gb'] > 4096) {
            throw ValidationException::withMessages(['almacenamiento_gb' => 'Almacenamiento fuera de rango.']);
        }

        $kit = isset($datos['kit_id']) ? Kit::find($datos['kit_id']) : null;
        $accesorios = Accesorio::whereIn('id', $datos['accesorio_ids'] ?? [])->get();

        // El total se recalcula aquí, no se toma del navegador.
        $total = (float) $laptop->precio_soles
            + ($datos['ram_gb'] - $laptop->ram_gb) * config('tienda.soles_por_gb_ram')
            + ($datos['almacenamiento_gb'] - $laptop->almacenamiento_gb) * config('tienda.soles_por_gb_almacenamiento')
            + (float) ($kit?->precio_soles ?? 0)
            + $accesorios->sum(fn ($a) => (float) $a->precio_soles);

        $personalizacion = DB::transaction(function () use ($request, $datos, $laptop, $kit, $accesorios, $total) {
            $p = Personalizacion::create([
                'user_id' => $request->user()->id,
                'laptop_id' => $laptop->id,
                'recomendacion_id' => $datos['recomendacion_id'] ?? null,
                'ram_gb' => $datos['ram_gb'],
                'almacenamiento_gb' => $datos['almacenamiento_gb'],
                'precio_total' => round($total, 2),
            ]);

            foreach (array_filter([$kit, ...$accesorios]) as $item) {
                $p->items()->create(['item_type' => $item->getMorphClass(), 'item_id' => $item->id, 'cantidad' => 1]);
            }

            return $p;
        });

        return response()->json($personalizacion->load(['laptop', 'items.item']), 201);
    }
}
