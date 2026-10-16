{{-- Páginas de error en español (Laravel trae las suyas en inglés). Sin Vite ni JavaScript:
     tienen que verse aunque lo que falló sea justamente la aplicación. --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('titulo') - IngeTech AI</title>
    <style>
        :root { --fondo: #f8fafc; --texto: #0c2340; --suave: #475569; --acento: #0284c7; --borde: #e2e8f0; }
        @media (prefers-color-scheme: dark) {
            :root { --fondo: #020617; --texto: #ffffff; --suave: #94a3b8; --acento: #22d3ee; --borde: rgba(255,255,255,.12); }
        }
        * { box-sizing: border-box; }
        body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px 16px;
               background: var(--fondo); color: var(--texto); font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
        main { max-width: 440px; text-align: center; }
        .marca { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: inherit; text-decoration: none; }
        .logo { width: 36px; height: 36px; border-radius: 10px; background: #22d3ee; color: #07111f; display: grid; place-items: center; }
        .codigo { margin: 32px 0 0; font-size: 56px; font-weight: 900; color: var(--acento); line-height: 1; }
        h1 { margin: 12px 0 0; font-size: 26px; }
        p { margin: 12px 0 0; color: var(--suave); line-height: 1.6; }
        .acciones { margin-top: 28px; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .boton { padding: 12px 20px; border-radius: 12px; font-weight: 700; text-decoration: none; border: 1px solid var(--borde); color: inherit; }
        .boton.principal { background: #22d3ee; border-color: #22d3ee; color: #07111f; }
    </style>
</head>
<body>
    <main>
        <a class="marca" href="/"><span class="logo">✦</span> IngeTech AI</a>
        <p class="codigo">@yield('codigo')</p>
        <h1>@yield('titulo')</h1>
        <p>@yield('mensaje')</p>
        <div class="acciones">
            <a class="boton principal" href="/">Ir a la tienda</a>
            <a class="boton" href="javascript:history.back()">Volver atrás</a>
        </div>
    </main>
</body>
</html>
