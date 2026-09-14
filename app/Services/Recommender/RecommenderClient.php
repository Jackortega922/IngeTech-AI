<?php

namespace App\Services\Recommender;

interface RecommenderClient
{
    /**
     * Envía el perfil al motor de recomendación y devuelve su respuesta ya
     * decodificada, con la forma definida en docs/arquitectura/contrato-motor.md.
     *
     * @throws RecommenderException
     */
    public function recomendar(array $payload): array;
}
