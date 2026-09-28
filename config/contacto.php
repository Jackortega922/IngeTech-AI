<?php

/**
 * Datos de contacto de la tienda que se muestran en la portada, el footer y el botón de
 * WhatsApp. Vienen del .env a propósito: cada empresa que use IngeTech AI pone los suyos, y
 * mientras no estén configurados la interfaz no inventa ninguno (los omite o lo indica).
 */
return [
    // Solo dígitos, con código de país y sin "+": 51 + número (ej. 51987654321).
    'whatsapp' => preg_replace('/\D/', '', (string) env('TIENDA_WHATSAPP', '')) ?: null,
    'email' => env('TIENDA_EMAIL'),
    'telefono' => env('TIENDA_TELEFONO'),
    'direccion' => env('TIENDA_DIRECCION'),
    'horario' => env('TIENDA_HORARIO'),

    'redes' => [
        'facebook' => env('TIENDA_FACEBOOK_URL'),
        'instagram' => env('TIENDA_INSTAGRAM_URL'),
        'tiktok' => env('TIENDA_TIKTOK_URL'),
        'youtube' => env('TIENDA_YOUTUBE_URL'),
    ],
];
