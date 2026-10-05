# Modelo de datos — antes y después de la IA

Qué tablas tendría IngeTech AI como **tienda de laptops sin IA** y qué agrega la **IA** encima.
Los diagramas salen del esquema real de PostgreSQL (`php artisan migrate`, octubre de 2026).

> **Transparencia:** el "antes" no es una versión anterior que haya existido. El sistema se
> diseñó con IA desde el inicio; el primer diagrama es la **misma tienda quitándole la IA**, para
> que se vea con claridad qué tablas y columnas existen solo por ella.

No se dibujan las 8 tablas internas de Laravel (`cache`, `cache_locks`, `jobs`, `job_batches`,
`failed_jobs`, `sessions`, `migrations`, `password_reset_tokens`): no son del negocio.

Imágenes listas para presentar: [antes](img/modelo-datos-antes.png) ·
[después](img/modelo-datos-despues.png) · [flujo de datos de la IA](img/flujo-datos-ia.png).

## Resumen

| | Antes (tienda sin IA) | Después (con IA) |
|---|---|---|
| Tablas del negocio | 12 | 20 (**+8**) |
| Qué sabe del cliente | Lo que compra | Lo que hace, qué programas usa, su presupuesto y cómo es |
| Cómo elige el cliente | Busca y compara solo | La IA le recomienda con % de compatibilidad y explica por qué |
| Qué mide la tienda | Ventas | Ventas + calidad de la recomendación + conversión de la IA |

## 1. Antes: tienda de laptops convencional

Catálogo, armado de la compra, pedidos y la gestión de la tienda (inventario, cupones,
reclamos). El cliente navega el catálogo y decide solo.

```mermaid
erDiagram
    users ||--o{ pedidos : "compra"
    users ||--o{ personalizaciones : "arma"
    users ||--o{ reclamos : "presenta"
    users ||--o{ movimientos_inventario : "registra"
    laptops ||--o{ personalizaciones : "se configura en"
    laptops ||--o{ movimientos_inventario : "kardex"
    personalizaciones ||--o{ personalizacion_items : "incluye"
    personalizaciones ||--|| pedidos : "se paga en"
    kits ||--o{ accesorio_kit : "agrupa"
    accesorios ||--o{ accesorio_kit : "forma parte de"
    pedidos ||--o{ pedido_eventos : "historial de estado"
    pedidos ||--o{ movimientos_inventario : "descuenta stock"
    cupones ||--o{ pedidos : "descuenta"

    users {
        bigint id PK
        string name
        string email
        string rol "cliente, admin, ventas, almacen, contabilidad"
    }
    laptops {
        bigint id PK
        string marca
        string modelo
        string cpu
        smallint ram_gb
        int almacenamiento_gb
        string gpu
        decimal precio_soles
        int stock
        int stock_minimo
    }
    personalizaciones {
        bigint id PK
        bigint user_id FK
        bigint laptop_id FK
        smallint ram_gb
        int almacenamiento_gb
        decimal precio_total
    }
    personalizacion_items {
        bigint id PK
        bigint personalizacion_id FK
        string item_type "kit o accesorio"
        bigint item_id
    }
    kits {
        bigint id PK
        string nombre
        decimal precio_soles
    }
    accesorios {
        bigint id PK
        string nombre
        decimal precio_soles
    }
    accesorio_kit {
        bigint kit_id FK
        bigint accesorio_id FK
    }
    pedidos {
        bigint id PK
        string codigo
        string comprobante "boleta B001"
        bigint user_id FK
        bigint personalizacion_id FK
        bigint cupon_id FK
        decimal subtotal
        decimal descuento
        decimal total
        string estado
        bool recojo_raee
    }
    pedido_eventos {
        bigint id PK
        bigint pedido_id FK
        string estado
    }
    cupones {
        bigint id PK
        string codigo
        string tipo
        decimal valor
        int usos
    }
    reclamos {
        bigint id PK
        string numero "LR-00000001"
        bigint user_id FK
        string tipo "reclamo o queja"
        date fecha_limite
        string estado
    }
    movimientos_inventario {
        bigint id PK
        bigint laptop_id FK
        bigint pedido_id FK
        string tipo
        int cantidad
        int stock_resultante
    }
```

## 2. Después: la misma tienda con IA

Este diagrama muestra las **8 tablas nuevas** que existen por la IA y cómo se enganchan con la
tienda. Las tablas de la tienda siguen iguales (aquí se dibujan resumidas); solo ganan algunas
columnas que la IA necesita (ver la tabla de abajo).

