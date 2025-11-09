@extends('layouts.app')

@section('title', 'Listing bearbeiten - Kigh-Anzeigen')

@section('content')
    <h1>Listing bearbeiten</h1>
    <form action="{{ route('listings.update', $listing->id) }}" method="POST">
        @csrf
        @method('PUT')
        <label>Name:</label>
        <input type="text" name="name" value="{{ $listing->name }}" required>
        <label>Beschreibung:</label>
        <textarea name="beschreibung" required>{{ $listing->beschreibung }}</textarea>
        <label>Preis:</label>
        <input type="number" step="0.01" name="preis" value="{{ $listing->preis }}" required>
        <button type="submit">Speichern</button>
    </form>
    <a href="{{ route('listings.index') }}">Zurück</a>
@endsection
