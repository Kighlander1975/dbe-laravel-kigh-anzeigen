@extends('layouts.app')

@section('title', 'Login - Kigh-Anzeigen')

@section('content')
    <div class="auth-container">
        <div class="auth-header">
            <h1>Anmelden</h1>
            <p>Finde dein nächstes Lieblingsprodukt oder verkaufe einfach & schnell</p>
        </div>
        <div class="auth-form login">
            <form method="POST" action="{{ route('login') }}">
                @csrf

                <div class="auth-field" style="--icon-url: url('{{ asset('images/auth/auth-profile.svg') }}'); --icon-color:#1cb1b1;">
                    <span class="icon-mask icon-fancy" aria-hidden="true"></span>
                    <input id="email" type="email" name="email" required placeholder="E-Mail-Adresse">
                </div>

                <div class="auth-field" style="--icon-url: url('{{ asset('images/auth/auth-unlock.svg') }}'); --icon-color:#1cb1b1;">
                    <span class="icon-mask icon-fancy" aria-hidden="true"></span>
                    <input id="password" type="password" name="password" required placeholder="Passwort">
                </div>

                <button type="submit" class="btn">Login</button>
            </form>
        </div>


        <div class="auth-footer">
            <p>Du kannst Dich nicht einloggen? <a class="login-links" href="#">Passwort resetten</a></p>
            <p>Noch kein Konto? <a href="{{ route('register') }}" class="login-links">Jetzt Registrieren!</a></p>
        </div>

    </div>
@endsection
