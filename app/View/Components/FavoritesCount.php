<?php

namespace App\View\Components;

use App\Models\Listing;
use Illuminate\View\Component;

class FavoritesCount extends Component
{
    /**
     * Das Listing-Objekt.
     *
     * @var Listing
     */
    public $listing;

    /**
     * Icon-Pfad für die Anzeige.
     *
     * @var string
     */
    public $iconPath;

    /**
     * Create a new component instance.
     *
     * @param  Listing  $listing
     * @param  string|null  $iconPath
     * @return void
     */
    public function __construct(Listing $listing, $iconPath = null)
    {
        $this->listing = $listing;
        $this->iconPath = $iconPath ?: 'images/people.svg';
    }

    /**
     * Get the view / contents that represent the component.
     *
     * @return \Illuminate\Contracts\View\View|\Closure|string
     */
    public function render()
    {
        return view('components.favorites-count', [
            'count' => $this->listing->favoritedBy()->count()
        ]);
    }
    
    /**
     * Bestimmt den Text basierend auf der Anzahl.
     *
     * @return string
     */
    public function label()
    {
        $count = $this->listing->favoritedBy()->count();
        return $count == 1 ? 'Interesse' : 'Interessen';
    }
}
