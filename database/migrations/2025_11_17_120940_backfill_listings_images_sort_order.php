<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Weist pro Listing eine fortlaufende sort_order nach created_at/id zu
        $rows = DB::table('listings_images')
            ->select('id', 'listing_id')
            ->orderBy('listing_id')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        $currentListing = null;
        $pos = 0;

        foreach ($rows as $row) {
            if ($currentListing !== $row->listing_id) {
                $currentListing = $row->listing_id;
                $pos = 0;
            }
            DB::table('listings_images')->where('id', $row->id)->update(['sort_order' => $pos]);
            $pos++;
        }
    }

    public function down(): void
    {
        DB::table('listings_images')->update(['sort_order' => null]);
    }
};
