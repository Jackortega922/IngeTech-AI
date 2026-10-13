<?php

namespace App\Services\Marketing;

use App\Models\Cupon;
use App\Models\User;
use App\Services\Recommender\RecommenderException;
use App\Services\Recommender\SegmentadorClientes;
use App\Support\Roles;
use Illuminate\Support\Collection;

/**
 * A quiénes se le puede enviar un cupón por correo: los clientes de su grupo (la segmentación con
 * IA de ese momento, o todos si el cupón no es para un grupo) que aceptaron recibir ofertas y a
 * quienes todavía no se les envió.
 */
class DestinatariosCupon
{
    public function __construct(private DatosSegmentacion $datos, private SegmentadorClientes $motor) {}

    /**
     * @return array{en_grupo: int, aceptaron: int, ya_enviados: int, pendientes: Collection<int, User>}
     *
     * @throws RecommenderException si el motor no responde (solo para cupones de un grupo)
     */
    public function para(Cupon $cupon): array
    {
        $clientes = User::where('rol', Roles::CLIENTE);
        if ($cupon->segmento) {
            $clientes->whereIn('id', $this->idsDelGrupo($cupon->segmento));
        }
        $clientes = $clientes->get(['id', 'name', 'email', 'acepta_publicidad_at']);

        $aceptaron = $clientes->whereNotNull('acepta_publicidad_at');
        $yaEnviados = $cupon->envios()->pluck('user_id')->flip();

        return [
            'en_grupo' => $clientes->count(),
            'aceptaron' => $aceptaron->count(),
            'ya_enviados' => $aceptaron->filter(fn (User $u) => $yaEnviados->has($u->id))->count(),
            'pendientes' => $aceptaron->reject(fn (User $u) => $yaEnviados->has($u->id))->values(),
        ];
    }

    /** @return list<int> */
    private function idsDelGrupo(string $tipo): array
    {
        $respuesta = $this->motor->segmentar($this->datos->clientes());

        // Pocos clientes para agrupar (datos_insuficientes): nadie pertenece a un grupo.
        return collect($respuesta['segmentos'] ?? [])
            ->where('tipo', $tipo)
            ->flatMap(fn (array $s) => $s['clientes'] ?? [])
            ->values()
            ->all();
    }
}
