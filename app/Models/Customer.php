<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Authenticatable
{
    use HasFactory, SoftDeletes, Notifiable;

    protected $fillable = [
        "name", 
        "email",
        "password",
        "plz",
        "ort",
        "strasse",
        "hausnummer",
        "telefonnummer"
    ];

    protected $hidden = [
        'password', 
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Ein Customer kann mehrere Listings haben
    public function listings() {
        return $this->hasMany(Listing::class);
    }

    // Ein Customer kann mehrere Listings favorisieren
    public function favorites() {
        return $this->belongsToMany(Listing::class, 'favorites');
    }
}
