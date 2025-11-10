<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Kigh-Anzeigen')</title>

    @vite(['resources/css/header.css', 'resources/css/footer.css'])
</head>
<body>
    @include('layouts.header')

    <main>@yield('content')</main>

    @include('layouts.footer')
</body>
</html>