<?php

namespace App\Http\Controllers;

use App\Models\Listing;

class HomeController extends Controller
{
    public function index()
    {
        $listings = Listing::with('images')->latest()->get();
        return view('home', compact('listings'));
    }
}
