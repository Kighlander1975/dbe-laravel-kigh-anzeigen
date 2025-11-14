@extends('layouts.app')

@section('content')
    <div class="profile-container">

        <div class="profile-details">
            <div class="profile-infos">
                <h2>Profil-Infos</h2>
                <form method="POST" action="{{ route('profile.update') }}">
                    <div class="profile-info-form">
                        @method('PUT')
                        @csrf
                        <div class="input-container">
                            <div class="profile-input-left">
                                <div>
                                    <label for="name">Benutzername:</label>
                                    <input type="text" name="name" value="{{ auth()->user()->name }}" required>
                                </div>
                                <div>
                                    <label for="email">E-Mail:</label>
                                    <input type="email" name="email" value="{{ auth()->user()->email }}" required>
                                </div>
                                <div>
                                    <label for="telefonnummer">Telefonnummer:</label>
                                    <input type="text" name="telefonnummer" value="{{ auth()->user()->telefonnummer }}"
                                        required>
                                </div>
                            </div>
                            <div class="profile-input-right">
                                <div>
                                    <label for="plz">Adresse:</label>
                                    <input type="text" name="plz" value="{{ auth()->user()->plz }}" required>
                                </div>
                                <div>
                                    <label for="ort">Ort:</label>
                                    <input type="text" name="ort" value="{{ auth()->user()->ort }}" required>
                                </div>
                                <div>
                                    <label for="strasse">Straße:</label>
                                    <input type="text" name="strasse" value="{{ auth()->user()->strasse }}" required>
                                </div>
                                <div>
                                    <label for="hausnummer">Hausnummer:</label>
                                    <input type="text" name="hausnummer" value="{{ auth()->user()->hausnummer }}"
                                        required>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary"
                            style="--btn-min-w: 16rem; --btn-radius: 1rem; --btn-pad: .5rem 1rem;" type="submit">
                            <strong>Speichern</strong>
                        </button>
                    </div>
                </form>
            </div>
            <div class="change-password">
                <h2>Passwort ändern</h2>
                <form method="POST" action="{{ route('profile.password') }}">
                    @csrf
                    @method('PUT')
                    <div class="change-password-form">
                        <div>
                            <label for="old_password">Altes Passwort:</label>
                            <input type="password" name="old_password" required>
                        </div>
                        <div>
                            <label for="new_password">Neues Passwort:</label>
                            <input type="password" name="new_password" required>
                        </div>
                        <div>
                            <label for="new_password_confirmation">Neues Passwort bestätigen:</label>
                            <input type="password" name="new_password_confirmation" required>
                        </div>
                        <div>
                            <button class="btn btn-primary"
                                style="--btn-min-w: 16rem; --btn-radius: 1rem; --btn-pad: .5rem 1rem;" type="submit">
                                <strong>Passwort ändern</strong>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="profile-listings">
            <h2>Meine Anzeigen</h2>
            @if (auth()->user()->listings->count() > 0)
                <div class="listings-container">
                    @foreach (auth()->user()->listings as $listing)
                        <div class="with-action-buttons">
                            <x-listing-card :listing="$listing" />
                            @if (auth()->check() && auth()->user()->id === $listing->customer_id)
                                <div class="action-buttons">
                                    <div>
                                        <a class="btn btn-outline-primary"
                                            href="{{ route('listings.edit', $listing->id) }}">Bearbeiten</a>
                                    </div>
                                    <div>
                                        <form action="{{ route('listings.destroy', $listing->id) }}" method="POST">
                                            @csrf
                                            @method('DELETE')
                                            <button class="btn btn-outline-warning" type="submit">Löschen</button>
                                        </form>
                                    </div>
                                </div>
                            @endif
                        </div>
                    @endforeach
                </div>
            @else
                Du hast keine Anzeigen geschaltet.
            @endif
        </div>
        <div class="profile-favorites">
            <h2>Meine Favoriten</h2>
            @if (auth()->user()->favorites->count() > 0)
                @foreach (auth()->user()->favorites as $listing)
                    <x-listing-card :listing="$listing" />
                @endforeach
            @else
                Du hast keine Favoriten festgelegt.
            @endif
        </div>
    </div>
@endsection
