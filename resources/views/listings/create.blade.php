@extends('layouts.app')

@section('title', 'Listing erstellen - Kigh-Anzeigen')

@section('content')
  @include('listings.components.listing-form', [
    'action' => route('listings.store'),
    'method' => 'POST',
    'categories' => $categories,
    'listing' => null,
    'showImagesInfo' => false,
    'submitLabel' => 'Listing erstellen',
    'enctype' => 'multipart/form-data',
    'requiredCategory' => true,
  ])
@endsection
