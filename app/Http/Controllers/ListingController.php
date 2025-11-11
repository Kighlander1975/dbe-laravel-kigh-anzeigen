<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Listing;
use Illuminate\Support\Facades\DB;

class ListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $listings = Listing::with('images')->latest()->get();
        return view('listings.index', compact('listings'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('listings.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id'   => 'required|exists:customers,id',
            'name'          => 'required|string|max:255',
            'beschreibung'  => 'required|string',
            'preis'         => 'required|numeric|min:0',
        ]);

        Listing::create([
            'customer_id'  => auth()->id() ?? $data['customer_id'],
            'name'         => $data['name'],
            'beschreibung' => $data['beschreibung'],
            'preis'        => $data['preis'],
        ]);

        return redirect()->route('listings.index')->with('success', 'Das Listing wurde erstellt.');
    }


    /**
     * Display the specified resource.
     */
    public function show(Listing $listing)
    {
        $listing->load('images');

        // Customer manuell laden (Variante A)
        $customer = null;
        if (!empty($listing->customer_id)) {
            $customer = DB::table('customers')->where('id', $listing->customer_id)->first();
        }

        return view('listings.show', compact('listing', 'customer'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Listing $listing)
    {
        return view('listings.edit', compact('listing'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Listing $listing)
    {
        $request->validate([
            'name' => 'required',
            'beschreibung' => 'required',
            'preis' => 'required|numeric',
        ]);

        $listing->update($request->only(['name', 'beschreibung', 'preis']));

        return redirect('/listings/' .  $listing->id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Listing $listing)
    {
        $listing->delete();
        return redirect('/listings');
    }
}
