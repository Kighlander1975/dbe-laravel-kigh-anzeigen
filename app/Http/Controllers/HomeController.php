<?php

namespace App\Http\Controllers;

use App\Models\Listing;

class HomeController extends Controller
{
    public function index()
    {
        $listings = Listing::latest()->get();
        return view('home', compact('listings'));
    }
}
