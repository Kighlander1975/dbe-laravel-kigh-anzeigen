@extends('layouts.app')

@section('title', 'Listing anzeigen - Kigh-Anzeigen')

@section('content')
    <h1>{{ $listing->name }}</h1>
    <p>{{ $listing->beschreibung }}</p>
    <p>Preis: {{ number_format($listing->preis, 2) }} €</p>
    @php
        // Setze hier deinen bevorzugten Fallback:
        // route('home') ODER route('listings.index')
        $fallback = route('home');

        $prev = url()->previous();

        // Optional: Nur interne URLs zulassen (verhindert externe Referrer)
        $isInternal = $prev && str_starts_with($prev, config('app.url'));

        $href = $prev && $prev !== url()->current() && $isInternal ? $prev : $fallback;
    @endphp

    <a href="{{ $href }}" class="back-link">← Zurück zur Übersicht</a>
@endsection
