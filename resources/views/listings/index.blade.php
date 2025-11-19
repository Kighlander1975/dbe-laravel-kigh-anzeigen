@extends('layouts.app')

@section('title', 'Listings anzeigen - Kigh-Anzeigen')

@section('content')
    <h1>Alle Listings</h1>
    <div class="home-listings">
        <x-filter-sidebar :categories="$categories" :locations="$locations" :listings="$listings" :locationCounts="$locationCounts" />
        @if (isset($listings) && $listings->isNotEmpty())
            <div class="listings-container">
                @foreach ($listings as $listing)
                    <div class="with-action-buttons">
                        <x-listing-card :listing="$listing" />
                    </div>
                @endforeach
            </div>
        @elseif($listings->isEmpty())
            <p>Keine Anzeigen gefunden.</p>
        @else
            <p>Aktuell gibt es keine neuen Anzeigen.</p>
        @endif
    </div>
@endsection
