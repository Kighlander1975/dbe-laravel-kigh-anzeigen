{{-- app.blade.php --}}
<!DOCTYPE html>
<html lang="de">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Kigh-Anzeigen')</title>

    @vite([
        'resources/css/header.css', 
        'resources/css/footer.css', 
        'resources/css/components/listings.css',
        'resources/css/components/flashmessages.css',
        'resources/css/components/show_listing.css',
        'resources/css/main.css'
    ])
</head>

<body>
    @include('layouts.header')
    <x-flash-message></x-flash-message>
    <main>@yield('content')</main>

    @include('layouts.footer')
    @vite([
        'resources/js/mein_js.js'
    ])
</body>

</html>
