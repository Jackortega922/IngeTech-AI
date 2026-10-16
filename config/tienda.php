<?php

/**
 * Precios de la compra. El servidor recalcula el total con estos valores al registrar el
 * pedido (app/Services/Tienda/ArmadoLaptop.php): no confía en el precio que manda el navegador.
 * Si cambian, actualizar también SOLES_POR_GB_* en resources/js/pages/sistemas/personalizar/index.tsx
 * y COSTO_ENVIO en resources/js/pages/sistemas/checkout/index.tsx.
 */
return [
    'soles_por_gb_ram' => 12,
    'soles_por_gb_almacenamiento' => 0.25,
    // Envío gratis a todo el Perú (tienda hipotética: no hay tarifas reales todavía).
    'costo_envio' => 0,

    /*
    |--------------------------------------------------------------------------
    | Consumo eléctrico (Ingeniería Ambiental + Contabilidad)
    |--------------------------------------------------------------------------
    | kWh al año = potencia promedio en uso (W) × horas al día × días al año ÷ 1000.
    | La potencia sale de laptops.consumo_w o se estima (App\Support\ConsumoEnergetico).
    | La tarifa es el precio por kWh del recibo de luz (con IGV): mientras no se configure con un
    | dato verificado (TARIFA_KWH en .env, con su fuente), se muestran solo los kWh, no los soles.
    */
    'energia' => [
        'horas_por_dia' => 6,
        'dias_por_anio' => 300,
        'tarifa_soles_kwh' => env('TARIFA_KWH'),
        'tarifa_fuente' => env('TARIFA_KWH_FUENTE'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Contabilidad
    |--------------------------------------------------------------------------
    | Los precios del catálogo INCLUYEN IGV (como en cualquier tienda peruana: el precio que se
    | ve es el que se paga). La base imponible se obtiene dividiendo entre (1 + igv).
    */
    'igv' => 0.18,

    // Boleta de venta electrónica SIMULADA: serie fija y correlativo = id del pedido.
    'serie_boleta' => 'B001',

    // Emisor de la boleta. Tienda hipotética: se dejan vacíos en el .env y la boleta lo indica,
    // en vez de inventar una razón social o un RUC.
    'emisor' => [
        'razon_social' => env('TIENDA_RAZON_SOCIAL'),
        'ruc' => env('TIENDA_RUC'),
        'direccion' => env('TIENDA_DIRECCION'),
    ],

    // Vida útil contable de una laptop: la depreciación de "equipos de procesamiento de datos"
    // es como máximo 25% anual (Reglamento de la Ley del Impuesto a la Renta, art. 22), es decir,
    // 4 años. Se usa para el "costo por año de uso" que se muestra junto a la recomendación.
    'vida_util_anios' => 4,

    /*
    |--------------------------------------------------------------------------
    | Inventario (Administración)
    |--------------------------------------------------------------------------
    | Punto de reorden = demanda diaria × días que tarda en llegar la reposición + stock mínimo.
    | Tienda hipotética: no hay un proveedor real, así que estos plazos son supuestos editables.
    */
    'inventario' => [
        'ventana_demanda_dias' => 30, // ventas recientes con las que se estima la demanda
        'dias_reposicion' => 7, // cuánto tarda el proveedor en entregar
        'dias_cobertura' => 30, // para cuántos días alcanza un pedido de reposición
        // Demanda que ve la IA: con menos consultas en la ventana, que la IA no recomiende una laptop no
        // dice nada (no hubo a quién recomendársela), así que no se marcan "capital quieto" ni "no convence".
        'min_consultas_demanda' => 20,
    ],

    /*
    |--------------------------------------------------------------------------
    | Etiquetas de la vitrina (portada)
    |--------------------------------------------------------------------------
    | "Más vendido": las que más unidades vendieron en la ventana de Inventario.
    | "Nuevo": las últimas agregadas al catálogo, solo si entraron hace pocos días.
    */
    'vitrina' => [
        'etiquetas' => 3, // cuántas laptops llevan cada etiqueta, como máximo
        'dias_nuevo' => 30, // pasado este plazo una laptop deja de ser "Nuevo"
    ],
];
