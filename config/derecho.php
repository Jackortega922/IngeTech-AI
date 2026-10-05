<?php

/**
 * Derecho del consumidor (Código de Protección y Defensa del Consumidor, Ley 29571).
 */
return [
    // Plazo para responder un reclamo: 15 días hábiles improrrogables (art. 24 de la Ley 29571,
    // modificado por la Ley 31435).
    'plazo_respuesta_dias_habiles' => 15,

    // Feriados nacionales de fecha fija (mes-día). Jueves y Viernes Santo cambian cada año y se
    // calculan aparte (App\Support\DiasHabiles). Si se declara un feriado nuevo, se agrega aquí.
    'feriados' => [
        '01-01', // Año Nuevo
        '05-01', // Día del Trabajo
        '06-07', // Batalla de Arica y Día de la Bandera
        '06-29', // San Pedro y San Pablo
        '07-23', // Día de la Fuerza Aérea del Perú
        '07-28', // Fiestas Patrias
        '07-29', // Fiestas Patrias
        '08-06', // Batalla de Junín
        '08-30', // Santa Rosa de Lima
        '10-08', // Combate de Angamos
        '11-01', // Todos los Santos
        '12-08', // Inmaculada Concepción
        '12-09', // Batalla de Ayacucho
        '12-25', // Navidad
    ],
];
