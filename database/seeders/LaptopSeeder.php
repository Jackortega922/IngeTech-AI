<?php

namespace Database\Seeders;

use App\Models\Laptop;
use Illuminate\Database\Seeder;

/**
 * Datos de ejemplo para poder probar el flujo completo. Precios y specs son
 * referenciales, no verificados en tienda — reemplazar por datos reales
 * verificados antes de producción (tarea C2).
 *
 * Catálogo estructurado por marca: Lenovo, HP, Apple, Asus y Acer, con al
 * menos 3 laptops cada una (entrada, intermedia y alta gama/gaming). Por
 * ahora el alcance es solo laptops — sin PCs de escritorio — así que el
 * catálogo no tiene ningún equipo con tipo "escritorio" (esa opción se
 * ocultó también del formulario de Perfil).
 *
 * Pantalla, peso y puertos (guía de compra del comparador) son valores típicos de la ficha
 * técnica de cada modelo, de referencia: una misma línea sale en varias configuraciones, así que
 * hay que confirmarlos con el SKU exacto que venda la tienda (tarea C2).
 *
 * imagen_url queda sin definir a propósito: no hay enlaces a fotos reales
 * verificadas todavía (misma tarea C2) — el catálogo cae al ícono
 * ilustrativo por marca (ver resources/js/components/laptop-image.tsx)
 * hasta que se agreguen enlaces reales.
 */
