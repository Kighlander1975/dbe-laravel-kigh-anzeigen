@extends('layouts.app')

@section('title', 'Listing anzeigen - Kigh-Anzeigen')

@section('content')
    <h1>{{ $listing->name }}</h1>
    <p>{{ $listing->beschreibung }}</p>
    <p>Preis: {{ number_format($listing->preis, 2) }} €</p>
    @php
        $fallback = route('home');
        $prev = url()->previous();
        $current = url()->current();

        // Host aus App und aus $prev extrahieren
        $appHost = parse_url(config('app.url'), PHP_URL_HOST) ?: request()->getHost();
        $prevHost = $prev ? parse_url($prev, PHP_URL_HOST) : null;

        // Ist intern, wenn Host gleich ist ODER $prev relativ ist
        $isRelative = $prev && !parse_url($prev, PHP_URL_SCHEME);
        $isInternal = $isRelative || ($prev && $prevHost === $appHost);

        // Vermeide Self-Redirect
        $usePrev = $prev && $prev !== $current && $isInternal;

        $href = $usePrev ? $prev : $fallback;
    @endphp

    <a href="{{ $href }}" class="back-link">← Zurück zur Übersicht</a>
@endsection
