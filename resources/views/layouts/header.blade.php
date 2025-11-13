<header>
    <div class="logos" title="Zur Startseite">
        <a href="{{ route('home') }}">
            <img src="{{ asset('images/kigh-anzeigen003-logo.png') }}" alt="Kigh-Anzeigen Logo" />
            <img src="{{ asset('images/LogoText.png') }}" alt="Kigh-Anzeigen Logo Text" />
        </a>
    </div>

    <div class="suche">
        <form class="suche-eingaben" action="{{ route('home') }}" method="GET">
            <input type="text" name="what" id="what" placeholder="Was suchst Du?" />
            <span class="trenner">|</span>
            <input type="text" name="where" id="where" placeholder="PLZ oder Ort" />
            <input type="submit" value="Suchen" />
        </form>
    </div>

    <div class="customer-menu">
        <ul>
            <li><a href="#"><img src="{{ asset('images/profile.svg') }}" alt="Profil"></a></li>
            <li><a href="#"><img src="{{ asset('images/create_listing.svg') }}" alt=""></a></li>
            <li><a href="#"><img src="{{ asset('images/heart.svg') }}" alt=""></a></li>
            @if (auth()->check())
                <li>
                    <form id="logout-form" method="POST" action="{{ route('logout') }}" class="d-none">
                        @csrf
                    </form>
                    <a href="{{ route('logout') }}"
                        onclick="event.preventDefault(); document.getElementById('logout-form').submit();"><img
                            src="{{ asset('images/logout.svg') }}" alt="" width="38"></a>
                </li>
            @endif
        </ul>
    </div>
</header>