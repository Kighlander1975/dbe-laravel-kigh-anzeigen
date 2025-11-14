<?php

namespace App\Http\Controllers;

use App\Models\Category;
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
        $categories = Category::all();
        return view('listings.create', compact('categories'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
   
        // Validierung der Formulardaten
        $validatedData = $request->validate([
            'name' => 'required',
            'beschreibung' => 'required',
            'preis' => 'required|numeric',
            'category_id' => 'required|exists:categories,id',
        ]);
   
        // Customer ID hinzufügen
        $validatedData['customer_id'] = auth()->id();
   
        // Neues Listing in der Datenbank speichern
        Listing::create($validatedData);
   
        // Benutzer zur Übersichtsseite weiterleiten
        return redirect()->route('home')->with('success', 'Artikel erfolgreich erstellt!');
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
        $categories = Category::all();
        return view('listings.edit', compact(['listing','categories']));
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
            'category_id' => 'required|exists:categories,id',
        ]);

        $listing->update($request->only(['name', 'beschreibung', 'preis', 'category_id']));

        return redirect('/listings/' .  $listing->id)->with('success', 'Artikel erfolgreich aktualisiert!');
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
