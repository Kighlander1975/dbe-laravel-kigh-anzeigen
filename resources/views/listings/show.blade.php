@extends('layouts.app')

@section('title', 'Listing anzeigen - Kigh-Anzeigen')

@section('content')
    <h1>{{ $listing->name }}</h1>
    <p>{{ $listing->beschreibung }}</p>
    <p>Preis: {{ number_format($listing->preis, 2) }} €</p>
    <a href="{{ route('listings.index') }}">Zurück zur Übersicht</a>
@endsection
