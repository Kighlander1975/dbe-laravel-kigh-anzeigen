@extends('layouts.app')

@section('title', 'Startseite - Kigh-Anzeigen')

@section('content')
    <h1>Willkommen bei Kigh-Anzeigen</h1>
    <p>Finde tolle Angebote oder stelle deine eigenen ein.</p>

    @if(isset($listings) && $listings->isNotEmpty())
        <div class="listings-container">
            @foreach ($listings as $listing)
                <x-listing-card :listing="$listing" />
            @endforeach
        </div>
    @else
        <p>Aktuell gibt es keine neuen Anzeigen.</p>
    @endif
@endsection
