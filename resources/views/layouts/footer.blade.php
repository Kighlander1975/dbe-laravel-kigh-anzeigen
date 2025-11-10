<footer>
    <div class="logos">
        <a href="{{ route('listings.index') }}">
            <img src="{{ asset('images/kigh-anzeigen003-logo.png') }}" alt="Kigh-Anzeigen Logo" />
            <img src="{{ asset('images/LogoText.png') }}" alt="Kigh-Anzeigen Logo Text" />
        </a>
    </div>
    <div class="company">
        <h3>Unternehmen</h3>
        <ul>
            <li><a href="#">Über uns</a></li>
            <li><a href="#">Karriere</a></li>
            <li><a href="#">Newsletter</a></li>
            <li><a href="#">Hilfebereich</a></li>
        </ul>
    </div>

    <div class="disclaimer">
        <h3>Rechtliches</h3>
        <ul>
            <li><a href="#">Impressum</a></li>
            <li><a href="#">Datenschutz</a></li>
            <li><a href="#">AGB</a></li>
        </ul>
    </div>
    <div class="socials">
        <h3>Social Media</h3>
        <div class="social-icons">
            <ul>
                <li><a href="#"><img src="{{ asset('images/instagram.svg') }}" alt=""></a></li>
                <li><a href="#"><img src="{{ asset('images/facebook.svg') }}" alt=""></a></li>
                <li><a href="#"><img src="{{ asset('images/youtube.svg') }}" alt=""></a></li>
                <li><a href="#"><img src="{{ asset('images/tiktok.svg') }}" alt=""></a></li>
            </ul>
            <p>&copy; {{ date('Y') }} Kigh-Anzeigen. Alle Rechte vorbehalten.</p>
        </div>
    </div>
</footer>
