<?php

namespace App\Services\Recommender;

/**
 * Segunda operación del motor Python: segmentación de clientes con K-Means (Marketing). Va en una
 * interfaz aparte de RecommenderClient para que quien solo recomienda (y sus dobles de prueba)
 * no tenga que implementarla. Los clientes HTTP, CLI y mock implementan las dos.
 * Contrato: docs/arquitectura/contrato-motor.md ("Operación: segmentar").
 */
interface SegmentadorClientes
{
    /**
     * @param  list<array{id: int, presupuesto_soles: float, recomendaciones: int, pedidos: int, gasto_soles: float, dias_inactivo: int}>  $clientes
     *
     * @throws RecommenderException
     */
    public function segmentar(array $clientes): array;
}
