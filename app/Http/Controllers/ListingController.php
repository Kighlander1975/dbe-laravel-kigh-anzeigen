<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Customer;
use Illuminate\Http\Request;
use App\Models\Listing;
use Illuminate\Support\Facades\DB;
use App\Models\ListingImage;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class ListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    // Controller-Methode anpassen
    public function index(Request $request)
    {
        $query = Listing::query();

        // Join mit Customers-Tabelle, um nach Standort zu filtern
        $query->join('customers', 'listings.customer_id', '=', 'customers.id');

        // Filter nach Kategorie
        if ($request->filled('category')) {
            $query->where('category_id', (int) $request->category);
        }

        // Filter nach Standort (jetzt mit PLZ-Ort Format)
        if ($request->filled('location')) {
            // Hier nehmen wir an, dass 'location' jetzt im Format "PLZ Ort" ist
            $locationParts = explode(' ', $request->location, 2);
            if (count($locationParts) == 2) {
                $query->where('customers.plz', $locationParts[0])
                    ->where('customers.ort', $locationParts[1]);
            } else {
                // Fallback, falls nur ein Teil übergeben wird
                $query->where('customers.ort', $request->location);
            }
        }

        // Filter nach Preisbereich
        if ($request->filled('min_price') && is_numeric($request->min_price)) {
            $query->where('preis', '>=', (float) $request->min_price);
        }
        if ($request->filled('max_price') && is_numeric($request->max_price)) {
            $query->where('preis', '<=', (float) $request->max_price);
        }

        // Preisbereich-Filter
        if ($request->filled('price_range')) {
            // String "20-50" in zwei Werte zerlegen
            $prices = explode('-', $request->price_range);

            if (count($prices) == 2) {
                $minPrice = (float) $prices[0];
                $maxPrice = (float) $prices[1];

                $query->whereBetween('preis', [$minPrice, $maxPrice]);
            }
        }

        // Holen der Orte mit PLZ und effiziente Zählung der Listings pro Ort
        $locations = Customer::select(DB::raw("CONCAT(plz, ' ', ort) as location"), 'plz', 'ort')
            ->distinct()
            ->get()
            ->pluck('location');

        // Effiziente Methode zur Zählung der Listings pro Ort
        $locationCountsQuery = Listing::join('customers', 'listings.customer_id', '=', 'customers.id')
            ->select(DB::raw("CONCAT(customers.plz, ' ', customers.ort) as location"), DB::raw('count(*) as count'))
            ->groupBy('customers.plz', 'customers.ort');

        // Anwenden der Filter auf die Zählung, wenn vorhanden
        if ($request->filled('category')) {
            $locationCountsQuery->where('category_id', (int) $request->category);
        }

        if ($request->filled('min_price') && is_numeric($request->min_price)) {
            $locationCountsQuery->where('preis', '>=', (float) $request->min_price);
        }

        if ($request->filled('max_price') && is_numeric($request->max_price)) {
            $locationCountsQuery->where('preis', '<=', (float) $request->max_price);
        }

        if ($request->filled('price_range')) {
            $prices = explode('-', $request->price_range);
            if (count($prices) == 2) {
                $locationCountsQuery->whereBetween('preis', [(float) $prices[0], (float) $prices[1]]);
            }
        }

        $locationCounts = $locationCountsQuery->pluck('count', 'location')->toArray();

        $listings = $query->orderBy('listings.created_at', 'desc')->select('listings.*')->get();
        $categories = Category::all();

        return view('listings.index', compact('listings', 'categories', 'locations', 'locationCounts'));
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
        // Validierung
        $validated = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'beschreibung' => ['nullable', 'string'],
            'preis'        => ['required', 'numeric', 'min:0.01'],
            'category_id'  => ['required', 'exists:categories,id'],
            'images'       => ['nullable', 'array', 'max:10'],
            'images.*'     => ['nullable', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        // customer_id serverseitig ermitteln
        $validated['customer_id'] = auth()->id();
        abort_unless($validated['customer_id'], 403, 'Customer-ID konnte nicht ermittelt werden.');

        // Listing anlegen
        $listing = \App\Models\Listing::create($validated);

        // Bilder speichern: Datei in listings_images/ ablegen, in DB NUR den Dateinamen speichern
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $index => $file) {
                // Speichert Datei unter storage/app/public/listings_images/xyz.jpg
                $storedPath = $file->store('listings_images', 'public'); // liefert z.B. "listings_images/xyz.jpg"

                // Nur Dateiname extrahieren
                $filename = pathinfo($storedPath, PATHINFO_BASENAME); // "xyz.jpg"

                $listing->images()->create([
                    'image_path'    => $filename, // nur der Dateiname in der DB
                    'original_name' => $file->getClientOriginalName(),
                    'mime'          => $file->getClientMimeType(),
                    'size'          => $file->getSize(),
                    'sort_order'    => $index, // 0-basiert
                ]);
            }
        }

        return redirect()->route('listings.show', $listing)->with('success', 'Listing erstellt.');
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
        $listing->load('images');
        $categories = Category::all();
        return view('listings.edit', compact(['listing', 'categories']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Listing $listing)
    {
        // Prüfen, ob der aktuelle Benutzer der Besitzer des Listings ist
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        // Validierung aller Felder, inklusive Bilder
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'beschreibung' => 'required|string',
            'preis' => 'required|numeric|min:0.01',
            'category_id' => 'required|exists:categories,id',
            'images' => 'nullable|array|max:10',
            'images.*' => 'nullable|image|mimes:jpeg,png,webp|max:2048',
            'image_sort_order' => 'nullable|string', // JSON-String mit IDs
        ]);

        // Temporär füllen, um Änderungen zu erkennen
        $listing->fill([
            'name' => $validated['name'],
            'beschreibung' => $validated['beschreibung'],
            'preis' => $validated['preis'],
            'category_id' => $validated['category_id'],
        ]);

        // Prüfen, ob sich Textdaten geändert haben
        $textChanged = $listing->isDirty(['name', 'beschreibung', 'preis', 'category_id']);

        // Bilder und Sortierung verarbeiten
        $imagesChanged = false;
        $sortingChanged = false;

        // 1. Neue Bilder speichern, falls vorhanden
        if ($request->hasFile('images')) {
            $imagesChanged = true;

            // Aktuelle Anzahl der Bilder prüfen
            $currentCount = $listing->images()->count();
            $newCount = count($request->file('images'));
            $maxAllowed = 10;

            if ($currentCount + $newCount > $maxAllowed) {
                return redirect()->back()
                    ->withInput()
                    ->withErrors(['images' => "Maximal {$maxAllowed} Bilder erlaubt. Aktuell: {$currentCount}, Upload: {$newCount}"]);
            }

            // Höchste vorhandene Sortierreihenfolge ermitteln
            $startOrder = (int) ($listing->images()->max('sort_order') ?? -1) + 1;

            // Neue Bilder speichern
            foreach ($request->file('images') as $index => $file) {
                // Speichert Datei unter storage/app/public/listings_images/xyz.jpg
                $storedPath = $file->store('listings_images', 'public');

                // Nur Dateiname extrahieren
                $filename = pathinfo($storedPath, PATHINFO_BASENAME);

                $listing->images()->create([
                    'image_path' => $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'mime' => $file->getClientMimeType(),
                    'size' => $file->getSize(),
                    'sort_order' => $startOrder + $index,
                ]);
            }
        }

        // 2. Sortierreihenfolge aktualisieren, falls vorhanden
        if (isset($validated['image_sort_order']) && !empty($validated['image_sort_order'])) {
            try {
                $sortOrder = json_decode($validated['image_sort_order'], true);

                if (is_array($sortOrder) && count($sortOrder) > 0) {
                    // Prüfen, ob alle IDs zu diesem Listing gehören
                    $belongsCount = $listing->images()->whereIn('id', $sortOrder)->count();

                    if ($belongsCount === count($sortOrder)) {
                        // WICHTIG: Zuerst alle Bilder, die nicht in der neuen Sortierreihenfolge enthalten sind,
                        // mit einem sehr hohen Wert markieren, damit sie am Ende erscheinen
                        $listing->images()->whereNotIn('id', $sortOrder)->update(['sort_order' => 9999]);

                        // Dann die Sortierreihenfolge für die vorhandenen Bilder aktualisieren
                        foreach ($sortOrder as $position => $imageId) {
                            $listing->images()->where('id', $imageId)->update(['sort_order' => $position]);
                        }
                        $sortingChanged = true;
                    }
                }
            } catch (\Exception $e) {
                // Fehler beim Dekodieren des JSON oder bei der Aktualisierung
                Log::error('Fehler beim Aktualisieren der Bildreihenfolge: ' . $e->getMessage());
            }
        }


        // Änderungen speichern
        if ($textChanged) {
            $listing->save();
        }

        // Erfolgs- oder Info-Meldung basierend auf den Änderungen
        if ($textChanged || $imagesChanged || $sortingChanged) {
            $message = 'Artikel erfolgreich aktualisiert!';
            if ($imagesChanged) {
                $message .= ' Neue Bilder wurden hinzugefügt.';
            }
            if ($sortingChanged) {
                $message .= ' Bildreihenfolge wurde aktualisiert.';
            }
            return redirect('profile')->with('success', $message);
        } else {
            return redirect('profile')->with('info', 'Keine Änderungen erkannt.');
        }
    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Listing $listing, $imageId)
    {
        // Prüfen, ob der aktuelle Benutzer der Besitzer des Listings ist
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        // Bild finden
        $image = $listing->images()->findOrFail($imageId);

        // Speichere die aktuelle sort_order des zu löschenden Bildes
        $deletedSortOrder = $image->sort_order;

        // Bild löschen
        $image->delete();

        // Sortierreihenfolge der verbleibenden Bilder aktualisieren
        // Alle Bilder mit höherer sort_order um 1 verringern
        $listing->images()
            ->where('sort_order', '>', $deletedSortOrder)
            ->decrement('sort_order');

        // Datei aus dem Speicher löschen
        if (Storage::disk('public')->exists('listings_images/' . $image->image_path)) {
            Storage::disk('public')->delete('listings_images/' . $image->image_path);
        }

        return response()->json(['success' => true, 'message' => 'Bild erfolgreich gelöscht']);
    }


    // Zusatz-Methoden für AJAX Bild-Handling

    public function uploadImages(Request $request, Listing $listing)
    {
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        $currentCount = $listing->images()->count();
        $max = 10;

        $validator = Validator::make($request->all(), [
            'images'   => ['required', 'array', 'min:1'],
            'images.*' => ['file', 'image', 'mimes:jpeg,png,webp', 'max:2048'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Validierung fehlgeschlagen', 'errors' => $validator->errors()], 422);
        }

        $files = $request->file('images', []);
        if ($currentCount + count($files) > $max) {
            return response()->json([
                'message' => "Maximal {$max} Bilder erlaubt. Aktuell: {$currentCount}, Upload: " . count($files)
            ], 422);
        }

        $startOrder = (int) ($listing->images()->max('sort_order') ?? -1) + 1;

        $created = [];
        foreach ($files as $i => $file) {
            $storedPath = $file->store('listings_images', 'public'); // listings_images/xyz.jpg
            $filename = pathinfo($storedPath, PATHINFO_BASENAME);

            $image = $listing->images()->create([
                'image_path'    => $filename,
                'original_name' => $file->getClientOriginalName(),
                'mime'          => $file->getClientMimeType(),
                'size'          => $file->getSize(),
                'sort_order'    => $startOrder + $i,
            ]);

            $created[] = [
                'id'           => $image->id,
                'url'          => Storage::url('listings_images/' . $image->image_path),
                'thumb'        => Storage::url('listings_images/' . $image->image_path), // ggf. Thumb-Pfad anpassen
                'originalName' => $image->original_name,
                'sort_order'   => $image->sort_order,
            ];
        }

        return response()->json([
            'message' => 'Bilder hochgeladen',
            'images'  => $created,
            'count'   => $listing->images()->count(),
        ]);
    }

    public function sortImages(Request $request, Listing $listing)
    {
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        $data = $request->validate([
            'order'   => ['required', 'array', 'min:1'],
            'order.*' => ['integer', 'exists:listings_images,id'],
        ]);

        $ids = $data['order'];
        $belongs = ListingImage::whereIn('id', $ids)->where('listing_id', $listing->id)->count();
        if ($belongs !== count($ids)) {
            return response()->json(['message' => 'Ungültige Bild-ID(s) für dieses Listing'], 422);
        }

        DB::transaction(function () use ($ids) {
            foreach ($ids as $position => $imageId) {
                ListingImage::where('id', $imageId)->update(['sort_order' => $position]);
            }
        });

        return response()->json(['message' => 'Sortierung gespeichert']);
    }

    public function deleteImage(Listing $listing, ListingImage $image)
    {
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        if ($image->listing_id !== $listing->id) {
            return response()->json(['message' => 'Bild gehört nicht zu diesem Listing'], 422);
        }

        $filePath = 'listings_images/' . $image->image_path;

        // Speichere die aktuelle sort_order des zu löschenden Bildes
        $deletedSortOrder = $image->sort_order;

        DB::transaction(function () use ($image, $filePath, $listing, $deletedSortOrder) {
            // Wenn SoftDeletes genutzt werden sollen, entferne das physische Löschen hier
            if (method_exists($image, 'trashed')) {
                $image->delete(); // soft delete
            } else {
                Storage::disk('public')->delete($filePath);
                $image->delete();
            }

            // Sortierreihenfolge der verbleibenden Bilder aktualisieren
            // Alle Bilder mit höherer sort_order um 1 verringern
            $listing->images()
                ->where('sort_order', '>', $deletedSortOrder)
                ->decrement('sort_order');
        });

        return response()->json(['message' => 'Bild gelöscht']);
    }


    public function restoreImage(Listing $listing, $imageId)
    {
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        // Explizit das gelöschte Bild suchen
        $image = \App\Models\ListingImage::withTrashed()->findOrFail($imageId);

        if ($image->listing_id !== $listing->id) {
            return response()->json(['message' => 'Bild gehört nicht zu diesem Listing'], 422);
        }

        if (!$image->trashed()) {
            return response()->json(['message' => 'Bild ist nicht gelöscht'], 400);
        }

        $image->restore();

        return response()->json(['message' => 'Bild wiederhergestellt']);
    }


    public function imagesIndex(Request $request, Listing $listing)
    {
        if (auth()->id() !== $listing->customer_id) {
            abort(403);
        }

        $images = $listing->images()
            ->withTrashed() // aktivieren, falls SoftDeletes auf ListingImage
            ->orderBy('sort_order')
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->map(function ($img) {
                return [
                    'id'           => $img->id,
                    'url'          => \Illuminate\Support\Facades\Storage::url('listings_images/' . $img->image_path),
                    'thumb'        => \Illuminate\Support\Facades\Storage::url('listings_images/' . $img->image_path),
                    'originalName' => $img->original_name,
                    'sort_order'   => (int) $img->sort_order,
                    'deleted'      => method_exists($img, 'trashed') ? $img->trashed() : false,
                ];
            });

        return response()->json([
            'images' => $images,
            'count'  => $listing->images()->count(),
        ]);
    }
}
