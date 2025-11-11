{{-- resources/views/components/listing-show-details.blade.php --}}

@props([
    'listingAttributes' => [],
    'imagesArray' => [],
    'accessorData' => [],
    'customerArray' => null,
    'redactSensitive' => true,
])

@php
    $thumbCount = is_countable($imagesArray ?? []) ? count($imagesArray) : 0;
    $firstImage = !empty($imagesArray) && isset($imagesArray[0]['image_path']) ? $imagesArray[0]['image_path'] : null;
@endphp

<section class="listing-details">
    <div class="row-1">
        <div class="current-picture" data-image-count="{{ $thumbCount }}">
            @if ($firstImage)
                <img src="{{ asset('storage/listing_images/' . $firstImage) }}" alt="" />
            @else
                <img src="{{ asset('images/placeholder.jpg') }}" alt="Platzhalter" />
            @endif

            <!-- Beispiel: Buttons direkt eingebunden (später wieder per JS generieren) -->
            @if ($thumbCount > 1)
                <button type="button" class="cp-nav cp-nav-prev" aria-label="Vorheriges Bild">
                    <span class="cp-icon-mask" aria-hidden="true"
                        style="
          background: currentColor;
          width:16px;height:16px;display:block;
          -webkit-mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
          mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
          transform: scaleX(-1);
        ">
                    </span>
                </button>

                <button type="button" class="cp-nav cp-nav-next" aria-label="Nächstes Bild">
                    <span class="cp-icon-mask" aria-hidden="true"
                        style="
          background: currentColor;
          width:16px;height:16px;display:block;
          -webkit-mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
          mask: url('{{ asset('images/chevron-right.svg') }}') center/16px 16px no-repeat;
        ">
                    </span>
                </button>
            @endif
        </div>


        <div class="thumb-pictures {{ $thumbCount > 3 ? 'is-scrollable' : '' }}">
            @if ($thumbCount > 3)
                <div class="arrow-up" aria-hidden="true"></div>
            @endif

            @forelse($imagesArray as $image)
                <div class="thumb-picture" data-index="{{ str_pad((string) $loop->iteration, 2, '0', STR_PAD_LEFT) }}">
                    <img src="{{ asset('storage/listing_images/' . ($image['image_path'] ?? '')) }}" alt="" />
                </div>
            @empty
                <p class="no-images">Keine Bilder vorhanden.</p>
            @endforelse

            @if ($thumbCount > 3)
                <div class="arrow-down" aria-hidden="true"></div>
            @endif
        </div>

        @php
            $seller = $customer ?? ($listing->customer ?? null);

            // Preis formatieren (nur wenn numerisch)
            $rawPrice = $listing->preis ?? null;
            $hasPrice = is_numeric($rawPrice);
            $priceFormatted = $hasPrice ? number_format((float) $rawPrice, 2, ',', '.') . '€' : null;

            // Adresse
            $street = trim(($seller->strasse ?? '') . ' ' . ($seller->hausnummer ?? ''));
            $city = trim(($seller->plz ?? '') . ' ' . ($seller->ort ?? ''));
        @endphp

        @if ($seller)
            <div class="seller-informations">
                <div class="seller-information" role="region" aria-label="Verkäuferdetails">
                    {{-- Anbieter --}}
                    @if (!empty($seller->name))
                        <div class="si-row">
                            <span class="si-ico" aria-hidden="true">
                                <img src="{{ asset('images/profile.svg') }}" alt="" width="18"
                                    height="18" loading="lazy">
                            </span>
                            <div class="si-content">
                                <div class="si-label">Angeboten von:</div>
                                <div class="si-value">{{ $seller->name }}</div>
                            </div>
                        </div>
                    @endif

                    {{-- Adresse --}}
                    @if ($street || $city)
                        <div class="si-row">
                            <span class="si-ico" aria-hidden="true">
                                <img src="{{ asset('images/location.svg') }}" alt="" width="18"
                                    height="18" loading="lazy">
                            </span>
                            <div class="si-content">
                                <div class="si-label">Adresse:</div>
                                <div class="si-value">
                                    @if ($street)
                                        <div>{{ $street }}</div>
                                    @endif
                                    @if ($city)
                                        <div>{{ $city }}</div>
                                    @endif
                                </div>
                            </div>
                        </div>
                    @endif

                    {{-- E-Mail (und optional Telefon) --}}
                    @if (!empty($seller->email) || !empty($seller->telefonnummer))
                        <div class="si-row">
                            <span class="si-ico" aria-hidden="true">
                                {{-- Kein Icon für Kontakt nötig; falls gewünscht, eigenes mail.svg ablegen --}}
                            </span>
                            <div class="si-content">
                                @if (!empty($seller->email))
                                    <div class="si-value"><a
                                            href="mailto:{{ $seller->email }}">{{ $seller->email }}</a></div>
                                @endif
                                @if (!empty($seller->telefonnummer))
                                    <div class="si-value"><a
                                            href="tel:{{ preg_replace('/\s+/', '', $seller->telefonnummer) }}">{{ $seller->telefonnummer }}</a>
                                    </div>
                                @endif
                            </div>
                        </div>
                    @endif

                    {{-- Preis --}}
                    @if ($hasPrice)
                        <div class="si-row si-price">
                            <span class="si-ico" aria-hidden="true">
                                <img src="{{ asset('images/euro.svg') }}" alt="" width="18" height="18"
                                    loading="lazy">
                            </span>
                            <div class="si-content">
                                <div class="si-label">Preis:</div>
                                <div class="si-value si-value-price">{{ $priceFormatted }}</div>
                            </div>
                        </div>
                    @endif
                </div>

                <div class="seller-action-buttons">
                    <button type="button" class="btn btn-outline-danger js-fav-toggle btn-inline btn-sizing"
                        aria-label="Zu Favoriten hinzufügen" aria-pressed="false"
                        data-heart-url="{{ asset('images/heart.svg') }}"
                        data-heart-broken-url="{{ asset('images/heart-broken.svg') }}" style="--btn-min-w: 8rem;">
                        <span class="js-fav-icon icon-mask" aria-hidden="true"
                            style="
                -webkit-mask-image: url('{{ asset('images/heart.svg') }}');
                mask-image: url('{{ asset('images/heart.svg') }}');
            "></span>
                        <span class="js-fav-text">Favorit</span>
                    </button>

                    <button type="button" class="btn btn-primary btn-inline btn-sizing"
                        aria-label="Verkäufer kontaktieren" style="--btn-min-w: 8rem; --btn-pad: .4rem .75rem;">
                        <span class="icon-mask-mail" aria-hidden="true"
                            style="
                -webkit-mask-image: url('{{ asset('images/mail-send.svg') }}');
                mask-image: url('{{ asset('images/mail-send.svg') }}');
            "></span>
                        <span class="btn-text">Kontakt</span>
                    </button>
                </div>
            </div>
        @endif
    </div>

    <div class="row-2">
        <h2 class="listing-title">{{ $listing->name }}</h2>

        <div class="listing-metas">
            <div class="meta-item meta-created">
                <span class="meta-ico" aria-hidden="true" role="img">
                    <img src="{{ asset('images/calender.svg') }}" alt="" width="16" height="16"
                        loading="lazy" />
                </span>
                @php
                    $createdRaw = $listing->created_at ?? null;
                    $created = $createdRaw ? \Carbon\Carbon::parse($createdRaw) : null;
                @endphp
                @if ($created)
                    <time datetime="{{ $created->toDateString() }}">
                        {{ $created->format('d.m.Y') }}
                    </time>
                @else
                    <span>—</span>
                @endif
            </div>

            <div class="meta-item meta-favorites">
                <span class="meta-ico" aria-hidden="true" role="img">
                    <img src="{{ asset('images/people.svg') }}" alt="" width="16" height="16"
                        loading="lazy" />
                </span>
                1 Person/en interessiert
            </div>
        </div>

        <div class="listing-description">{{ $listing->beschreibung }}</div> {{-- Einzeilig, damit keine Whitespaces am Anfang sind --}}
    </div>

</section>
