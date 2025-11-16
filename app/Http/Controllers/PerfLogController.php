<?php
// app/Http/Controllers/PerfLogController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PerfLogController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Optional: Nur bestimmte Origins zulassen (auskommentiert lassen, falls nicht nötig)
            // $allowedOrigins = ['https://deine-domain.tld', 'http://localhost:3000'];
            // $origin = $request->headers->get('origin') ?: $request->headers->get('referer');
            // if ($origin && !collect($allowedOrigins)->contains(fn($o) => str_starts_with($origin, $o))) {
            //     return response()->noContent(); // 204
            // }

            // 1) Rohdaten begrenzen (z. B. max 100 KB)
            $raw = $request->getContent() ?? '';
            if (strlen($raw) > 100 * 1024) {
                // zu groß – abbrechen ohne Lärm
                return response()->noContent(); // 204
            }

            $payload = $request->json()->all() ?? [];

            // 2) Validierung: Entweder batch[] oder Einzel-Event
            //    Begrenze Batch-Größe (z. B. max 50 Items)
            if (isset($payload['batch']) && is_array($payload['batch'])) {
                $batch = array_slice($payload['batch'], 0, 50);
            } else {
                $batch = [[
                    'nav_id' => $payload['nav_id'] ?? null,
                    'phase'  => $payload['phase'] ?? null,
                    'ts'     => $payload['ts'] ?? null,
                    'meta'   => $payload['meta'] ?? [],
                ]];
            }

            // 3) Felder säubern/whitelisten und kappen
            $sanitize = static function (array $item): array {
                $allowed = [
                    'nav_id' => isset($item['nav_id']) ? (string)$item['nav_id'] : null,
                    'phase'  => isset($item['phase']) ? (string)$item['phase'] : null,
                    'ts'     => is_numeric($item['ts'] ?? null) ? (float)$item['ts'] : null,
                    'meta'   => is_array($item['meta'] ?? null) ? $item['meta'] : [],
                ];

                // Strings kappen (z. B. 256 Zeichen)
                foreach (['nav_id', 'phase'] as $k) {
                    if (is_string($allowed[$k]) && strlen($allowed[$k]) > 256) {
                        $allowed[$k] = substr($allowed[$k], 0, 256);
                    }
                }

                // Meta flach halten und PII vermeiden: nur erlaubte Keys
                $meta = [];
                $whitelist = ['route', 'ttfb', 'fcp', 'lcp', 'cls', 'fid', 'network', 'ua'];
                foreach ($allowed['meta'] as $k => $v) {
                    if (in_array($k, $whitelist, true)) {
                        // primitive Werte erzwingen
                        if (is_scalar($v)) {
                            $meta[$k] = $v;
                        } elseif (is_array($v)) {
                            $meta[$k] = json_encode(array_slice($v, 0, 20)); // begrenzen
                        } else {
                            $meta[$k] = (string)$v;
                        }
                    }
                }
                $allowed['meta'] = $meta;

                return $allowed;
            };

            foreach ($batch as $item) {
                $clean = $sanitize(is_array($item) ? $item : []);
                // Optional: auf Debug reduzieren, um Logflut zu vermeiden (APP_LOG_LEVEL steuern)
                // Log::debug('frontend_perf', $clean);
                Log::info('frontend_perf', $clean);
                // Optional: Queue/DB statt Logfile
                // PerfLogJob::dispatch($clean)->onQueue('perf');
            }
        } catch (\Throwable $e) {
            // Kontextvoll loggen, aber knapp
            Log::error('perf_store_error', [
                'msg'  => $e->getMessage(),
                'code' => (int) $e->getCode(),
                'type' => get_class($e),
            ]);
        }

        return response()->noContent(); // 204
    }
}
