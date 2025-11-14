@extends('layouts.app')

@section('title', 'Admin-Dashboard')

@section('content')
<div class="container py-4">
    <h1 class="mb-3">Admin-Dashboard</h1>

    <div class="card">
        <div class="card-body">
            <p class="mb-0">Willkommen im Adminbereich.</p>
            {{-- Beispiel für Kennzahlen:
            <ul class="mt-3">
                <li>Registrierte Nutzer: {{ $usersCount }}</li>
            </ul>
            --}}
        </div>
    </div>
</div>
@endsection
