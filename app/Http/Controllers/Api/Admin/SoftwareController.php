<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Software;
use Illuminate\Http\Request;

class SoftwareController extends Controller
{
    private function reglas(?Software $actual = null): array
    {
        return [
            'clave' => ['required', 'string', 'max:60', 'alpha_dash', $actual ? "unique:software,clave,{$actual->id}" : 'unique:software,clave'],
            'nombre' => ['required', 'string', 'max:150'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'categoria' => ['required', 'string', 'max:100'],
            'min_ram_gb' => ['required', 'integer', 'min:1'],
            'min_cpu_score' => ['required', 'integer', 'between:0,100'],
            'min_gpu_dedicada' => ['required', 'boolean'],
            'rec_ram_gb' => ['required', 'integer', 'min:1'],
            'rec_cpu_score' => ['required', 'integer', 'between:0,100'],
            'rec_gpu_dedicada' => ['required', 'boolean'],
        ];
    }

    public function store(Request $request)
    {
        $datos = $request->validate($this->reglas());

        return response()->json(Software::create($datos), 201);
    }

    public function update(Request $request, Software $software)
    {
        $datos = $request->validate($this->reglas($software));
        $software->update($datos);

        return response()->json($software);
    }

    public function destroy(Software $software)
    {
        $software->delete();

        return response()->noContent();
    }
}
