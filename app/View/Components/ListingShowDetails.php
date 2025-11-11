<?php

namespace App\View\Components;

use App\Models\Listing;
// Optional: Wenn das Customer-Model später hinzukommt, funktioniert das dank Union Type/Docblock sofort.
// use App\Models\Customer;
use Illuminate\View\Component;
use Illuminate\Contracts\View\View;
use Illuminate\Support\Arr;

class ListingShowDetails extends Component
{
    public Listing $listing;

    /**
     * Customer kann sein:
     * - null
     * - stdClass/array (rohe DB-Daten)
     * - Eloquent Model (später App\Models\Customer)
     */
    public mixed $customer;

    /**
     * Steuerung, ob sensible Felder (z. B. password) automatisch entfernt werden.
     */
    public bool $redactSensitive;

    /**
     * Welche Felder als sensibel gelten.
     */
    public array $sensitiveFields;

    /**
     * Normalisierte Ausgabe-Arrays für die View.
     */
    public array $listingAttributes = [];
    public array $imagesArray = [];
    public array $accessorData = [];
    public ?array $customerArray = null;

    public function __construct(
        Listing $listing,
        mixed $customer = null,
        bool $redactSensitive = true,
        array $sensitiveFields = ['password']
    ) {
        $this->listing = $listing;
        $this->customer = $customer;
        $this->redactSensitive = $redactSensitive;
        $this->sensitiveFields = $sensitiveFields;

        $this->prepareListing();
        $this->prepareImages();
        $this->prepareAccessors();
        $this->prepareCustomer();
    }

    protected function prepareListing(): void
    {
        // getAttributes gibt rohe DB-Felder des Eloquent-Modells zurück
        $this->listingAttributes = $this->listing->getAttributes();
    }

    protected function prepareImages(): void
    {
        if ($this->listing->relationLoaded('images') && $this->listing->images && $this->listing->images->count()) {
            $this->imagesArray = $this->listing->images->map(function ($img) {
                // Funktioniert für Eloquent-Model der Image-Relation
                return method_exists($img, 'getAttributes') ? $img->getAttributes() : (array) $img;
            })->all();
        } else {
            $this->imagesArray = [];
        }
    }

    protected function prepareAccessors(): void
    {
        // Beispiel: bekannte Accessors, die angezeigt werden sollen
        $maybe = ['first_image_url'];
        $data = [];
        foreach ($maybe as $key) {
            // isset triggert Accessor-Evaluation, falls vorhanden
            if (isset($this->listing->{$key})) {
                $data[$key] = $this->listing->{$key};
            }
        }
        $this->accessorData = $data;
    }

    protected function prepareCustomer(): void
    {
        if ($this->customer === null) {
            $this->customerArray = null;
            return;
        }

        // Normalisieren auf Array
        if (is_object($this->customer)) {
            // stdClass oder Eloquent-Model
            if (method_exists($this->customer, 'getAttributes')) {
                // Eloquent-Model (späteres Customer)
                $arr = $this->customer->getAttributes();
            } else {
                // stdClass von DB::table()->first()
                $arr = (array) $this->customer;
            }
        } elseif (is_array($this->customer)) {
            $arr = $this->customer;
        } else {
            // Unerwarteter Typ -> best effort
            $arr = ['value' => $this->customer];
        }

        // Optionale Schwärzung sensibler Felder
        if ($this->redactSensitive && !empty($this->sensitiveFields)) {
            $arr = Arr::except($arr, $this->sensitiveFields);
        }

        $this->customerArray = $arr;
    }

    public function render(): View
    {
        // Wir geben die normalisierten Arrays an die Blade-View
        return view('components.listing-show-details', [
            'listingAttributes' => $this->listingAttributes,
            'imagesArray' => $this->imagesArray,
            'accessorData' => $this->accessorData,
            'customerArray' => $this->customerArray,
            'redactSensitive' => $this->redactSensitive,
        ]);
    }
}
