<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Support\Roles;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        // `rol` no es asignable en masa: solo lo cambia un administrador (Admin\UsuarioController).
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Se envían al frontend junto con el usuario (menú y pestañas del panel).
     *
     * @var list<string>
     */
    protected $appends = ['is_admin', 'es_personal'];

    // Igual que el default de la columna: un usuario recién creado ya sabe que es cliente.
    protected $attributes = ['rol' => Roles::CLIENTE];

    /**
     * Atajo para "es administrador", calculado desde el rol. Asignarlo (p. ej. en el seeder o en
     * las pruebas: ['is_admin' => true]) pone el rol admin o cliente.
     */
    protected function isAdmin(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->rol === Roles::ADMIN,
            set: fn ($valor) => ['rol' => $valor ? Roles::ADMIN : Roles::CLIENTE],
        );
    }

    /** Personal de la tienda (cualquier rol que no sea cliente): entra al panel /admin. */
    protected function esPersonal(): Attribute
    {
        return Attribute::get(fn () => in_array($this->rol, Roles::PERSONAL, true));
    }

    public function puede(string $permiso): bool
    {
        return in_array($permiso, Roles::permisos($this->rol), true);
    }

    public function perfiles(): HasMany
    {
        return $this->hasMany(PerfilUsuario::class);
    }

    // Respuestas del cuestionario de bienvenida (una por cliente).
    public function preferencias(): HasOne
    {
        return $this->hasOne(PreferenciaCliente::class);
    }
}
