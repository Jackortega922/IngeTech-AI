<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Registro de que un cupón se le envió por correo a un cliente (Marketing). */
class CuponEnvio extends Model
{
    protected $table = 'cupon_envios';

    public const UPDATED_AT = null;

    protected $fillable = ['cupon_id', 'user_id'];

    public function cupon(): BelongsTo
    {
        return $this->belongsTo(Cupon::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
