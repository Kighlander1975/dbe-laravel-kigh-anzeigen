<?php

use App\Http\Controllers\ListingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [ListingController::class, 'index'])->name('home');

// Optional, aber sinnvoll: eine Index-Route für /listings
Route::get('/listings', [ListingController::class, 'index'])->name('listings.index');

// Statische Routen zuerst
Route::middleware(['auth'])->group(function () {
Route::get('/listings/create', [ListingController::class, 'create'])->name('listings.create');
Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
Route::get('/listings/{listing}/edit', [ListingController::class, 'edit'])->name('listings.edit');
Route::put('/listings/{listing}', [ListingController::class, 'update'])->name('listings.update');
Route::delete('/listings/{listing}', [ListingController::class, 'destroy'])->name('listings.destroy');
});

// Dynamische Route danach und mit Constraint
Route::get('/listings/{listing}', [ListingController::class, 'show'])
->whereNumber('listing') // verhindert Match auf "create"
->name('listings.show');

require __DIR__.'/auth.php';