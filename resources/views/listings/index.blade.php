@extends('layouts.app')

@section('title', 'Listings anzeigen - Kigh-Anzeigen')

@section('content')

    <h1>Alle Listings</h1>
    <a href="{{ route('listings.create') }}">Neues Listing erstellen</a>

    @forelse ($listings as $listing)
        @include('listings.components.listing', ['listing' => $listing])
    @empty
        <p>Es gibt keine Anzeigen.</p>
    @endforelse
@endsection
