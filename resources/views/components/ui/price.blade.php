@php
  $value = $value ?? null;
  $currency = $currency ?? 'EUR';
@endphp
<span class="ui-price">
  @if(!is_null($value))
    {{ number_format((float)$value, 2, ',', '.') }} {{ $currency }}
  @else
    —
  @endif
</span>
