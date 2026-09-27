<?php

use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Session\Middleware\StartSession;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // En producción (Render y cualquier PaaS parecido) el certificado TLS termina en el
        // proxy de la plataforma, que reenvía la petición al contenedor por HTTP plano. Sin
        // confiar en las cabeceras X-Forwarded-*, Laravel cree que la petición llegó por
        // http:// y genera los enlaces de los assets con ese esquema: el navegador los
        // bloquea por mixed content y la página queda en blanco.
        //
        // Confiar en '*' es seguro aquí porque el contenedor solo es alcanzable a través del
        // proxy de la plataforma, nunca directo desde internet.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->api(prepend: [
            ForceJsonResponse::class,
            // El SPA llama a /api/* con fetch() de mismo origen usando la
            // sesión del login normal (no hay tokens Sanctum), así que la
            // API necesita la sesión iniciada para saber quién es el usuario.
            EncryptCookies::class,
            StartSession::class,
        ]);

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
