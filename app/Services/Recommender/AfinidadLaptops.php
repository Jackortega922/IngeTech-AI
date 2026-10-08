<?php

namespace App\Services\Recommender;

/**
 * Tercera operación del motor Python: ordena las laptops del comparador según el cuestionario de
 * bienvenida, con la misma función de afinidad que usa la recomendación con IA. Interfaz aparte,
 * igual que SegmentadorClientes. Contrato: docs/arquitectura/contrato-motor.md
 * ("Operación: afinidad").
 */
interface AfinidadLaptops
{
    /**
     * @param  array<string, mixed>  $preferencias  formato perfil.preferencias del contrato
     * @param  list<int>  $laptopIds
     *
     * @throws RecommenderException
     */
    public function afinidad(array $preferencias, array $laptopIds): array;
}
