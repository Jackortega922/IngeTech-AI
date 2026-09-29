<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PedidoEvento extends Model
{
    // Solo se guarda cuándo ocurrió; un evento nunca se edita.
    const UPDATED_AT = null;

    protected $fillable = ['pedido_id', 'estado'];

    public function pedido(): BelongsTo
    {
        return $this->belongsTo(Pedido::class);
    }
}
