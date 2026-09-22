<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Carrera;
use App\Models\Software;
use Illuminate\Http\Request;

class CarreraController extends Controller
{
    private function reglas(?Carrera $actual = null): array
    {
        return [
            'clave' => ['required', 'string', 'max:60', 'alpha_dash', $actual ? "unique:carreras,clave,{$actual->id}" : 'unique:carreras,clave'],
            'nombre' => ['required', 'string', 'max:150'],
            'facultad' => ['required', 'string', 'max:150'],
            'software_claves' => ['array'],
            'software_claves.*' => ['string', 'exists:software,clave'],
        ];
    }

    public function store(Request $request)
    {
        $datos = $request->validate($this->reglas());
        $carrera = Carrera::create(collect($datos)->except('software_claves')->all());
        $this->sincronizarSoftware($carrera, $datos['software_claves'] ?? []);

        return response()->json($carrera->load('software'), 201);
    }

    public function update(Request $request, Carrera $carrera)
    {
        $datos = $request->validate($this->reglas($carrera));
        $carrera->update(collect($datos)->except('software_claves')->all());
        $this->sincronizarSoftware($carrera, $datos['software_claves'] ?? []);

        return response()->json($carrera->load('software'));
    }

    public function destroy(Carrera $carrera)
    {
        $carrera->delete();

        return response()->noContent();
    }

    private function sincronizarSoftware(Carrera $carrera, array $claves): void
    {
        $ids = Software::whereIn('clave', $claves)->pluck('id');
        $carrera->software()->sync($ids);
    }
}
