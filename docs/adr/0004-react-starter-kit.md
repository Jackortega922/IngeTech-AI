# ADR 0004 — Frontend con el React Starter Kit oficial (no Breeze)

- **Fecha:** 2026-08-28
- **Estado:** Aceptada
- **Reemplaza:** la decisión de usar Laravel Breeze del [ADR 0002](0002-stack-laravel-inertia-python.md)

## Contexto

El plan original era Laravel 11 + Breeze (stack Inertia + React). Al hacer el scaffold:

- `composer create-project laravel/laravel` instala **Laravel 12** (Laravel 11 ya está fuera de
  soporte de seguridad desde marzo 2026).
- Breeze 2.4 con Laravel 12/13 deja un `package.json` incoherente (Tailwind 3 y 4 mezclados,
  `@vitejs/plugin-react` incompatible con la versión de Vite) y el `npm install` falla.

## Decisión

Usar el **React Starter Kit oficial de Laravel** (`laravel/react-starter-kit`) como base del frontend:

- Laravel 12 · Inertia 2 · React 19 · **TypeScript** · Tailwind CSS 4 · Vite
- **shadcn/ui** ya integrado (era lo que queríamos según ADR 0002)
- Autenticación completa ya construida: login, registro, recuperación de contraseña,
  verificación de correo, 2FA, y páginas de ajustes de perfil
- ESLint 9 + Prettier + Pest, todo configurado y en verde

## Consecuencias

### A favor
- Base coherente y mantenida por el equipo de Laravel, sin pelear versiones.
- Menos trabajo: la autenticación y el sistema de componentes ya vienen hechos.
- Es lo que un jurado espera de un proyecto Laravel de 2026.

### En contra / a tener en cuenta
- **TypeScript** en vez de JavaScript plano. Es una curva extra para quien nunca programó, pero:
  shadcn/ui lo requiere, los asistentes de IA lo manejan bien, y los tipos evitan errores comunes.
  Se puede escribir "TypeScript flojo" al inicio (`any` donde haga falta) e ir apretando.
- Las páginas van en `resources/js/pages/` (minúscula) con archivos en `kebab-case`
  (ej. `pages/perfil/datos-basicos.tsx`). Los componentes de shadcn/ui viven en
  `resources/js/components/ui/`.
- Pruebas con **Pest** (encima de PHPUnit). `php artisan test` corre igual.

## Estado del scaffold

Verificado localmente y en CI: `pint`, `php artisan test` (26 pruebas), `eslint`, `tsc`,
`prettier`, `npm run build` y migraciones contra PostgreSQL — todo en verde.
