<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PersonalizacionItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'personalizacion_id',
        'item_type',
        'item_id',
        'cantidad',
    ];

    public function personalizacion(): BelongsTo
    {
        return $this->belongsTo(Personalizacion::class);
    }

    public function item(): MorphTo
    {
        return $this->morphTo();
    }
}