class LaptopSeeder extends Seeder
{
    public function run(): void
    {
        // Se borran explícitamente en vez de solo quitarlas del arreglo de abajo:
        // updateOrCreate no elimina ni renombra filas, solo hace match por marca+modelo — así
        // que una fila que ya no está en la lista se queda huérfana en cualquier base que la
        // tuviera (pasó en el cambio anterior con el MacBook Air al renombrarlo).
        Laptop::where('marca', 'Dell')->where('modelo', 'Inspiron 15 3520')->delete();
        Laptop::where('marca', 'Apple')->where('modelo', 'MacBook Air M2')->delete();
        // Por ahora el catálogo es solo laptops — se quitan las PCs de escritorio.
        Laptop::where('tipo', 'escritorio')->delete();

        $equipos = [
            // ── Lenovo ──
            ['marca' => 'Lenovo', 'modelo' => 'IdeaPad Slim 3', 'descripcion' => 'Liviana y confiable para el día a día: clases virtuales, documentos y navegación sin complicaciones.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7530U', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 8, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 60, 'peso_kg' => 1.62, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi', 'lector_sd'], 'precio_soles' => 1899, 'tienda' => 'Tiendas EFE Huánuco', 'rendimiento_score' => 45],
            ['marca' => 'Lenovo', 'modelo' => 'IdeaPad 5 Pro', 'descripcion' => 'Buen equilibrio entre precio y potencia: cómoda para programar, editar documentos pesados y multitarea.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 7 7735U', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 9, 'pantalla_pulgadas' => 14.0, 'pantalla_resolucion' => '2880x1800', 'pantalla_hz' => 90, 'peso_kg' => 1.49, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi', 'lector_sd'], 'precio_soles' => 3199, 'tienda' => 'Curacao (envío nacional)', 'rendimiento_score' => 68],
            ['marca' => 'Lenovo', 'modelo' => 'Legion 5', 'descripcion' => 'El equipo más potente del catálogo: 32 GB de RAM y RTX 4070 para IA, renders pesados y modelado 3D.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 7 7840HS', 'ram_gb' => 32, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 1024, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4070', 'gpu_dedicada' => true, 'bateria_horas' => 5, 'pantalla_pulgadas' => 16.0, 'pantalla_resolucion' => '2560x1600', 'pantalla_hz' => 165, 'peso_kg' => 2.50, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi', 'ethernet'], 'precio_soles' => 6499, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 94],

            // ── HP ──
            ['marca' => 'HP', 'modelo' => '15 Laptop', 'descripcion' => 'La opción más económica del catálogo: ideal para ofimática básica y tareas ligeras de escritorio.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i3-1215U', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'Intel UHD integrada', 'gpu_dedicada' => false, 'bateria_horas' => 7, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 60, 'peso_kg' => 1.59, 'puertos' => ['usb_a', 'usb_c', 'hdmi', 'lector_sd'], 'precio_soles' => 1699, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 38],
            ['marca' => 'HP', 'modelo' => 'Pavilion Aero 13', 'descripcion' => 'Muy compacta y liviana, con gran autonomía: pensada para llevarla todo el día entre clases.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7640U', 'ram_gb' => 16, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 10, 'pantalla_pulgadas' => 13.3, 'pantalla_resolucion' => '1920x1200', 'pantalla_hz' => 60, 'peso_kg' => 0.99, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi'], 'precio_soles' => 2999, 'tienda' => 'Tiendas EFE Huánuco', 'rendimiento_score' => 62],
            ['marca' => 'HP', 'modelo' => 'Victus 16', 'descripcion' => 'GPU dedicada de gama media en un cuerpo de 16": soporta diseño, edición y juegos exigentes.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i5-13500H', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4050', 'gpu_dedicada' => true, 'bateria_horas' => 6, 'pantalla_pulgadas' => 16.1, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 144, 'peso_kg' => 2.29, 'puertos' => ['usb_a', 'usb_c', 'hdmi', 'ethernet', 'lector_sd'], 'precio_soles' => 4599, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 78],

            // ── Apple ──
            ['marca' => 'Apple', 'modelo' => 'MacBook Air 13" M2', 'descripcion' => 'Batería de todo el día y chip eficiente: silenciosa, ligera y fluida para desarrollo y diseño.', 'tipo' => 'laptop', 'cpu' => 'Apple M2', 'ram_gb' => 16, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'GPU integrada Apple M2', 'gpu_dedicada' => false, 'bateria_horas' => 18, 'pantalla_pulgadas' => 13.6, 'pantalla_resolucion' => '2560x1664', 'pantalla_hz' => 60, 'peso_kg' => 1.24, 'puertos' => ['usb_c_carga', 'thunderbolt'], 'precio_soles' => 5499, 'tienda' => 'iStore (envío nacional)', 'rendimiento_score' => 80],
            ['marca' => 'Apple', 'modelo' => 'MacBook Air 15" M3', 'descripcion' => 'La misma eficiencia del Air, en pantalla grande: cómoda para tener varias ventanas abiertas a la vez.', 'tipo' => 'laptop', 'cpu' => 'Apple M3', 'ram_gb' => 8, 'ram_ampliable_gb' => 8, 'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'GPU integrada Apple M3', 'gpu_dedicada' => false, 'bateria_horas' => 18, 'pantalla_pulgadas' => 15.3, 'pantalla_resolucion' => '2880x1864', 'pantalla_hz' => 60, 'peso_kg' => 1.51, 'puertos' => ['usb_c_carga', 'thunderbolt'], 'precio_soles' => 6499, 'tienda' => 'iStore (envío nacional)', 'rendimiento_score' => 85],
            ['marca' => 'Apple', 'modelo' => 'MacBook Pro 14" M3', 'descripcion' => 'El más potente de Apple en el catálogo: pantalla Liquid Retina XDR y rendimiento sostenido para cargas pesadas.', 'tipo' => 'laptop', 'cpu' => 'Apple M3', 'ram_gb' => 16, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'GPU integrada Apple M3 (10 núcleos)', 'gpu_dedicada' => false, 'bateria_horas' => 17, 'pantalla_pulgadas' => 14.2, 'pantalla_resolucion' => '3024x1964', 'pantalla_hz' => 120, 'peso_kg' => 1.55, 'puertos' => ['usb_c_carga', 'thunderbolt', 'hdmi', 'lector_sd'], 'precio_soles' => 7999, 'tienda' => 'iStore (envío nacional)', 'rendimiento_score' => 90],

            // ── Asus ──
            ['marca' => 'ASUS', 'modelo' => 'Vivobook 15', 'descripcion' => 'Entrada de la línea Vivobook: liviana y suficiente para ofimática y navegación diaria.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7520U', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 8, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 60, 'peso_kg' => 1.70, 'puertos' => ['usb_a', 'usb_c', 'hdmi'], 'precio_soles' => 2199, 'tienda' => 'Plaza Vea Huánuco', 'rendimiento_score' => 42],
            ['marca' => 'ASUS', 'modelo' => 'Vivobook Pro 15 OLED', 'descripcion' => 'Pantalla OLED vibrante y GPU dedicada de entrada: buena opción para diseño ligero y edición.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i5-13500H', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 2050', 'gpu_dedicada' => true, 'bateria_horas' => 6, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '2880x1620', 'pantalla_hz' => 120, 'peso_kg' => 1.80, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi', 'lector_sd'], 'precio_soles' => 3799, 'tienda' => 'Hiraoka (envío nacional)', 'rendimiento_score' => 74],
            ['marca' => 'ASUS', 'modelo' => 'TUF Gaming A15', 'descripcion' => 'GPU dedicada de gama media y buena disipación: soporta diseño 3D, renders y videojuegos exigentes.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 7 7735HS', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4060', 'gpu_dedicada' => true, 'bateria_horas' => 5, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 144, 'peso_kg' => 2.20, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi', 'ethernet'], 'precio_soles' => 4999, 'tienda' => 'Curacao (envío nacional)', 'rendimiento_score' => 88],

            // ── Acer ──
            ['marca' => 'Acer', 'modelo' => 'Aspire 3', 'descripcion' => 'La opción más accesible de Acer: cubre lo básico de estudio y oficina sin gastar de más.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i3-1215U', 'ram_gb' => 8, 'ram_ampliable_gb' => 16, 'almacenamiento_gb' => 256, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'Intel UHD integrada', 'gpu_dedicada' => false, 'bateria_horas' => 7, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 60, 'peso_kg' => 1.78, 'puertos' => ['usb_a', 'usb_c', 'hdmi', 'ethernet'], 'precio_soles' => 1799, 'tienda' => 'PC Factory Huánuco', 'rendimiento_score' => 36],
            ['marca' => 'Acer', 'modelo' => 'Aspire 5', 'descripcion' => 'Un salto de rendimiento sobre las de entrada, con 16 GB de RAM para manejar varias apps a la vez.', 'tipo' => 'laptop', 'cpu' => 'AMD Ryzen 5 7535U', 'ram_gb' => 16, 'ram_ampliable_gb' => 24, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'AMD Radeon integrada', 'gpu_dedicada' => false, 'bateria_horas' => 8, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 60, 'peso_kg' => 1.76, 'puertos' => ['usb_a', 'usb_c_carga', 'hdmi', 'ethernet'], 'precio_soles' => 2399, 'tienda' => 'Plaza Vea Huánuco', 'rendimiento_score' => 55],
            ['marca' => 'Acer', 'modelo' => 'Nitro V15', 'descripcion' => 'Gaming de entrada con GPU dedicada: suficiente para diseño, edición y videojuegos actuales en calidad media-alta.', 'tipo' => 'laptop', 'cpu' => 'Intel Core i5-13420H', 'ram_gb' => 16, 'ram_ampliable_gb' => 32, 'almacenamiento_gb' => 512, 'almacenamiento_tipo' => 'SSD', 'gpu' => 'NVIDIA RTX 4050', 'gpu_dedicada' => true, 'bateria_horas' => 6, 'pantalla_pulgadas' => 15.6, 'pantalla_resolucion' => '1920x1080', 'pantalla_hz' => 144, 'peso_kg' => 2.10, 'puertos' => ['usb_a', 'usb_c', 'hdmi', 'ethernet'], 'precio_soles' => 4799, 'tienda' => 'Compumundo Huánuco', 'rendimiento_score' => 76],
        ];

        foreach ($equipos as $equipo) {
            Laptop::updateOrCreate(
                ['marca' => $equipo['marca'], 'modelo' => $equipo['modelo']],
                $equipo
            );
        }
    }
}
