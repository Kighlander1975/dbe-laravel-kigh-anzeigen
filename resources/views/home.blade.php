@extends('layouts.app')

@section('title', 'Kigh-Anzeigen - Der Kleinanzeigenmarkt von Kighlander')

@section('content')
    <h1>Alle Angebote</h1>
    <div class="listings-container">
        @foreach ($listings as $listing)
            <x-listing-card :listing="$listing" />
        @endforeach
    </div>
@endsection