<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

/**
 * App\Models\Listing
 *
 * @property int $id
 * @property int $customer_id
 * @property string $name
 * @property string|null $beschreibung
 * @property float|int|string $preis
 * @property int $category_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * Beziehungen/Accessors
 * @property-read \App\Models\Customer $customer
 * @property-read \Illuminate\Database\Eloquent\Collection<int,\App\Models\ListingImage> $images
 * @property-read \App\Models\ListingImage|null $first_image
 * @property-read string $first_image_url
 * @property-read \Illuminate\Database\Eloquent\Collection<int,\App\Models\Customer> $favoritedBy
 * @property-read \App\Models\Category $category
 */
class Listing extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Mass-assignable Felder.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'customer_id',
        'name',
        'beschreibung',
        'preis',
        'category_id',
    ];

    /**
     * Zentrales Fallback-Bild (liegt in public/images).
     */
    public const PLACEHOLDER = 'images/placeholder.jpg';

    /**
     * Ein Listing gehört zu einem Customer.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Ein Listing kann mehrere Bilder haben.
     * Nutzt den lokalen Scope ordered() von ListingImage.
     *
     * Hinweis für IDEs:
     * - Der Rückgabetyp ist HasMany, dessen Query-Builder ein Builder<ListingImage> ist.
     * - Der Aufruf ->ordered() wird vom lokalen Scope in ListingImage aufgelöst.
     *
     * @return HasMany<\App\Models\ListingImage>
     */
    public function images(): HasMany
    {
        /** @var HasMany<\App\Models\ListingImage> $relation */
        $relation = $this->hasMany(ListingImage::class, 'listing_id');

        // Für IDE-Genauigkeit die Sortierung optional direkt angeben:
        // return $relation->orderBy('sort_order')->orderBy('created_at')->orderBy('id');

        // Wenn du den Scope bevorzugst (läuft korrekt, IDE kann evtl. warnen):
        return $relation->ordered();
    }

    /**
     * Ein Listing kann von mehreren Benutzern favorisiert werden.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsToMany
     */
    public function favoritedBy()
    {
        return $this->belongsToMany(Customer::class, 'favorites');
    }

    /**
     * Erstes Image-Model (oder null) als Accessor.
     *
     * @return Attribute<\App\Models\ListingImage|null, never>
     */
    protected function firstImage(): Attribute
    {
        return Attribute::get(fn() => $this->images->first());
    }

    /**
     * Fertige URL inkl. Fallback als Accessor.
     * Normalisiert image_path, falls nur Dateiname gespeichert wurde.
     *
     * @return Attribute<string, never>
     */
    protected function firstImageUrl(): Attribute
    {
        return Attribute::get(function () {
            $path = optional($this->first_image)->image_path;

            if (!$path) {
                return asset(self::PLACEHOLDER);
            }

            // Leading slash entfernen
            $normalized = ltrim($path, '/');

            // Präfix ergänzen, falls nötig
            if (!Str::startsWith($normalized, 'listings_images/')) {
                $normalized = 'listings_images/' . $normalized;
            }

            // Variante 1 (dein aktueller Stil):
            return asset('storage/' . $normalized);

            // Variante 2 (äquivalent, wenn 'public' Disk genutzt wird):
            // return Storage::disk('public')->url($normalized);
        });
    }

    /**
     * Kategorie-Beziehung.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
