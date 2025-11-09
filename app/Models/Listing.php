<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Listing extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_id',
        'name',
        'beschreibung',
        'preis'
    ];

    // Ein Listing gehört zu einem Customer
    public function customer() {
        return $this->belongsTo(Customer::class);
    }

    // Ein Listing kann mehrere Bilder haben
    public function images() {
        return $this->hasMany(ListingImage::class);
    }

    // Ein Listing kann von mehreren Benutzern favorisiert werden
    public function favoritedBy() {
        return $this->belongsToMany(Customer::class, 'favorites');
    }
}
