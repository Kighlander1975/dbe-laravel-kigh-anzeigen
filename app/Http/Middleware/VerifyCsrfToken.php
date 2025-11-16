<?php
// app/Http/Middleware/VerifyCsrfToken.php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected $except = [
        '/perf/log',
        '/api/perf/log', // falls du den API-Pfad auch ausnehmen willst
    ];
}
