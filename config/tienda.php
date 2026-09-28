<?php

/**
 * Precios de la personalización (pantalla /personalizar). El servidor recalcula el total con
 * estos valores al guardar la cotización — no confía en el precio que manda el navegador.
 * Si cambian, actualizar también SOLES_POR_GB_* en resources/js/pages/sistemas/personalizar/index.tsx.
 */
return [
    'soles_por_gb_ram' => 12,
    'soles_por_gb_almacenamiento' => 0.25,
];
