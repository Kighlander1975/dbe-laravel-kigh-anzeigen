<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

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

    // Ein Customer kann mehrere Listings haben
    public function listings() {
        return $this->hasMany(Listing::class);
    }

    // Ein Customer kann mehrere Listings favorisieren
    public function favorites() {
        return $this->belongsToMany(Listing::class, 'favorites');
    }
}
