<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('listings', function (Blueprint $table) {
            // Setze einen Standardwert für category_id
            $table->unsignedBigInteger('category_id')->default(0)->change();

            // Füge die Fremdschlüssel-Constraint hinzu
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('listings', function (Blueprint $table) {
            // Entferne die Fremdschlüssel-Constraint
            $table->dropForeign(['category_id']);

            // Setze die Spalte zurück (optional)
            $table->dropColumn('category_id');
        });
    }
};
