<header>
    <div class="logos" title="Zur Startseite">
        <a href="{{ route('home') }}">
            <img src="{{ asset('images/kigh-anzeigen003-logo.png') }}" alt="Kigh-Anzeigen Logo" />
            <img src="{{ asset('images/LogoText.png') }}" alt="Kigh-Anzeigen Logo Text" />
        </a>
    </div>

    <div class="suche">
        <form class="suche-eingaben" action="{{ route('home') }}" method="GET">
            <input type="text" name="what" id="what" placeholder="Was suchst Du?" value="{{ request('what') }}" />
            <span class="trenner">|</span>
            <input type="text" name="where" id="where" placeholder="PLZ oder Ort" value="{{ request('where') }}" />
            <input type="submit" value="Suchen" />
        </form>
    </div>

    <div class="customer-menu">
        <ul>
            @guest
                <!-- Nicht eingeloggt: Login/Registrieren -->
                <li>
                    <a href="{{ route('login') }}" title="Anmelden">
                        <img src="{{ asset('images/profile.svg') }}" alt="Anmelden">
                    </a>
                </li>
            @endguest

            @auth
                <!-- Eingeloggt: Profil -->
                <li>
                    <a href="{{ route('profile') }}" title="Profil">
                        <img src="{{ asset('images/profile.svg') }}" alt="Profil">
                    </a>
                </li>

                <!-- Listing erstellen -->
                <li>
                    <a href="{{ route('listings.create') }}" title="Anzeige erstellen">
                        <img src="{{ asset('images/create_listing.svg') }}" alt="Anzeige erstellen">
                    </a>
                </li>

                <!-- Optional: Admin-Link -->
                @if(method_exists(auth()->user(), 'isAdmin') && auth()->user()->isAdmin())
                    <li>
                        <a href="{{ route('admin.dashboard') }}" title="Admin">
                            <img src="{{ asset('images/admin.svg') }}" alt="Admin">
                        </a>
                    </li>
                @endif

                <!-- Logout -->
                <li>
                    <form id="logout-form" method="POST" action="{{ route('logout') }}" class="d-none">
                        @csrf
                    </form>
                    <a href="{{ route('logout') }}"
                        title="Abmelden"
                        onclick="event.preventDefault(); document.getElementById('logout-form').submit();">
                        <img src="{{ asset('images/logout.svg') }}" alt="Abmelden" width="38">
                    </a>
                </li>
            @endauth
        </ul>
    </div>
</header>
