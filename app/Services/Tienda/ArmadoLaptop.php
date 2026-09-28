<?php

namespace App\Services\Tienda;

use App\Models\Accesorio;
use App\Models\Kit;
use App\Models\Laptop;
use App\Models\Personalizacion;
use App\Models\Recomendacion;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Valida la configuración elegida en /personalizar, recalcula el precio en el servidor y la
 * guarda como Personalizacion. El precio que calcula el navegador es solo para mostrar: el
 * que vale es este, así nadie puede comprar más barato editando la petición.
 */
class ArmadoLaptop
{
    public static function reglas(): array
    {
        return [
            'laptop_id' => ['required', 'integer', 'exists:laptops,id'],
            'recomendacion_id' => ['nullable', 'integer', 'exists:recomendaciones,id'],
            'ram_gb' => ['required', 'integer'],
            'almacenamiento_gb' => ['required', 'integer'],
            'kit_id' => ['nullable', 'integer', 'exists:kits,id'],
            'accesorio_ids' => ['array'],
            'accesorio_ids.*' => ['integer', 'distinct', 'exists:accesorios,id'],
        ];
    }

    /**
     * Debe llamarse dentro de una transacción: crea la personalización y sus ítems.
     */
    public function guardar(array $datos, ?User $user): Personalizacion
    {
        $laptop = Laptop::findOrFail($datos['laptop_id']);

        // Solo se puede enlazar una recomendación propia y que sea de esta misma laptop. Un
        // invitado nunca tiene recomendaciones (la IA pide cuenta).
        if (! empty($datos['recomendacion_id'])) {
            $recomendacion = Recomendacion::with('perfilUsuario')->find($datos['recomendacion_id']);
            abort_unless($user && $recomendacion->perfilUsuario?->user_id === $user->id, 403);
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

        $total = (float) $laptop->precio_soles
            + ($datos['ram_gb'] - $laptop->ram_gb) * config('tienda.soles_por_gb_ram')
            + ($datos['almacenamiento_gb'] - $laptop->almacenamiento_gb) * config('tienda.soles_por_gb_almacenamiento')
            + (float) ($kit?->precio_soles ?? 0)
            + $accesorios->sum(fn ($a) => (float) $a->precio_soles);

        $personalizacion = Personalizacion::create([
            'user_id' => $user?->id,
            'laptop_id' => $laptop->id,
            'recomendacion_id' => $datos['recomendacion_id'] ?? null,
            'ram_gb' => $datos['ram_gb'],
            'almacenamiento_gb' => $datos['almacenamiento_gb'],
            'precio_total' => round($total, 2),
        ]);

        foreach (array_filter([$kit, ...$accesorios]) as $item) {
            $personalizacion->items()->create(['item_type' => $item->getMorphClass(), 'item_id' => $item->id, 'cantidad' => 1]);
        }

        return $personalizacion;
    }
}
