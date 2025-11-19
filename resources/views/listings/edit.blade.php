@extends('layouts.app')

@section('title', 'Listing bearbeiten - Kigh-Anzeigen')

@section('content')
  @include('listings.components.listing-form', [
    'action' => route('listings.update', $listing->id),
    'method' => 'PUT',
    'categories' => $categories,
    'listing' => $listing,
    'showImagesInfo' => true,
    'submitLabel' => 'Änderungen speichern',
    'enctype' => 'multipart/form-data',
    'requiredCategory' => true,
  ])
@endsection
