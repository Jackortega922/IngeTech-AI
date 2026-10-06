<?php

namespace Database\Seeders;

use App\Models\Actividad;
use App\Models\EventoAnalitica;
use App\Models\Laptop;
use App\Models\MovimientoInventario;
use App\Models\Pedido;
use App\Models\PerfilUsuario;
use App\Models\Personalizacion;
use App\Models\Recomendacion;
use App\Models\User;
use App\Services\Recommender\MockRecommenderClient;
use App\Services\Recommender\RecommenderClient;
use App\Services\Tienda\Inventario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Clientes de DEMOSTRACIÓN para ver funcionar la segmentación de Marketing (K-Means necesita al
 * menos 6 clientes con actividad) y los indicadores del Dashboard. No se ejecuta con
 * `db:seed`: hay que pedirlo a propósito.
 *
 *     php artisan db:seed --class=ClientesDemoSeeder
 *
 * Todo es ficticio y se reconoce por el correo @demo.ingetech.test. Lo que no es inventado:
 * - las recomendaciones las calcula el motor de IA real (o el mock, si el motor no está corriendo);
 * - las compras pasan por el inventario, así que descuentan stock y quedan en el kardex.
 *
 * OJO: las compras de demostración suman ventas en Contabilidad. Para volver a una base sin ellas:
 * `php artisan migrate:fresh --seed`.
 */
class ClientesDemoSeeder extends Seeder
{
    public const DOMINIO = 'demo.ingetech.test';

    // Necesidades típicas: lo que la persona contaría en el formulario de perfil.
    private const NECESIDADES = [
        'programacion' => ['actividades' => ['programacion_web', 'maquinas_virtuales'], 'software' => ['vscode', 'docker'], 'tipo_uso' => 'programacion'],
        'oficina' => ['actividades' => [], 'software' => ['office'], 'tipo_uso' => 'oficina'],
        'diseno' => ['actividades' => ['diseno_3d'], 'software' => ['edicion_multimedia'], 'tipo_uso' => 'diseno'],
        'datos' => ['actividades' => ['analisis_datos'], 'software' => ['spss', 'office'], 'tipo_uso' => null],
        'cad' => ['actividades' => ['cad_extra'], 'software' => ['autocad'], 'tipo_uso' => null],
        'juegos' => ['actividades' => ['videojuegos', 'streaming_multitarea'], 'software' => [], 'tipo_uso' => null],
    ];

    /**
     * Cinco comportamientos distintos (los que K-Means debería encontrar). Por grupo: cuántos
     * clientes, qué necesidades, presupuesto, cuántas consultas a la IA, cuántas compras y hace
     * cuántos días fue su última actividad.
     */
    private const GRUPOS = [
        ['n' => 5, 'necesidades' => ['diseno', 'cad', 'programacion'], 'presupuesto' => [5500, 7500], 'consultas' => [2, 3], 'compras' => 2, 'dias' => [2, 20]],
        ['n' => 6, 'necesidades' => ['oficina', 'datos', 'programacion'], 'presupuesto' => [2500, 4000], 'consultas' => [1, 2], 'compras' => 1, 'dias' => [5, 25]],
        ['n' => 6, 'necesidades' => ['programacion', 'diseno', 'juegos'], 'presupuesto' => [3000, 5000], 'consultas' => [3, 4], 'compras' => 0, 'dias' => [1, 10]],
        ['n' => 5, 'necesidades' => ['oficina', 'datos'], 'presupuesto' => [1800, 3000], 'consultas' => [1, 1], 'compras' => 0, 'dias' => [3, 25]],
        ['n' => 4, 'necesidades' => ['oficina', 'juegos'], 'presupuesto' => [2000, 4500], 'consultas' => [1, 2], 'compras' => 0, 'dias' => [100, 160]],
    ];

