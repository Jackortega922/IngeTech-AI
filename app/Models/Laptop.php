<?php

namespace App\Models;

use App\Support\ConsumoEnergetico;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Laptop extends Model
{
    use HasFactory;

    // Claves válidas de la columna `puertos` (las etiquetas legibles están en el frontend).
    public const PUERTOS = ['usb_a', 'usb_c', 'usb_c_carga', 'thunderbolt', 'hdmi', 'lector_sd', 'ethernet'];

    protected $fillable = [
        'marca',
        'modelo',
        'descripcion',
        'imagen_url',
        'tipo',
        'cpu',
        'ram_gb',
        'ram_ampliable_gb',
        'almacenamiento_gb',
        'almacenamiento_tipo',
        'gpu',
        'gpu_dedicada',
        'bateria_horas',
        'consumo_w',
        'pantalla_pulgadas',
        'pantalla_resolucion',
        'pantalla_hz',
        'peso_kg',
        'puertos',
        'precio_soles',
        'tienda',
        'rendimiento_score',
        // `stock` no va aquí a propósito: solo cambia por App\Services\Tienda\Inventario.
        'stock_minimo',
    ];

    // Consumo eléctrico al año (Ambiental + Contabilidad): lo ven el resultado de la IA y la tienda.
    protected $appends = ['consumo'];

    protected function casts(): array
    {
        return [
            'precio_soles' => 'decimal:2',
            'consumo_w' => 'integer',
            'gpu_dedicada' => 'boolean',
            'pantalla_pulgadas' => 'float',
            'peso_kg' => 'float',
            'puertos' => 'array',
            'stock' => 'integer',
            'stock_minimo' => 'integer',
        ];
    }

    protected function consumo(): Attribute
    {
        return Attribute::get(fn () => ConsumoEnergetico::de($this));
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoInventario::class);
    }

    public function recomendaciones(): HasMany
    {
        return $this->hasMany(Recomendacion::class);
    }
}
