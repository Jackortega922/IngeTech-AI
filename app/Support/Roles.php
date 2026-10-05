<?php

namespace App\Support;

/**
 * Roles del personal de la tienda (Administración: separación de funciones). Cada rol ve solo
 * las secciones del panel que necesita para su trabajo; así, por ejemplo, quien cuenta el
 * almacén no puede anular ventas y quien lleva la contabilidad no puede cambiar precios.
 *
 * Los permisos coinciden con las pestañas de /admin; "pedidos.editar" separa ver los pedidos de
 * cambiarles el estado. El administrador tiene todos.
 */
class Roles
{
    public const CLIENTE = 'cliente';

    public const ADMIN = 'admin';

    public const PERSONAL = ['admin', 'ventas', 'almacen', 'contabilidad'];

    public const TODOS = ['cliente', ...self::PERSONAL];

    public const NOMBRES = [
        'cliente' => 'Cliente',
        'admin' => 'Administrador',
        'ventas' => 'Ventas',
        'almacen' => 'Almacén',
        'contabilidad' => 'Contabilidad',
    ];

    public const PERMISOS_ADMIN = [
        'dashboard', 'contabilidad', 'clientes', 'pedidos', 'pedidos.editar', 'inventario', 'reclamos',
        'marketing', 'hardware', 'software', 'carreras', 'usuarios',
    ];

    private const PERMISOS = [
        'ventas' => ['dashboard', 'clientes', 'pedidos', 'pedidos.editar', 'reclamos', 'marketing'],
        'almacen' => ['dashboard', 'inventario', 'hardware'],
        'contabilidad' => ['dashboard', 'contabilidad', 'pedidos'],
    ];

    /** @return list<string> */
    public static function permisos(?string $rol): array
    {
        return match (true) {
            $rol === self::ADMIN => self::PERMISOS_ADMIN,
            isset(self::PERMISOS[$rol]) => self::PERMISOS[$rol],
            default => [],
        };
    }
}