    private const NOMBRES = [
        'Lucía Ramos', 'Diego Huamán', 'Valeria Soto', 'Jorge Quispe', 'Camila Torres', 'Renzo Villanueva', 'Ana Flores',
        'Kevin Rojas', 'Milagros Cárdenas', 'Bruno Espinoza', 'Daniela Paredes', 'Luis Mendoza', 'Fiorella Chávez',
        'Óscar Salazar', 'Gabriela Ríos', 'Héctor Vargas', 'Andrea Castillo', 'Martín León', 'Rosa Cabrera', 'Iván Ponce',
        'Paola Aguirre', 'César Medina', 'Karina Núñez', 'Raúl Benites', 'Sofía Arias', 'Miguel Tello',
    ];

    public function run(RecommenderClient $motor, Inventario $inventario): void
    {
        if (User::where('email', 'like', '%@'.self::DOMINIO)->exists()) {
            $this->command?->warn('Los clientes de demostración ya existen. Para empezar de cero: php artisan migrate:fresh --seed');

            return;
        }

        mt_srand(42); // mismos clientes cada vez que se cargue la demostración
        $usoMock = false;
        $indice = 0;

        foreach (self::GRUPOS as $grupo) {
            for ($i = 0; $i < $grupo['n']; $i++, $indice++) {
                $nombre = self::NOMBRES[$indice];
                $ultimaActividad = now()->subDays(mt_rand(...$grupo['dias']))->setTime(mt_rand(9, 20), mt_rand(0, 59));
                $consultas = mt_rand(...$grupo['consultas']);
                $inicio = $ultimaActividad->copy()->subDays(($consultas - 1) * 2);

                $cliente = User::factory()->create([
                    'name' => $nombre,
                    'email' => 'cliente'.($indice + 1).'@'.self::DOMINIO,
                    'created_at' => $inicio->copy()->subDay(),
                ]);

                $ultima = null;
                for ($c = 0; $c < $consultas; $c++) {
                    $necesidad = $grupo['necesidades'][mt_rand(0, count($grupo['necesidades']) - 1)];
                    $presupuesto = mt_rand(intdiv($grupo['presupuesto'][0], 100), intdiv($grupo['presupuesto'][1], 100)) * 100;
                    $ultima = $this->consultar($cliente, $necesidad, $presupuesto, $inicio->copy()->addDays($c * 2), $motor, $usoMock);
                }

                for ($p = 0; $p < $grupo['compras'] && $ultima; $p++) {
                    $this->comprar($cliente, $ultima, $ultimaActividad->copy()->subDays($p * 7), $inventario, recojo: $indice % 3 === 0);
                }
            }
        }

        $this->command?->info("Listo: {$indice} clientes de demostración (@".self::DOMINIO.').'.($usoMock ? ' El motor no respondió: se usó el mock.' : ''));
    }

    /** Una consulta a la IA, guardada igual que la guarda RecomendacionController. */
    private function consultar(User $cliente, string $necesidad, int $presupuesto, Carbon $fecha, RecommenderClient $motor, bool &$usoMock): ?Recomendacion
    {
        $n = self::NECESIDADES[$necesidad];
        $payload = [
            'perfil' => [
                'carrera' => '', 'nivel_experiencia' => 'intermedio', 'actividades' => $n['actividades'],
                'software' => $n['software'], 'presupuesto_soles' => $presupuesto,
            ],
            'opciones' => ['top_n' => 3, 'excluir_ids' => Laptop::where('stock', 0)->pluck('id')->all()],
        ];

        try {
            $respuesta = $motor->recomendar($payload);
        } catch (Throwable) {
            $usoMock = true;
            $respuesta = (new MockRecommenderClient)->recomendar($payload);
        }

        $perfil = PerfilUsuario::create([
            'user_id' => $cliente->id, 'portabilidad' => 'cualquiera', 'nivel_experiencia' => 'intermedio',
            // Como en RecomendacionController: el perfil guarda el nombre de la actividad, no la clave.
            'tipo_uso' => $n['tipo_uso'], 'actividades' => Actividad::whereIn('clave', $n['actividades'])->pluck('nombre')->all(),
            'software' => $n['software'],
            'presupuesto_soles' => $presupuesto, 'consentimiento_at' => $fecha,
        ]);
        $this->fechar($perfil, $fecha);

        $primera = null;
        foreach ($respuesta['recomendaciones'] ?? [] as $item) {
            $rec = Recomendacion::create([
                'perfil_usuario_id' => $perfil->id,
                'laptop_id' => $item['laptop_id'],
                'compatibilidad_pct' => $item['compatibilidad_pct'],
                'explicacion' => array_merge($item['explicacion'] ?? [], ['badges' => []]),
            ]);
            $this->fechar($rec, $fecha);
            $primera ??= $rec;
        }

        $evento = EventoAnalitica::create([
            'recomendacion_id' => $primera?->id,
            'tipo' => 'consulta_recomendacion',
            'payload' => ['carrera_clave' => null, 'presupuesto_soles' => $presupuesto, 'portabilidad' => 'cualquiera', 'resultado' => $primera ? 'ok' : ($respuesta['error'] ?? 'sin_resultados')],
        ]);
        $this->fechar($evento, $fecha);

        return $primera;
    }

