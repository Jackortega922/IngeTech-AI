# Onboarding — cómo dejar el proyecto corriendo

Guía pensada para quien **nunca configuró un proyecto así**. Si algo falla, avisa en el grupo
antes de seguir. No hace falta instalar PHP, Python ni Node en tu PC: todo corre dentro de Docker.

---

## 1. Instalar lo básico (una sola vez)

| Programa | Para qué | Descarga |
|---|---|---|
| **Git** | Bajar y subir el código | https://git-scm.com/download/win |
| **Visual Studio Code** | Editor de código | https://code.visualstudio.com |
| **Docker Desktop** | Levanta la base de datos y los servicios | https://www.docker.com/products/docker-desktop |
| **Cuenta de GitHub** | Para que te agreguen al repositorio | https://github.com |

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

Con Docker Desktop abierto, en la terminal del proyecto:

```bash
cp .env.example .env      # crea tu archivo de configuración local
docker compose up --build
```

La primera vez tarda varios minutos (descarga imágenes). Cuando veas los logs quietos, abre:

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:8000 |
| Motor de recomendación (documentación de la API) | http://localhost:5001/docs |
| Base de datos PostgreSQL | localhost:5432 (usuario/clave en `.env`) |

Para **detenerlo**: `Ctrl + C` en esa terminal, y luego `docker compose down`.

### Comandos útiles dentro del contenedor

```bash
docker compose exec app php artisan migrate        # aplica cambios de base de datos
docker compose exec app php artisan migrate:fresh --seed   # reinicia la BD con datos de ejemplo
docker compose exec app php artisan test           # corre las pruebas de Laravel
docker compose exec ml-engine pytest               # corre las pruebas del motor Python
```

> ⚠️ El archivo `docker-compose.yml` y el `Dockerfile` todavía son un esqueleto. Jack los completa
> en la fase de scaffold; hasta entonces este paso 4 puede no funcionar aún.

---

## 5. Opción alternativa: Dev Container (VS Code)

Si tienes la extensión **Dev Containers** de VS Code, abre el proyecto y acepta
*"Reopen in Container"*. VS Code arma el entorno completo solo. Ver `.devcontainer/`.

---

## 6. Siguiente paso

Lee [CONTRIBUTING.md](CONTRIBUTING.md) para saber cómo hacer cambios sin romper el trabajo de
los demás, y abre la ficha de tu módulo en [docs/modulos/](docs/modulos/).
