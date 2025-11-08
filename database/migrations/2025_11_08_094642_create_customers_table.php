<?php

use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    use SoftDeletes;
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id(); // Automatische Primärschlüssel-ID
            $table->string('name'); // Benutzername
            $table->string('email')->unique(); // E-Mail-Adresse (eindeutig)
            $table->string('password'); // Verschlüsseltes Passwort
            $table->string('plz'); // Postleitzahl
            $table->string('ort'); // Wohnort
            $table->string('strasse'); // Straße
            $table->string('hausnummer'); // Hausnummer
            $table->string('telefonnummer'); // Telefonnummer
            $table->timestamps(); // Erstellt created_at & updated_at Spalten
            $table->softDeletes(); // Fügt ein deleted_at-Feld hinzu
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
