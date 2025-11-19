@extends('layouts.app')

@section('title', 'Listing anzeigen - Kigh-Anzeigen')

@section('content')

    <!-- <img src="{{ $listing->first_image_url }}" alt="{{ $listing->name }}" width="400"> -->

    <x-listing-show-details :listing="$listing" :customer="$customer" :favorites-count="$favoritesCount" />

    @php
        $fallback = route('home');
        $prev = url()->previous();
        $current = url()->current();

        $appHost = parse_url(config('app.url'), PHP_URL_HOST) ?: request()->getHost();
        $prevHost = $prev ? parse_url($prev, PHP_URL_HOST) : null;

        $isRelative = $prev && !parse_url($prev, PHP_URL_SCHEME);
        $isInternal = $isRelative || ($prev && $prevHost === $appHost);

        $usePrev = $prev && $prev !== $current && $isInternal;

        // Zusatz: Wenn previous eine Edit-Seite ist, verwende listings.index
        $prevPath = $prev ? parse_url($prev, PHP_URL_PATH) : '';
        $cameFromEdit = $prevPath && strpos($prevPath, '/edit') !== false;

        if ($usePrev && $cameFromEdit) {
            $href = route('home');
        } else {
            $href = $usePrev ? $prev : $fallback;
        }
    @endphp

    <a href="{{ $href }}" class="btn btn-outline-primary back-link">← Zurück zur Übersicht</a>

@endsection
