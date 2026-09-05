<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Modo del motor de recomendación (ver docs/adr/0003)
    |--------------------------------------------------------------------------
    | http -> Laravel llama por HTTP al servicio ml-engine (desarrollo con Docker)
    | cli  -> Laravel ejecuta python cli_entry.py como subproceso (producción)
    */
    'mode' => env('RECOMMENDER_MODE', 'http'),

    'url' => env('RECOMMENDER_URL', 'http://localhost:5001'),

    'cli' => env('RECOMMENDER_CLI', 'python ml-engine/cli_entry.py'),

    'timeout' => env('RECOMMENDER_TIMEOUT', 5),
];
