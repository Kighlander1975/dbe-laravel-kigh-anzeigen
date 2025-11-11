@extends('layouts.app')

@section('title', 'Listing bearbeiten - Kigh-Anzeigen')

@section('content')
    <h1>Listing bearbeiten</h1>

    <img src="{{ $listing->first_image_url }}" alt="{{ $listing->name }}" width="400">

    <form action="{{ route('listings.update', $listing->id) }}" method="POST">
        @csrf
        @method('PUT')

        <label for="name">Name:</label>
        <input id="name" type="text" name="name" value="{{ old('name', $listing->name) }}">

        <label for="beschreibung">Beschreibung:</label>
        <textarea id="beschreibung" name="beschreibung">{{ old('beschreibung', $listing->beschreibung) }}</textarea>

        <label for="preis">Preis:</label>
        <input id="preis" type="number" step="0.01" name="preis" value="{{ old('preis', $listing->preis) }}">

        <button type="submit">Speichern</button>
    </form>

    <a href="{{ route('listings.show', $listing->id) }}">Zurück</a>
@endsection
