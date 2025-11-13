@extends('layouts.app')

@section('title', 'Registrierung - Kigh-Anzeigen')

@section('content')
    <div class="auth-container register">
        <div class="auth-header">
            <h1>Registrieren</h1>
            <p>Erstelle dein Konto und starte direkt durch</p>
        </div>

        <div class="auth-form register">
            <form method="POST" action="{{ route('register') }}">
                @csrf

                <div class="form-grid">
                    <!-- Linke Spalte -->
                    <div class="form-col">
                        <!-- Name -->
                        <div class="auth-field"
                            style="--icon-url: url('{{ asset('images/auth/auth-profile.svg') }}'); --icon-color:#1cb1b1;">
                            <span class="icon-mask" aria-hidden="true"></span>
                            <input type="text" name="name" required placeholder="Name" value="{{ old('name') }}">
                        </div>

                        <!-- Email -->
                        <div class="auth-field"
                            style="--icon-url: url('{{ asset('images/auth/auth-mail.svg') }}'); --icon-color:#1cb1b1;">
                            <span class="icon-mask" aria-hidden="true"></span>
                            <input type="email" name="email" required placeholder="E-Mail-Adresse"
                                value="{{ old('email') }}">
                        </div>

                        <!-- Passwort -->
                        <div class="auth-field"
                            style="--icon-url: url('{{ asset('images/auth/auth-unlock.svg') }}'); --icon-color:#1cb1b1;">
                            <span class="icon-mask" aria-hidden="true"></span>
                            <input type="password" name="password" minlength="8" required
                                placeholder="Passwort (min. 8 Zeichen)">
                        </div>

                        <!-- Passwort bestätigen -->
                        <div class="auth-field"
                            style="--icon-url: url('{{ asset('images/auth/auth-unlock.svg') }}'); --icon-color:#1cb1b1;">
                            <span class="icon-mask" aria-hidden="true"></span>
                            <input type="password" name="password_confirmation" minlength="8" required
                                placeholder="Passwort bestätigen">
                        </div>
                    </div>

                    <!-- Rechte Spalte -->
                    <div class="form-col">
                        <!-- Straße + Hausnummer als ein kombiniertes Feld -->
                        <div class="auth-field auth-field-inline"
                            style="--icon-url: url('{{ asset('images/auth/auth-home.svg') }}'); --icon-color:#1cb1b1;">
                            <span class="icon-mask" aria-hidden="true"></span>
                            <div class="input-duo" role="group" aria-label="Straße und Hausnummer">
                                <input type="text" name="strasse" required placeholder="Straße"
                                    value="{{ old('strasse') }}" class="street">
                                <input type="text" name="hausnummer" placeholder="HsNr." value="{{ old('hausnummer') }}"
                                    class="hsnr" inputmode="text" autocomplete="address-line2">
                            </div>
                        </div>


                        <!-- PLZ + Ort in einer Zeile (als ein gemeinsamer Block) -->
                        <div class="auth-field-combo">
                            <!-- PLZ mit Icon -->
                            <div class="auth-field is-narrow"
                                style="--icon-url: url('{{ asset('images/auth/auth-home.svg') }}'); --icon-color:#1cb1b1;">
                                <span class="icon-mask" aria-hidden="true"></span>
                                <input type="text" name="plz" required placeholder="PLZ" value="{{ old('plz') }}"
                                    inputmode="numeric" autocomplete="postal-code" pattern="[0-9]{5}" maxlength="5">
                            </div>

                            <!-- Ort OHNE Icon -->
                            <div class="auth-field no-icon">
                                <input type="text" name="ort" required placeholder="Ort" value="{{ old('ort') }}"
                                    autocomplete="address-level2">
                            </div>
                        </div>


                        <!-- Telefon -->
                        <div class="auth-field"
                            style="--icon-url: url('{{ asset('images/auth/auth-phone.svg') }}'); --icon-color:#1cb1b1;">
                            <span class="icon-mask" aria-hidden="true"></span>
                            <input type="text" name="telefonnummer" required placeholder="Telefonnummer"
                                value="{{ old('telefonnummer') }}">
                        </div>
                    </div>
                </div>

                <button type="submit" class="btn">Registrieren</button>
            </form>
        </div>

        <div class="auth-footer">
            <p>Schon ein Konto? <a href="{{ route('login') }}" class="register-links">Zum Login</a></p>
        </div>
    </div>
@endsection
