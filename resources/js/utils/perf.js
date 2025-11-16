// resources/js/utils/perf.js

// PERF UTILS (kapselt globales Rauschen)
export function perfInit(options = {}) {
    const enabled = typeof options.enabled === "boolean" ? options.enabled : true;
    const routePerfLog = options.routePerfLog || ""; // z. B. aus Blade injizieren
    const csrf = options.csrf || "";

    // Netzwerk standardmäßig deaktivierbar, um 419/429/500 zu vermeiden
    const disableNetwork = typeof options.disableNetwork === "boolean" ? options.disableNetwork : true;

    // Batching/Throttling-Optionen
    const useBatch = typeof options.useBatch === "boolean" ? options.useBatch : true;
    const flushInterval = Number.isFinite(options.flushInterval) ? options.flushInterval : 1000; // ms
    const maxPerFlush = Number.isFinite(options.maxPerFlush) ? options.maxPerFlush : 20; // Events pro Flush
    const sampleRate = Number.isFinite(options.sampleRate) ? options.sampleRate : 1; // 0..1

    const state = {
        enabled,
        navId: Math.random().toString(36).slice(2, 10),
        queue: [],
        flushing: false,
        timerId: null,
    };

    function scheduleFlush() {
        if (state.timerId != null) return;
        state.timerId = setTimeout(async () => {
            state.timerId = null;
            await flush();
        }, flushInterval);
    }

    async function flush() {
        if (state.flushing) return;
        if (!state.enabled || !routePerfLog || disableNetwork) return;
        const batch = state.queue.splice(0, maxPerFlush);
        if (batch.length === 0) return;
        state.flushing = true;
        try {
            if (useBatch) {
                await doSend(batch);
            } else {
                // Einzel-POSTs nacheinander (minimal drosseln)
                for (const item of batch) {
                    // eslint-disable-next-line no-await-in-loop
                    await doSend(item);
                }
            }
        } catch {
            // silent
        } finally {
            state.flushing = false;
            if (state.queue.length > 0) scheduleFlush();
        }
    }

    async function doSend(payload) {
        // harte Netzbremse
        if (disableNetwork || !routePerfLog) return;
        try {
            await fetch(routePerfLog, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
                },
                body: JSON.stringify(payload),
                keepalive: true,
                credentials: "same-origin",
            });
        } catch {
            // silent
        }
    }

    function enqueue(payload) {
        // Sampling
        if (Math.random() > sampleRate) return;
        state.queue.push(payload);
        scheduleFlush();
    }

    function sendImmediate(payload) {
        // Für Fälle, wo sofort gesendet werden soll (selten nutzen)
        if (disableNetwork || !routePerfLog) return;
        // nicht batchen
        doSend(payload);
    }

    function mark(phase, meta = {}) {
        if (!state.enabled) return;
        const payload = {
            nav_id: state.navId,
            phase,
            ts: Math.round(performance.now()),
            meta,
        };
        // Lokale Hook (nie network-blockierend)
        try { if (typeof window.sendPerf === "function") window.sendPerf(payload); } catch {}

        // In Queue (gedrosselt)
        enqueue(payload);
    }

    // optional: Sammeln in einem Frame (nutzt ebenfalls Queue/Batch)
    let rafId = null;
    const rafQueue = [];
    function markRaf(phase, meta = {}) {
        if (!state.enabled) return;
        rafQueue.push({ phase, meta, ts: Math.round(performance.now()) });
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            const items = rafQueue.splice(0, rafQueue.length);
            rafId = null;
            for (const it of items) {
                const payload = {
                    nav_id: state.navId,
                    phase: it.phase,
                    ts: it.ts,
                    meta: it.meta || {},
                };
                try { if (typeof window.sendPerf === "function") window.sendPerf(payload); } catch {}
                enqueue(payload);
            }
        });
    }

    // Exponieren minimal unter einem Namespace
    if (typeof window !== "undefined") {
        window.CPPerf = {
            mark,
            markRaf,
            setEnabled(v) {
                state.enabled = !!v;
            },
            get navId() {
                return state.navId;
            },
            // Runtime-Schalter, falls du testen willst
            enableNetwork() {
                // Achtung: erst aktivieren, wenn Backend bereit ist (APP_KEY/CSRF/Route ok)
                // eslint-disable-next-line no-undef
                state.enabled && (options.disableNetwork = false);
            },
            disableNetwork() {
                // eslint-disable-next-line no-undef
                options.disableNetwork = true;
            },
            flushNow: flush,
        };
    }
}

// Sichtbarkeit im nächsten Paint-Frame bestätigen (mit Timeout-Fallback)
export function nextPaintWithTimeout(timeoutMs = 200) {
    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            resolve();
        };
        const tid = setTimeout(finish, timeoutMs);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                clearTimeout(tid);
                finish();
            });
        });
    });
}

export function sendPerf(event) {
    try {
        if (typeof window.sendPerf === "function") {
            window.sendPerf(event);
            return;
        }
        if (window.CPPerf && typeof window.CPPerf.markRaf === "function") {
            const { phase, ...rest } = event || {};
            window.CPPerf.markRaf(phase || "perf_event", rest);
            return;
        }
        // Fallback: Konsole abschaltbar halten
        // console.debug("[perf]", event);
    } catch {
        // noop
    }
}

// Optional: global spiegeln, damit bestehender Code (initGallery/cpSetByIndex)
// weiter über window.nextPaintWithTimeout zugreifen kann.
if (typeof window !== "undefined") {
    if (typeof window.nextPaintWithTimeout !== "function") {
        window.nextPaintWithTimeout = nextPaintWithTimeout;
    }
}
