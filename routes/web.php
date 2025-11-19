<?php

use App\Http\Controllers\ListingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PerfLogController;

Route::get('/', [ListingController::class, 'index'])->name('home');

// Optionales Listing-Index
Route::get('/listings', [ListingController::class, 'index'])->name('listings.index');

// Auth-geschützte Bereiche
Route::middleware(['auth'])->group(function () {
    // CRUD (geschützt)
    Route::get('/listings/create', [ListingController::class, 'create'])->name('listings.create');
    Route::post('/listings', [ListingController::class, 'store'])->name('listings.store');
    Route::get('/listings/{listing}/edit', [ListingController::class, 'edit'])->name('listings.edit');
    Route::put('/listings/{listing}', [ListingController::class, 'update'])->name('listings.update');
    Route::delete('/listings/{listing}', [ListingController::class, 'destroy'])->name('listings.destroy');

    // Bilder-Endpoints fürs Edit (AJAX)
    // NEU: vorhandene Bilder laden (GET)
    Route::get('/listings/{listing}/images', [ListingController::class, 'imagesIndex'])->name('listings.images.index');

    Route::post('/listings/{listing}/images', [ListingController::class, 'uploadImages'])->name('listings.images.upload');
    Route::post('/listings/{listing}/images/sort', [ListingController::class, 'sortImages'])->name('listings.images.sort');
    Route::delete('/listings/{listing}/images/{image}', [ListingController::class, 'deleteImage'])->name('listings.images.delete');
    Route::post('/listings/{listing}/images/{image}/restore', [ListingController::class, 'restoreImage'])->name('listings.images.restore');

    // Profil
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile');
    Route::put('/profile/update', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::post('/listings/{id}/favorite', [ListingController::class, 'toggleFavorite'])
    ->middleware('auth')
    ->name('listings.favorite');

    // Admin
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
    });
});

// Show muss nach den statischen/CRUD-Routen kommen
Route::get('/listings/{listing}', [ListingController::class, 'show'])
    ->whereNumber('listing')
    ->name('listings.show');

// Performance-Logging
Route::post('/perf/log', [PerfLogController::class, 'store'])
    ->middleware('throttle:120,1')
    ->name('perf.log');

require __DIR__ . '/auth.php';