    /** Compra de la primera opción que recomendó la IA, por el mismo camino que una compra real. */
    private function comprar(User $cliente, Recomendacion $rec, Carbon $fecha, Inventario $inventario, bool $recojo): void
    {
        $laptop = Laptop::find($rec->laptop_id);
        if (! $laptop || $laptop->stock === 0) {
            return;
        }

        DB::transaction(function () use ($cliente, $rec, $fecha, $inventario, $recojo, $laptop) {
            // El cliente "eligió" la opción unos minutos después de ver el resultado (tiempo de decisión).
            $eleccion = EventoAnalitica::create(['recomendacion_id' => $rec->id, 'tipo' => 'eleccion_recomendacion', 'payload' => ['badges' => []]]);
            $this->fechar($eleccion, $rec->created_at->copy()->addMinutes(mt_rand(2, 9)));

            $personalizacion = Personalizacion::create([
                'user_id' => $cliente->id, 'laptop_id' => $laptop->id, 'recomendacion_id' => $rec->id,
                'ram_gb' => $laptop->ram_gb, 'almacenamiento_gb' => $laptop->almacenamiento_gb, 'precio_total' => $laptop->precio_soles,
            ]);

            $pedido = Pedido::create([
                'codigo' => Pedido::nuevoCodigo(), 'user_id' => $cliente->id, 'personalizacion_id' => $personalizacion->id,
                'nombre' => $cliente->name, 'email' => $cliente->email, 'telefono' => '9'.str_pad((string) mt_rand(0, 99999999), 8, '0', STR_PAD_LEFT),
                'departamento' => 'Lima', 'ciudad' => 'Lima', 'direccion' => 'Dirección de demostración',
                'recojo_raee' => $recojo, 'raee_detalle' => $recojo ? 'Laptop anterior (demostración)' : null,
                'metodo_pago' => 'tarjeta_simulada', 'tarjeta_marca' => 'visa', 'tarjeta_ultimos4' => '4242',
                'subtotal' => $laptop->precio_soles, 'costo_envio' => 0, 'total' => $laptop->precio_soles, 'estado' => 'pagado',
            ]);
            $inventario->vender($pedido, $laptop);

            // Entregado entre 1 y 4 días después de pagar (para el ciclo de entrega del Dashboard).
            $pedido->update(['estado' => 'entregado']);
            $entrega = $fecha->copy()->addHours(mt_rand(24, 96));
            $this->fechar($pedido, $fecha, $entrega);
            $pedido->eventos()->where('estado', 'pagado')->update(['created_at' => $fecha]);
            $pedido->eventos()->where('estado', 'entregado')->update(['created_at' => $entrega]);
            MovimientoInventario::where('pedido_id', $pedido->id)->update(['created_at' => $fecha, 'updated_at' => $fecha]);
            $this->fechar($personalizacion, $fecha);
        });
    }

    // Lleva el registro a su fecha de demostración sin disparar eventos del modelo.
    private function fechar($modelo, Carbon $creado, ?Carbon $actualizado = null): void
    {
        $modelo->timestamps = false;
        $modelo->forceFill(['created_at' => $creado, 'updated_at' => $actualizado ?? $creado])->saveQuietly();
    }
}
