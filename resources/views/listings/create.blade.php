@extends('layouts.app')

@section('title', 'Listing erstellen - Kigh-Anzeigen')

@section('content')
<h1>Neues Listing erstellen</h1>
<form action="{{ route('listings.store') }}" method="POST">
    @csrf
    <input type="hidden" name="customer_id" value="1">
    <label>Name:</label>
    <input type="text" name="name">
    <label>Beschreibung:</label>
    <textarea name="beschreibung"></textarea>
    <label>Preis:</label>
    <input type="number" step="0.01" name="preis">
    <button type="submit">Erstellen</button>
</form>
<a href="{{ route('listings.index') }}">Zurück</a>
@endsection