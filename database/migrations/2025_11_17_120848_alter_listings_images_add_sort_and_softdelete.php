<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('listings_images', function (Blueprint $table) {
            // SoftDeletes
            $table->softDeletes()->after('updated_at');

            // Sortierung
            $table->unsignedInteger('sort_order')->nullable()->after('image_path');

            // Optionale Metadaten
            $table->string('original_name')->nullable()->after('sort_order');
            $table->unsignedInteger('size')->nullable()->after('original_name'); // Bytes
            $table->string('mime', 100)->nullable()->after('size');

            // Indizes
            $table->index(['listing_id', 'sort_order']);
            $table->index('deleted_at');
        });
    }

    public function down(): void
    {
        Schema::table('listings_images', function (Blueprint $table) {
            $table->dropIndex(['listing_id', 'sort_order']);
            $table->dropIndex(['deleted_at']);

            $table->dropColumn(['mime', 'size', 'original_name', 'sort_order', 'deleted_at']);
        });
    }
};
