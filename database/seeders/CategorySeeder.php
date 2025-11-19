<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Elektronik', 'Banales', 'Kleidung', 'Möbel', 'Bücher', 'Spielzeug', 'Haushaltswaren', 'Autos', 'Motorräder',
            'Sammlerstücke', 'Musikinstrumente', 'Garten', 'Sport', 'Beauty', 'Werkzeuge', 'Lebensmittel',
            'Videospiele', 'Kunst', 'Bürobedarf', 'Filme', 'Tiere', 'sonstiges'
        ];

        foreach ($categories as $category) {
            DB::table('categories')->insert([
                'name' => $category,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}