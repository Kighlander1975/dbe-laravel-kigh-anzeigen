@extends('layouts.app')

@section('title', 'Listing erstellen - Kigh-Anzeigen')

@section('content')
    <h1>Neue Anzeige erstellen</h1>
    <form action="{{ route('listings.store') }}" method="POST" enctype="multipart/form-data">
        @csrf

        <input type="hidden" name="customer_id" value="1" />
        <label for="name">Name:</label>
        <input id="name" type="text" name="name" value="{{ old('name') }}" >

        <label for="beschreibung">Beschreibung:</label>
        <textarea id="beschreibung" name="beschreibung" rows="5">{{ old('beschreibung') }}</textarea>

        <label for="preis">Preis (€):</label>
        <input id="preis" type="number" name="preis" step="0.01" value="{{ old('preis') }}" >

        <button type="submit">Erstellen</button>
    </form>

    <a href="{{ route('listings.index') }}">Zurück zur Übersicht</a>
@endsection
