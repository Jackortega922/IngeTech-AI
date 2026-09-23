<?php

namespace Database\Seeders;

use App\Models\Laptop;
use Illuminate\Database\Seeder;

/**
 * Datos de ejemplo para poder probar el flujo completo. Precios y specs son
 * referenciales, no verificados en tienda — reemplazar por datos reales
 * verificados antes de producción.
 */
class LaptopSeeder extends Seeder
{
    public function run(): void
    {
        $equipos = [
            ['marca' => 'Lenovo', 'modelo' => 'IdeaPad Slim 3', 'descripcion' => 'Liviana y confiable para el día a día: clases virtuales, documentos y navegación sin complicaciones.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7530U', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 8, 'precio_soles' => 1899, 'tienda' => 'Tiendas EFE Huánuco', 'rendimiento_score' => 45],
            ['marca' => 'HP', 'modelo' => '15 Laptop', 'descripcion' => 'La opción más económica del catálogo: ideal para ofimática básica y tareas ligeras de escritorio.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i3-1215U', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'Intel UHD integrada', 'gpu_dedicada' => false, 'bateria_horas' => 7, 'precio_soles' => 1699, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 38],
            ['marca' => 'Acer', 'modelo' => 'Aspire 5', 'descripcion' => 'Un salto de rendimiento sobre las de entrada, con 16 GB de RAM para manejar varias apps a la vez.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7535U', 'ram_gb' => 16, 'ram_ampliable_gb' => 24, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 8, 'precio_soles' => 2399, 'tienda' => 'Plaza Vea Huánuco', 'rendimiento_score' => 55],
            ['marca' => 'Lenovo', 'modelo' => 'IdeaPad 5 Pro', 'descripcion' => 'Buen equilibrio entre precio y potencia: cómoda para programar, editar documentos pesados y multitarea.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 7 7735U', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 9, 'precio_soles' => 3199, 'tienda' => 'Curacao (envío nacional)', 'rendimiento_score' => 68],
            ['marca' => 'ASUS', 'modelo' => 'Vivobook Pro 15 OLED', 'descripcion' => 'Pantalla OLED vibrante y GPU dedicada de entrada: buena opción para diseño ligero y edición.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i5-13500H', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 2050', 'gpu_dedicada' => true, 'bateria_horas' => 6, 'precio_soles' => 3799, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 74],
            ['marca' => 'Dell', 'modelo' => 'Inspiron 15 3520', 'descripcion' => '1 TB de almacenamiento de fábrica: perfecta si manejas muchos archivos, proyectos y máquinas virtuales.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i7-1255U', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'Intel Iris Xe integrada', 'gpu_dedicada' => false, 'bateria_horas' => 7, 'precio_soles' => 3499, 'tienda' => 'Plaza Vea Huánuco', 'rendimiento_score' => 65],
            ['marca' => 'ASUS', 'modelo' => 'TUF Gaming A15', 'descripcion' => 'GPU dedicada de gama media y buena disipación: soporta diseño 3D, renders y videojuegos exigentes.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 7 7735HS', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4060', 'gpu_dedicada' => true, 'bateria_horas' => 5, 'precio_soles' => 4999, 'tienda' => 'Curacao (envío nacional)', 'rendimiento_score' => 88],
            ['marca' => 'Lenovo', 'modelo' => 'Legion 5', 'descripcion' => 'El equipo más potente del catálogo: 32 GB de RAM y RTX 4070 para IA, renders pesados y modelado 3D.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 7 7840HS', 'ram_gb' => 32, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4070', 'gpu_dedicada' => true, 'bateria_horas' => 5, 'precio_soles' => 6499, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 94],
            ['marca' => 'Apple', 'modelo' => 'MacBook Air M2', 'descripcion' => 'Batería de todo el día y chip eficiente: silenciosa, ligera y fluida para desarrollo y diseño.', 'tipo' => 'laptop', 'cpu' => 'Apple M2', 'ram_gb' => 16, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'GPU integrada Apple M2', 'gpu_dedicada' => false, 'bateria_horas' => 18, 'precio_soles' => 5499, 'tienda' => 'iStore (envío nacional)', 'rendimiento_score' => 80],
            ['marca' => 'HP', 'modelo' => 'Pavilion Aero 13', 'descripcion' => 'Muy compacta y liviana, con gran autonomía: pensada para llevarla todo el día entre clases.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7640U', 'ram_gb' => 16, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 10, 'precio_soles' => 2999, 'tienda' => 'Tiendas EFE Huánuco', 'rendimiento_score' => 62],

            // PCs de escritorio (sin batería)
            ['marca' => 'Ensamblado', 'modelo' => 'Oficina Plus', 'descripcion' => 'PC de escritorio económica para trabajo administrativo y ofimática, con buena relación precio-uso.', 'tipo' => 'escritorio', 'cpu' => 'Intel Core i3-12100', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 480, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'Intel UHD 730', 'gpu_dedicada' => false, 'bateria_horas' => null, 'precio_soles' => 1799, 'tienda' => 'PC Factory Huánuco', 'rendimiento_score' => 42],
            ['marca' => 'Ensamblado', 'modelo' => 'Diseño CAD', 'descripcion' => 'Con GPU dedicada de entrada: pensada para AutoCAD, Revit y software de diseño en 2D/3D básico.', 'tipo' => 'escritorio', 'cpu' => 'Intel Core i5-12400', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 3050', 'gpu_dedicada' => true, 'bateria_horas' => null, 'precio_soles' => 3299, 'tienda' => 'PC Factory Huánuco', 'rendimiento_score' => 58],
            ['marca' => 'Ensamblado', 'modelo' => 'Estación Ingeniería', 'descripcion' => 'Estación de trabajo con 32 GB de RAM y GPU dedicada: soporta simulaciones y modelado más exigente.', 'tipo' => 'escritorio', 'cpu' => 'AMD Ryzen 7 5700X', 'ram_gb' => 32, 'ram_ampliable_gb' => 64, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 3060', 'gpu_dedicada' => true, 'bateria_horas' => null, 'precio_soles' => 4499, 'tienda' => 'Compumundo Huánuco', 'rendimiento_score' => 72],
            ['marca' => 'Ensamblado', 'modelo' => 'Workstation Pro', 'descripcion' => 'El equipo más potente del catálogo para escritorio: pensado para IA, renders y cargas de trabajo intensas.', 'tipo' => 'escritorio', 'cpu' => 'AMD Ryzen 9 7900X', 'ram_gb' => 32, 'ram_ampliable_gb' => 64, 'almacenamiento_gb' => 2048, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4070 Ti', 'gpu_dedicada' => true, 'bateria_horas' => null, 'precio_soles' => 7999, 'tienda' => 'Compumundo Huánuco', 'rendimiento_score' => 95],
        ];

        foreach ($equipos as $equipo) {
            Laptop::updateOrCreate(
                ['marca' => $equipo['marca'], 'modelo' => $equipo['modelo']],
                $equipo
            );
        }
    }
}
