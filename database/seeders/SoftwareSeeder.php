<?php

namespace Database\Seeders;

use App\Models\Carrera;
use App\Models\Software;
use Illuminate\Database\Seeder;

class SoftwareSeeder extends Seeder
{
    public function run(): void
    {
        $software = [
            ['clave' => 'office', 'nombre' => 'Microsoft Office / Google Workspace', 'descripcion' => 'Documentos, hojas de cálculo y presentaciones — la base de cualquier carrera.', 'categoria' => 'Ofimática', 'min_ram_gb' => 4, 'min_cpu_score' => 15, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 8, 'rec_cpu_score' => 25, 'rec_gpu_dedicada' => false],
            ['clave' => 'vscode', 'nombre' => 'VS Code / IDEs de programación', 'descripcion' => 'Editor de código para desarrollar y depurar software en cualquier lenguaje.', 'categoria' => 'Desarrollo', 'min_ram_gb' => 4, 'min_cpu_score' => 25, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 8, 'rec_cpu_score' => 35, 'rec_gpu_dedicada' => false],
            ['clave' => 'packet_tracer', 'nombre' => 'Cisco Packet Tracer', 'descripcion' => 'Simulador de redes para diseñar y probar topologías sin hardware físico.', 'categoria' => 'Redes', 'min_ram_gb' => 4, 'min_cpu_score' => 20, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 8, 'rec_cpu_score' => 30, 'rec_gpu_dedicada' => false],
            ['clave' => 'docker', 'nombre' => 'Docker / Máquinas virtuales', 'descripcion' => 'Contenedores y entornos virtualizados — exige bastante más RAM que un programa normal.', 'categoria' => 'Desarrollo', 'min_ram_gb' => 8, 'min_cpu_score' => 40, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 16, 'rec_cpu_score' => 55, 'rec_gpu_dedicada' => false],
            ['clave' => 'vensim', 'nombre' => 'Vensim (dinámica de sistemas)', 'descripcion' => 'Modelado de sistemas y simulación de dinámicas complejas.', 'categoria' => 'Simulación', 'min_ram_gb' => 4, 'min_cpu_score' => 20, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 8, 'rec_cpu_score' => 30, 'rec_gpu_dedicada' => false],
            ['clave' => 'autocad', 'nombre' => 'AutoCAD', 'descripcion' => 'Diseño técnico 2D/3D para planos de ingeniería y arquitectura.', 'categoria' => 'Diseño / CAD', 'min_ram_gb' => 8, 'min_cpu_score' => 40, 'min_gpu_dedicada' => true, 'rec_ram_gb' => 16, 'rec_cpu_score' => 60, 'rec_gpu_dedicada' => true],
            ['clave' => 'revit', 'nombre' => 'Revit (BIM)', 'descripcion' => 'Modelado BIM de edificaciones completas — de los programas más pesados del catálogo.', 'categoria' => 'Diseño / CAD', 'min_ram_gb' => 16, 'min_cpu_score' => 55, 'min_gpu_dedicada' => true, 'rec_ram_gb' => 32, 'rec_cpu_score' => 75, 'rec_gpu_dedicada' => true],
            ['clave' => 'matlab', 'nombre' => 'MATLAB / Octave', 'descripcion' => 'Cálculo numérico, simulación y análisis de ingeniería.', 'categoria' => 'Cálculo / Simulación', 'min_ram_gb' => 8, 'min_cpu_score' => 40, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 16, 'rec_cpu_score' => 55, 'rec_gpu_dedicada' => false],
            ['clave' => 'dicom', 'nombre' => 'Visores DICOM / imágenes médicas', 'descripcion' => 'Visualización de imágenes médicas (radiografías, tomografías) en alta resolución.', 'categoria' => 'Salud', 'min_ram_gb' => 8, 'min_cpu_score' => 35, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 16, 'rec_cpu_score' => 45, 'rec_gpu_dedicada' => false],
            ['clave' => 'spss', 'nombre' => 'SPSS / análisis estadístico', 'descripcion' => 'Procesamiento estadístico de datos para investigación y tesis.', 'categoria' => 'Análisis de datos', 'min_ram_gb' => 8, 'min_cpu_score' => 30, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 16, 'rec_cpu_score' => 40, 'rec_gpu_dedicada' => false],
            ['clave' => 'render_arquitectura', 'nombre' => 'SketchUp / Lumion (render 3D)', 'descripcion' => 'Modelado y renderizado 3D de proyectos arquitectónicos.', 'categoria' => 'Diseño / CAD', 'min_ram_gb' => 16, 'min_cpu_score' => 50, 'min_gpu_dedicada' => true, 'rec_ram_gb' => 32, 'rec_cpu_score' => 70, 'rec_gpu_dedicada' => true],
            ['clave' => 'gis', 'nombre' => 'ArcGIS / QGIS', 'descripcion' => 'Sistemas de información geográfica para mapeo y análisis de suelos/cultivos.', 'categoria' => 'Análisis de datos', 'min_ram_gb' => 8, 'min_cpu_score' => 35, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 16, 'rec_cpu_score' => 45, 'rec_gpu_dedicada' => false],
            ['clave' => 'edicion_multimedia', 'nombre' => 'Photoshop / Premiere', 'descripcion' => 'Edición de imagen y video para piezas de comunicación y contenido audiovisual.', 'categoria' => 'Diseño / CAD', 'min_ram_gb' => 8, 'min_cpu_score' => 35, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 16, 'rec_cpu_score' => 55, 'rec_gpu_dedicada' => true],
            ['clave' => 'software_contable', 'nombre' => 'Concar / SAP Business One', 'descripcion' => 'Sistemas contables y de gestión empresarial.', 'categoria' => 'Ofimática', 'min_ram_gb' => 4, 'min_cpu_score' => 20, 'min_gpu_dedicada' => false, 'rec_ram_gb' => 8, 'rec_cpu_score' => 30, 'rec_gpu_dedicada' => false],
        ];

        $modelos = [];
        foreach ($software as $s) {
            $modelos[$s['clave']] = Software::updateOrCreate(['clave' => $s['clave']], $s);
        }

        $porCarrera = [
            'ing_sistemas' => ['vensim', 'packet_tracer', 'vscode', 'docker', 'office'],
            'ing_civil' => ['autocad', 'revit', 'office'],
            'medicina' => ['dicom', 'office', 'spss'],
            'educacion' => ['office', 'spss'],
            'administracion' => ['office', 'spss'],
            'ing_ambiental' => ['autocad', 'matlab', 'office'],
            'enfermeria' => ['office', 'dicom'],
            'ing_minas' => ['autocad', 'matlab', 'office'],
            'contabilidad' => ['office', 'software_contable', 'spss'],
            'derecho' => ['office'],
            'psicologia' => ['office', 'spss'],
            'arquitectura' => ['autocad', 'revit', 'render_arquitectura'],
            'zootecnia' => ['office', 'gis'],
            'agronomia' => ['office', 'gis'],
            'turismo' => ['office'],
            'comunicacion' => ['office', 'edicion_multimedia'],
        ];

        foreach ($porCarrera as $claveCarrera => $clavesSoftware) {
            $carrera = Carrera::where('clave', $claveCarrera)->first();
            if (! $carrera) {
                continue;
            }
            $ids = collect($clavesSoftware)->map(fn ($c) => $modelos[$c]->id)->all();
            $carrera->software()->sync($ids);
        }
    }
}
