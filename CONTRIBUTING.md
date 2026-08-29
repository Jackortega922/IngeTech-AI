# Cómo trabajar en equipo

Somos 3 personas en el mismo repositorio. Estas reglas evitan que nos pisemos el trabajo.
Si dudas, **pregunta en el grupo antes de hacer `push`**.

---

## Regla de oro

**Nadie escribe directo en `main`.** Todo cambio entra por una rama y un Pull Request (PR) que
Jack revisa antes de mezclar.

---

## Tu ciclo de trabajo (memorízalo)

```bash
# 1. Ponte al día con lo último de main
git checkout main
git pull

# 2. Crea tu rama para la tarea
git checkout -b feat/catalogo-crud-kits

# 3. Trabaja. Guarda cambios en commits pequeños y frecuentes
git add .
git commit -m "feat: formulario para crear kits"

# 4. Sube tu rama a GitHub
git push -u origin feat/catalogo-crud-kits

# 5. En GitHub: "Compare & pull request". Rellena la plantilla.
#    Espera a que el CI pase (verde) y a que Jack apruebe.

# 6. Cuando esté mezclado, vuelve a main y borra la rama
git checkout main
git pull
git branch -d feat/catalogo-crud-kits
```

---

## Nombres de rama

`tipo/modulo-descripcion-corta` — todo en minúsculas, con guiones.

| Ejemplo | Qué es |
|---|---|
| `feat/perfil-formulario-pasos` | funcionalidad nueva |
| `fix/resultado-porcentaje-nan` | corrección de un bug |
| `docs/manual-usuario-instalacion` | documentación |
| `chore/ci-cache-composer` | mantenimiento, config, CI |

---

## Mensajes de commit

Formato: `tipo: qué hace, en presente y en minúscula`.

```
feat: endpoint POST /api/recomendaciones
fix: corrige cálculo de compatibilidad cuando falta RAM
docs: agrega ficha del módulo de catálogo
test: pruebas del scorer con presupuesto bajo
```

Tipos: `feat`, `fix`, `docs`, `test`, `chore`, `refactor`.

---

## Reglas para que los PR se aprueben rápido

1. **PR pequeño.** Mejor 5 PR de 50 líneas que 1 de 500. Es más fácil de revisar y de arreglar.
2. **Quédate en tu carpeta.** Cada módulo tiene su zona (ver [docs/modulos/](docs/modulos/) y
   `.github/CODEOWNERS`). Si necesitas tocar algo de otro módulo, coordínalo antes.
3. **El CI tiene que estar verde.** Si sale rojo, abre los logs del job que falló y arréglalo
   (o pide ayuda). No se mezcla nada en rojo.
4. **Corre las pruebas en local** antes de subir:
   `docker compose exec app php artisan test` / `docker compose exec ml-engine pytest`.
5. **Describe qué probaste** en el PR: qué pantalla abriste, qué datos usaste, qué viste.

---

## Si aparecen conflictos de merge

Pasa cuando dos personas cambiaron lo mismo. No entres en pánico:

```bash
git checkout main
git pull
git checkout tu-rama
git merge main          # git te marca los archivos en conflicto
```

Abre cada archivo marcado, decide qué versión queda (o combina las dos), quita las líneas
`<<<<<<<`, `=======`, `>>>>>>>`, guarda, y:

```bash
git add .
git commit -m "merge: resuelve conflictos con main"
git push
```

Si no estás seguro de qué versión dejar, **pregunta antes de commitear**.

---

## Trabajando con IA (Claude / DeepSeek)

- Cada quien usa su asistente **dentro de su módulo**. Dale como contexto la ficha
  `docs/modulos/` correspondiente y el archivo `AGENTS.md`.
- La IA propone, **tú entiendes lo que entra**. Si no sabes explicar una línea de tu PR en la
  sustentación, no la subas todavía: pregúntale a la IA hasta entenderla.
- No dejes que la IA reescriba archivos de otro módulo "de paso". Revisa el diff antes de commitear.
