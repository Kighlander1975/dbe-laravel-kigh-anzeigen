<div class="meta-item meta-favorites" data-listing-id="{{ $listing->id }}">
    <span class="meta-ico" aria-hidden="true" role="img">
        <img src="{{ asset($iconPath) }}" alt="" width="16" height="16" loading="lazy" />
    </span>
    {{ $count }} {{ $label() }}
</div>
{{-- <x-favorites-count :listing="$listing" /> --}}