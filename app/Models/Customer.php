<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
// use App\Models\Listing; // Nur nötig, wenn Listing NICHT unter App\Models liegt.

class Customer extends Authenticatable
{
    use HasFactory, SoftDeletes, Notifiable;

    /**
     * Mass-assignable attributes.
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'plz',
        'ort',
        'strasse',
        'hausnummer',
        'telefonnummer',
        'role', // nur freigeben, wenn über Formulare änderbar
    ];

    /**
     * Hidden attributes when serialized.
     */
    protected $hidden = [
        'password',
        'remember_token',
        // 'role', // optional verstecken, falls nicht serialisieren
    ];

    /**
     * Attribute casting.
     */
    protected $casts = [
        'password' => 'hashed',
    ];

    // Rollen-Hierarchie: guest < customer < admin
    public const ROLE_ORDER = ['guest', 'customer', 'admin'];

    public function getPrimaryRole(): string
    {
        $role = $this->role ?: 'customer';
        return in_array($role, self::ROLE_ORDER, true) ? $role : 'customer';
    }

    public function isRole(string $role): bool
    {
        return $this->getPrimaryRole() === $role;
    }

    /**
     * Prüft, ob aktuelle Rolle mindestens die geforderte Stufe hat.
     * Beispiel: admin >= customer -> true
     */
    public function atLeast(string $role): bool
    {
        $current = array_search($this->getPrimaryRole(), self::ROLE_ORDER, true);
        $required = array_search($role, self::ROLE_ORDER, true);

        if ($current === false || $required === false) {
            return false;
        }

        return $current >= $required;
    }

    public function isCustomer(): bool
    {
        return $this->isRole('customer');
    }
    public function isAdmin(): bool
    {
        return $this->isRole('admin');
    }
    public function isGuest(): bool
    {
        return $this->isRole('guest');
    }

    /**
     * Beziehungen
     */
    public function listings()
    {
        return $this->hasMany(Listing::class);
    }

    public function favorites()
    {
        return $this->belongsToMany(Listing::class, 'favorites', 'customer_id', 'listing_id');
    }
}
