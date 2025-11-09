@extends('layouts.app')

@section('title', 'Listings anzeigen - Kigh-Anzeigen')

@section('content')

<h1>Alle Listings</h1>
<a href="{{ route('listings.create') }}">Neues Listing erstellen</a>

@foreach ($listings as $listing)
    <div>
        <h2><a href="{{ route('listings.show', $listing->id) }}">{{ $listing->name }}</a></h2>
        <p>{{ $listing->beschreibung }}</p>
        <p>Preis: {{ number_format($listing->preis, 2) }} €</p>
        <a href="{{ route('listings.edit', $listing->id) }}">Bearbeiten</a>
        <form action="{{ route('listings.destroy', $listing->id) }}" method="POST">
            @csrf
            @method('DELETE')
            <button type="submit">Löschen</button>
        </form>
    </div>
@endforeach
@endsection