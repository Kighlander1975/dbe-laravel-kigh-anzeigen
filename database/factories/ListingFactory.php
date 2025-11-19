<?php

namespace Database\Factories;

use App\Models\Listing;
use Illuminate\Database\Eloquent\Factories\Factory;

class ListingFactory extends Factory
{
    protected $model = Listing::class;

    public function definition(): array
    {
        return [
            'customer_id' => 1,
            'name' => $this->faker->sentence(3),
            'beschreibung' => $this->faker->paragraph(),
            'preis' => $this->faker->randomFloat(2, 10, 500),
            'category_id' => $this->faker->randomFloat(null, 1, 22),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Listing $listing) {
            foreach (range(1, 3) as $i) {
                \App\Models\ListingImage::create([
                    'listing_id' => $listing->id,
                    'image_path' => 'test.png',
                ]);
            }
        });
    }
}