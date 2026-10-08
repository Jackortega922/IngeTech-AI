<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    // Asistente del chat (A13, ADR 0005): Gemini, plan gratuito de Google AI Studio, por su
    // endpoint compatible con OpenAI. Sin GEMINI_API_KEY el chat sigue funcionando con el
    // asistente por palabras clave de ChatbotController.
    // Correo en producción (ADR 0007). La clave se crea en Brevo → SMTP & API → API Keys.
    'brevo' => [
        'key' => env('BREVO_API_KEY'),
    ],

    'gemini' => [
        'key' => env('GEMINI_API_KEY'),
        'url' => env('GEMINI_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'),
        // Se prueban en orden. Primero los Flash-Lite: en el plan gratuito responden en ~3 s,
        // mientras los Flash suelen estar saturados (503) o tardar más de 30 s (medido el
        // 2026-10-08). Si un modelo falla o se retira, se pasa al siguiente.
        // gemma-4-26b-a4b-it (modelo abierto de Google, misma clave) tiene su propia capacidad:
        // respondió en ~5 s cuando todos los Gemini daban 503.
        'model' => env('GEMINI_MODEL', 'gemini-flash-lite-latest,gemma-4-26b-a4b-it,gemini-3.5-flash-lite,gemini-flash-latest'),
        'timeout' => (int) env('GEMINI_TIMEOUT', 8), // por modelo
        'espera_total' => (int) env('GEMINI_ESPERA_TOTAL', 20), // segundos, sumando todos los intentos
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
