<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
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

    // Zentrales Fallback-Bild (liegt in public/images)
    public const PLACEHOLDER = 'images/placeholder.jpg';

    // Ein Listing gehört zu einem Customer
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    // Ein Listing kann mehrere Bilder haben
    public function images()
    {
        return $this->hasMany(ListingImage::class)->orderBy('created_at'); // ältestes zuerst
        // oder ->orderByDesc('created_at') für jüngstes zuerst
    }

    // Ein Listing kann von mehreren Benutzern favorisiert werden
    public function favoritedBy()
    {
        return $this->belongsToMany(Customer::class, 'favorites');
    }

    // Erstes Image-Model (oder null) als Accessor
    protected function firstImage(): Attribute
    {
        return Attribute::get(fn() => $this->images->first());
    }

    // Fertige URL inkl. Fallback als Accessor
    protected function firstImageUrl(): Attribute
    {
        return Attribute::get(function () {
            $path = optional($this->first_image)->image_path;
            return $path
                ? asset('storage/listing_images/' . $path)
                : asset(self::PLACEHOLDER);
        });
    }
}
