<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Modo del motor de recomendación (ver docs/adr/0003)
    |--------------------------------------------------------------------------
    | http -> Laravel llama por HTTP al servicio ml-engine (desarrollo con Docker)
    | cli  -> Laravel ejecuta python cli_entry.py como subproceso (producción)
    | mock -> motor local en PHP (MockRecommenderClient), sin Docker ni Python.
    |         Útil para levantar el frontend sin depender del Módulo A.
    */
    'mode' => env('RECOMMENDER_MODE', 'http'),

    'url' => env('RECOMMENDER_URL', 'http://localhost:5001'),

    'cli' => env('RECOMMENDER_CLI', 'python ml-engine/cli_entry.py'),

    /*
    | Segundos que se espera al motor. Arrancar Python e importar scikit-learn, numpy y
    | pandas cuesta ~3,5 s incluso en hardware rápido, y en una instancia con CPU limitada
    | (Render plan gratuito) se multiplica. Por eso el margen es amplio: el costo real es el
    | arranque del intérprete, no el cálculo.
    */
    'timeout' => env('RECOMMENDER_TIMEOUT', 30),
];
