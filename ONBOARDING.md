# Onboarding — cómo dejar el proyecto corriendo

Guía pensada para quien **nunca configuró un proyecto así**. Si algo falla, avisa en el grupo
antes de seguir.

---

## 1. Instalar lo básico (una sola vez)

| Programa | Para qué | Descarga |
|---|---|---|
| **Git** | Bajar y subir el código | https://git-scm.com/download/win |
| **Visual Studio Code** | Editor de código | https://code.visualstudio.com |
| **Docker Desktop** | Levanta la base de datos y el motor de recomendación | https://www.docker.com/products/docker-desktop |
| **Laragon** (Windows) | Trae PHP 8.3, Composer y Node juntos | https://laragon.org |
| **Cuenta de GitHub** | Para que te agreguen al repositorio | https://github.com |

> Cuando exista el contenedor `app` (tarea A2), Laragon dejará de ser necesario y todo correrá en
> Docker. Por ahora la app Laravel se ejecuta en tu sistema.

Después de instalar Docker Desktop: ábrelo una vez y espera a que diga **"Engine running"**.
En Windows te puede pedir activar WSL2 — acepta y reinicia si lo pide.

Después de instalar Docker Desktop: ábrelo una vez y espera a que diga **"Engine running"**.
En Windows te puede pedir activar WSL2 — acepta y reinicia si lo pide.

Manda tu **usuario de GitHub** al grupo para que Jack te agregue como colaborador.

---

## 2. Configurar Git (una sola vez)

Abre **Git Bash** (o la terminal de VS Code) y pega, con tus datos:

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tucorreo@ejemplo.com"
```

---

## 3. Bajar el proyecto

```bash
cd ~/Documents            # o donde guardes tus proyectos
git clone https://github.com/Jackortega922/IngeTech-AI.git
cd IngeTech-AI
code .                    # abre el proyecto en VS Code
```

---

## 4. Levantar el proyecto

Mientras no exista el contenedor `app` (tarea A2), la base de datos y el motor corren en Docker y
la app Laravel corre en tu sistema. Necesitas además: **PHP 8.3**, **Composer** y **Node 20+**
(en Windows, Laragon los trae).

```bash
# 1. Base de datos + motor de recomendación (Docker Desktop abierto)
docker compose up -d db ml-engine

# 2. App Laravel
cp .env.example .env
composer install
npm install
php artisan key:generate
php artisan migrate

# 3. Arrancar (servidor + colas + Vite, todo junto)
composer run dev
```

Cuando esté corriendo, abre:

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:8000 |
| Motor de recomendación (documentación de la API) | http://localhost:5001/docs |
| Base de datos PostgreSQL | localhost:5432 (usuario/clave en `.env`) |

Para **detener**: `Ctrl + C` en la terminal de `composer run dev`, y `docker compose down`.

### Comandos útiles

```bash
php artisan migrate:fresh --seed    # reinicia la BD con datos de ejemplo
php artisan test                    # pruebas de Laravel (Pest)
./vendor/bin/pint                   # formatea el PHP
npm run lint                        # ESLint del frontend
npx tsc --noEmit                    # revisa los tipos de TypeScript
npm run format                      # Prettier del frontend
docker compose exec ml-engine pytest   # pruebas del motor Python
```

---

## 5. Opción alternativa: Dev Container (VS Code)

Si tienes la extensión **Dev Containers** de VS Code, abre el proyecto y acepta
*"Reopen in Container"*. VS Code arma el entorno completo solo. Ver `.devcontainer/`.

---

## 6. Siguiente paso

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para saber cómo hacer cambios sin romper el trabajo de
los demás, y abre la ficha de tu módulo en [docs/modulos/](docs/modulos/).
