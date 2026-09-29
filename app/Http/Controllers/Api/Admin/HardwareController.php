<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Laptop;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class HardwareController extends Controller
{
    private function reglas(): array
    {
        return [
            'marca' => ['required', 'string', 'max:100'],
            'modelo' => ['required', 'string', 'max:100'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'imagen_url' => ['nullable', 'url', 'max:500'],
            'tipo' => ['required', Rule::in(['laptop', 'escritorio'])],
            'cpu' => ['required', 'string', 'max:150'],
            'cpu_score' => ['nullable'], // alias de rendimiento_score, ver map()
            'rendimiento_score' => ['required', 'integer', 'between:0,100'],
            'ram_gb' => ['required', 'integer', 'min:1'],
            'ram_ampliable_gb' => ['nullable', 'integer', 'min:1'],
            'almacenamiento_gb' => ['required', 'integer', 'min:1'],
            'almacenamiento_tipo' => ['required', 'string', 'max:20'],
            'gpu' => ['nullable', 'string', 'max:150'],
            'gpu_dedicada' => ['required', 'boolean'],
            'bateria_horas' => ['nullable', 'integer', 'min:0'],
            'pantalla_pulgadas' => ['nullable', 'numeric', 'between:10,20'],
            'pantalla_resolucion' => ['nullable', 'regex:/^\d{3,4}x\d{3,4}$/'],
            'pantalla_hz' => ['nullable', 'integer', 'between:30,500'],
            'peso_kg' => ['nullable', 'numeric', 'between:0.5,6'],
            'puertos' => ['nullable', 'array'],
            'puertos.*' => ['string', 'distinct', Rule::in(Laptop::PUERTOS)],
            'precio_soles' => ['required', 'numeric', 'min:0'],
            'tienda' => ['nullable', 'string', 'max:150'],
        ];
    }

    public function store(Request $request)
    {
        $datos = $request->validate($this->reglas());

        return response()->json(Laptop::create($datos), 201);
    }

    public function update(Request $request, Laptop $laptop)
    {
        $datos = $request->validate($this->reglas());
        $laptop->update($datos);

        return response()->json($laptop);
    }

    public function destroy(Laptop $laptop)
    {
        $laptop->delete();

        return response()->noContent();
    }
}
