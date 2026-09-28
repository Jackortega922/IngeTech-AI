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
];
