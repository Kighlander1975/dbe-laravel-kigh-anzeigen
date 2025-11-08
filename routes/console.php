<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('db:ping', function () {
    $info = DB::selectOne('SELECT DATABASE() AS db, USER() AS user, VERSION() AS version');
    $threads = DB::selectOne('SHOW STATUS LIKE "Threads_connected"'); // Returns { Variable_name, Value }

    $db = $info->db ?? '(unknown)';
    $user = $info->user ?? '(unknown)';
    $version = $info->version ?? '(unknown)';
    $threadsVal = $threads->Value ?? '?';

    $this->info("DB: {$db} | User: {$user} | Version: {$version} | Threads: {$threadsVal}");
})->purpose('Quick DB connectivity check');

Artisan::command('db:health', function () {
    $info = DB::selectOne('SELECT DATABASE() AS db, USER() AS user, VERSION() AS version');

    // SHOW VARIABLES / STATUS geben Spalten "Variable_name" und "Value" zurück
    $varsRows = DB::select('SHOW VARIABLES WHERE Variable_name IN ("version_comment","character_set_server","collation_server","sql_mode")');
    $statusRows = DB::select('SHOW STATUS WHERE Variable_name IN ("Threads_connected","Uptime","Queries","Slow_queries")');

    // In Collections umwandeln und per Variable_name keyen
    $vars = collect($varsRows)->keyBy('Variable_name');
    $status = collect($statusRows)->keyBy('Variable_name');

    $versionComment = $vars['version_comment']->Value ?? 'MariaDB';
    $charset = $vars['character_set_server']->Value ?? '(unknown)';
    $collation = $vars['collation_server']->Value ?? '(unknown)';
    $sqlMode = $vars['sql_mode']->Value ?? '(none)';

    $threads = (int)($status['Threads_connected']->Value ?? 0);
    $uptime = (int)($status['Uptime']->Value ?? 0);
    $queries = (int)($status['Queries']->Value ?? 0);
    $slow = (int)($status['Slow_queries']->Value ?? 0);

    $fmt = function (int $s) {
        $h = intdiv($s, 3600); $s %= 3600;
        $m = intdiv($s, 60); $s %= 60;
        return sprintf('%02dh:%02dm:%02ds', $h, $m, $s);
    };

    $this->info("DB: " . ($info->db ?? '(unknown)'));
    $this->info("User: " . ($info->user ?? '(unknown)'));
    $this->info("Version: " . ($info->version ?? '(unknown)') . " ({$versionComment})");
    $this->info("Charset/Collation: {$charset} / {$collation}");
    $this->info("SQL_MODE: {$sqlMode}");
    $this->info("Threads: {$threads}");
    $this->info("Uptime: ".$fmt($uptime)." ({$uptime}s)");
    $this->info("Queries total: {$queries}");
    $slow > 0 ? $this->error("Slow queries: {$slow}") : $this->info("Slow queries: {$slow}");

    // Exit-Codes für CI/Monitoring: 0 = ok, 2 = Warnung (Slow Queries > 0)
    return $slow > 0 ? 2 : 0;
})->purpose('Display DB health information');

// Maschinenlesbare Metriken: JSON (default) oder Prometheus-Format (--format=prom)
Artisan::command('db:metrics {--format=json}', function () {
    $format = strtolower($this->option('format') ?? 'json');

    $info = DB::selectOne('SELECT DATABASE() AS db, USER() AS user, VERSION() AS version');

    $varsRows = DB::select('SHOW VARIABLES WHERE Variable_name IN ("version_comment","character_set_server","collation_server","sql_mode")');
    $statusRows = DB::select('SHOW STATUS WHERE Variable_name IN ("Threads_connected","Uptime","Queries","Slow_queries")');

    $vars = collect($varsRows)->keyBy('Variable_name');
    $status = collect($statusRows)->keyBy('Variable_name');

    $data = [
        'db' => $info->db ?? null,
        'user' => $info->user ?? null,
        'version' => $info->version ?? null,
        'version_comment' => $vars['version_comment']->Value ?? null,
        'character_set_server' => $vars['character_set_server']->Value ?? null,
        'collation_server' => $vars['collation_server']->Value ?? null,
        'sql_mode' => $vars['sql_mode']->Value ?? null,
        'threads_connected' => isset($status['Threads_connected']->Value) ? (int)$status['Threads_connected']->Value : null,
        'uptime_seconds' => isset($status['Uptime']->Value) ? (int)$status['Uptime']->Value : null,
        'queries_total' => isset($status['Queries']->Value) ? (int)$status['Queries']->Value : null,
        'slow_queries' => isset($status['Slow_queries']->Value) ? (int)$status['Slow_queries']->Value : null,
        'timestamp' => now()->toIso8601String(),
    ];

    if ($format === 'prom' || $format === 'prometheus' || $format === 'text') {
        $lines = [];
        $labels = function (array $pairs) {
            $flat = [];
            foreach ($pairs as $k => $v) {
                if ($v === null || $v === '') continue;
                // einfache Escapes für Labels
                $v = str_replace(['\\', '"', "\n"], ['\\\\', '\\"', ''], (string)$v);
                $flat[] = $k.'="'.$v.'"';
            }
            return '{'.implode(',', $flat).'}';
        };

        $baseLabels = [
            'db' => $data['db'] ?? '',
            'user' => $data['user'] ?? '',
            'version' => $data['version'] ?? '',
            'version_comment' => $data['version_comment'] ?? '',
            'charset' => $data['character_set_server'] ?? '',
            'collation' => $data['collation_server'] ?? '',
        ];

        $lines[] = '# HELP mariadb_threads_connected Current number of open connections';
        $lines[] = '# TYPE mariadb_threads_connected gauge';
        $lines[] = 'mariadb_threads_connected'.$labels($baseLabels).' '.((string)($data['threads_connected'] ?? 0));

        $lines[] = '# HELP mariadb_uptime_seconds Server uptime in seconds';
        $lines[] = '# TYPE mariadb_uptime_seconds counter';
        $lines[] = 'mariadb_uptime_seconds'.$labels($baseLabels).' '.((string)($data['uptime_seconds'] ?? 0));

        $lines[] = '# HELP mariadb_queries_total Total number of queries';
        $lines[] = '# TYPE mariadb_queries_total counter';
        $lines[] = 'mariadb_queries_total'.$labels($baseLabels).' '.((string)($data['queries_total'] ?? 0));

        $lines[] = '# HELP mariadb_slow_queries Total number of slow queries';
        $lines[] = '# TYPE mariadb_slow_queries counter';
        $lines[] = 'mariadb_slow_queries'.$labels($baseLabels).' '.((string)($data['slow_queries'] ?? 0));

        $this->line(implode("\n", $lines));
    } else {
        $this->line(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }
})->purpose('Output DB metrics as JSON or Prometheus text (use --format=prom)');

