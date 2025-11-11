<div class="listing-meta">
  <h1 class="listing-meta__title">{{ $title }}</h1>
  <div class="listing-meta__row">
    @if($createdAt)
      <time class="listing-meta__date" datetime="{{ \Illuminate\Support\Carbon::parse($createdAt)->toIso8601String() }}">
        {{ \Illuminate\Support\Carbon::parse($createdAt)->format('d.m.Y') }}
      </time>
    @endif
    <div class="listing-meta__counters" aria-label="Zähler">
      <span class="listing-meta__favorites" aria-label="Favoriten">{{ $favoritesCount ?? 0 }} Favoriten</span>
      <span class="listing-meta__interested" aria-label="Interessenten">{{ $interestedCount ?? 0 }} Interessenten</span>
    </div>
  </div>
</div>
