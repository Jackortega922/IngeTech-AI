<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Accesorio;
use App\Models\Actividad;
use App\Models\Carrera;
use App\Models\Kit;
use App\Models\Laptop;
use App\Models\Software;

class CatalogoController extends Controller
{
    /**
     * Todo lo que las pantallas necesitan para funcionar sin más llamadas:
     * carreras (con su software asociado), catálogo de software, catálogo
     * de hardware, actividades adicionales del perfil, y kits/accesorios
     * para la personalización.
     */
    public function index()
    {
        return response()->json([
            'carreras' => Carrera::with('software:id,clave')->orderBy('nombre')->get(),
            'software' => Software::orderBy('nombre')->get(),
            'hardware' => Laptop::orderBy('precio_soles')->get(),
            'actividades' => Actividad::orderBy('nombre')->get(),
            'accesorios' => Accesorio::orderBy('nombre')->get(),
            'kits' => Kit::with('accesorios')->orderBy('nombre')->get(),
        ]);
    }
}