```mermaid
erDiagram
    carreras ||--o{ carrera_software : "usa"
    software ||--o{ carrera_software : "lo usan"
    carreras ||--o{ perfiles_usuario : "de"
    users ||--o{ perfiles_usuario : "pide recomendación"
    users ||--o| preferencias_cliente : "responde cuestionario"
    perfiles_usuario ||--o{ recomendaciones : "recibe top 3"
    laptops ||--o{ recomendaciones : "es recomendada"
    recomendaciones ||--o{ eventos_analitica : "consulta y elección"
    recomendaciones ||--o{ personalizaciones : "se compra como"
    users ||--o{ pedidos : "compra"
    personalizaciones ||--|| pedidos : "se paga en"
    laptops ||--o{ personalizaciones : "se configura en"
    cupones ||--o{ pedidos : "descuenta"

    carreras {
        bigint id PK
        string clave
        string nombre
        string facultad
    }
    software {
        bigint id PK
        string clave
        string nombre
        smallint min_ram_gb
        smallint min_cpu_score
        bool min_gpu_dedicada
        smallint rec_ram_gb
        smallint rec_cpu_score
        bool rec_gpu_dedicada
    }
    carrera_software {
        bigint carrera_id FK
        bigint software_id FK
    }
    actividades {
        bigint id PK
        string clave
        smallint extra_ram_gb
        smallint extra_cpu_score
        bool requiere_gpu
    }
    perfiles_usuario {
        bigint id PK
        bigint user_id FK
        bigint carrera_id FK
        string nivel_experiencia
        json actividades
        json software
        decimal presupuesto_soles
        string tipo_uso
        timestamp consentimiento_at "Ley 29733"
    }
    preferencias_cliente {
        bigint id PK
        bigint user_id FK
        string movilidad
        string anios_uso
        json prioridades
        json marcas_evitar
        string estilo_decision
    }
    recomendaciones {
        bigint id PK
        bigint perfil_usuario_id FK
        bigint laptop_id FK
        smallint compatibilidad_pct "similitud coseno"
        json explicacion "factores y advertencias"
    }
    eventos_analitica {
        bigint id PK
        bigint recomendacion_id FK
        string tipo "consulta o eleccion"
        json payload
    }
    laptops {
        bigint id PK
        smallint ram_gb "rasgo del motor"
        smallint rendimiento_score "rasgo del motor (CPU)"
        bool gpu_dedicada "rasgo del motor"
        decimal peso_kg "afinidad"
        smallint bateria_horas "afinidad"
        int stock "agotadas no se recomiendan"
    }
    personalizaciones {
        bigint id PK
        bigint recomendacion_id FK "nueva: venta que vino de la IA"
        bigint laptop_id FK
    }
    pedidos {
        bigint id PK
        bigint personalizacion_id FK
        bigint cupon_id FK
        decimal total
    }
    cupones {
        bigint id PK
        string codigo
        string segmento "nueva: grupo hallado por K-Means"
    }
    users {
        bigint id PK
        string rol
    }
```

## Qué agrega la IA, tabla por tabla

### Tablas nuevas (8)

| Tabla | Para qué la usa la IA |
|---|---|
| `carreras` | Punto de partida opcional del perfil: cada carrera trae sus programas típicos. |
| `software` | Requisitos mínimos y recomendados (RAM, CPU, GPU) de cada programa: el motor toma el más exigente. |
| `carrera_software` | Qué programas usa cada carrera. |
| `actividades` | Cuánto pide cada actividad (RAM extra, CPU, GPU). Es la entrada del **clasificador** (regresión logística) y del vector ideal. |
| `perfiles_usuario` | Lo que el cliente cuenta de sí: actividades, programas, presupuesto. Con la fecha de **consentimiento** (Ley 29733). Es la entrada del motor. |
| `preferencias_cliente` | Cuestionario de bienvenida (Psicología): mueve el 30% de **afinidad** del puntaje. |
| `recomendaciones` | Salida del motor: laptop, **% de compatibilidad** y **explicación** (factores y advertencias). |
| `eventos_analitica` | Consultas y elecciones: de aquí salen los **KPIs** de la IA (tasa de elección, tiempo de decisión, cobertura). |

### Columnas nuevas en tablas que ya existían

| Columna | Por qué |
|---|---|
| `laptops.rendimiento_score` | Puntaje de CPU (0–100) que el motor compara contra lo que piden las actividades y programas. Una tienda sin IA no lo necesita. |
| `laptops.gpu_dedicada` (como 0/1) | Rasgo del vector de la laptop en la similitud coseno. |
| `personalizaciones.recomendacion_id` | Enlaza la compra con la recomendación que la originó: permite medir **qué ventas vienen de la IA**. |
| `cupones.segmento` | Grupo de clientes al que apunta el cupón, descubierto por la **segmentación con K-Means**. |

### Columnas de la tienda que la IA lee (sin cambiarlas)

- `laptops.peso_kg`, `bateria_horas`, `pantalla_*`, `puertos`, `ram_ampliable_gb`: criterios de **afinidad** con el cuestionario.
- `laptops.stock`: las agotadas se envían al motor en `opciones.excluir_ids` y **no se recomiendan**.
- `pedidos` (cantidad y gasto por cliente) y `perfiles_usuario`: entrada de la **segmentación** de Marketing. El motor recibe solo números, sin nombre ni correo.

### Lo que la IA no guarda en la base de datos

- **El modelo entrenado** (`ml-engine/recommender/modelo_perfilado.joblib`): es un archivo del motor.
- **El catálogo que lee el motor** (`ml-engine/data/laptops.json` y `software.json`): se exporta desde estas tablas con `php artisan motor:exportar-catalogo`.
- **Los segmentos de clientes**: se calculan al abrir el panel de Marketing y no se almacenan, así no quedan perfiles de personas guardados.

## Cómo fluyen los datos por la IA

```mermaid
flowchart LR
    A[perfiles_usuario + preferencias_cliente] -->|perfil sin nombre| M((Motor IA))
    C[laptops + software + actividades] -->|catálogo exportado| M
    S[laptops.stock = 0] -->|excluir_ids| M
    M --> R[recomendaciones]
    R --> E[eventos_analitica]
    R -->|recomendacion_id| P[personalizaciones → pedidos]
    E --> K[KPIs Industrial]
    P --> K
    P -->|compras y gasto| G((K-Means))
    A -->|presupuesto y consultas| G
    G --> CU[cupones.segmento]
```
