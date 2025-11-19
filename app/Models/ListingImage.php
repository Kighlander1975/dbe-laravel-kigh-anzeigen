<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * App\Models\ListingImage
 *
 * @property int $id
 * @property int $listing_id
 * @property string $image_path
 * @property int|null $sort_order
 * @property string|null $original_name
 * @property int|null $size
 * @property string|null $mime
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property \Illuminate\Support\Carbon|null $deleted_at
 *
 * Beziehungen
 * @property-read \App\Models\Listing $listing
 *
 * Scopes
 * @method static Builder|ListingImage ordered()
 * @method static Builder|ListingImage query()
 * @method static Builder|ListingImage where($column, $operator = null, $value = null, $boolean = 'and')
 */
class ListingImage extends Model
{
    use SoftDeletes;

    /**
     * Die zugehörige Tabelle.
     *
     * @var string
     */
    protected $table = 'listings_images';

    /**
     * Mass-assignable Felder.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'listing_id',
        'image_path',
        'sort_order',
        'original_name',
        'size',
        'mime',
    ];

    /**
     * Casts für Attribute.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'size' => 'integer',
        'sort_order' => 'integer',
        'deleted_at' => 'datetime',
    ];

    /**
     * Zugehöriges Listing.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function listing()
    {
        return $this->belongsTo(Listing::class);
    }

    /**
     * Lokaler Scope: Standard-Sortierung für Bilder.
     *
     * @param Builder<self> $query
     * @return Builder<self>
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->orderBy('id');
        // Hinweis: orderByNullsLast() o.ä. nur falls DB-Treiber unterstützt.
    }
}
