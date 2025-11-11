@extends('layouts.app')

@section('title', 'Listings anzeigen - Kigh-Anzeigen')

@section('content')

    <h1>Alle Listings</h1>
    <a class="btn btn-primary" href="{{ route('listings.create') }}">Neues Listing erstellen</a>

    @if (isset($listings) && $listings->isNotEmpty())
        <div class="listings-container">
            @foreach ($listings as $listing)
                <div class="with-action-buttons">
                    <x-listing-card :listing="$listing" />
                    <div class="action-buttons">
                        <div>
                            <a class="btn btn-outline-primary" href="{{ route('listings.edit', $listing->id) }}">Bearbeiten</a>
                        </div>
                        <div>
                            <form action="{{ route('listings.destroy', $listing->id) }}" method="POST">
                                @csrf
                                @method('DELETE')
                                <button class="btn btn-outline-warning" type="submit">Löschen</button>
                            </form>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>
    @else
        <p>Aktuell gibt es keine neuen Anzeigen.</p>
    @endif
@endsection
