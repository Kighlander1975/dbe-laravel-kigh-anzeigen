// resources/js/fileUpload/fileUpload.js
/**
 * Datei-Upload-Funktionalität für Listings
 * Unterstützt CREATE und EDIT Modi mit Drag & Drop, Sortierung und Vorschau
 */

/**
 * Initialisiert die Datei-Upload-Funktionalität
 * @param {Object} userOptions - Benutzerdefinierte Konfigurationsoptionen
 * @returns {Object|undefined} - API-Objekt mit Methoden zur Steuerung des Uploads oder undefined bei Fehlern
 */
export function initFileUpload(container = null, userOptions = {}) {
    // ======================================
    // KONFIGURATION UND INITIALISIERUNG
    // ======================================
    // Wenn kein Container übergeben wurde, suche nach einem geeigneten Element
    if (!container) {
        container =
            document.querySelector(".upload-container") ||
            document.querySelector(".dropzone")?.parentElement ||
            document.querySelector(".dropzone");

        if (!container) {
            console.error(
                "FileUpload: Kein Container-Element gefunden oder übergeben"
            );
            return;
        }
    }

    const defaults = {
        maxFiles: 10,
        accept: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
        maxFileSizeBytes: 2 * 1024 * 1024, // 2MB
        selectors: {
            input: "#images",
            dropzone: ".dropzone",
            tagsContainer: "#file-tags",
            counter: ".upload-count",
            ariaLive: ".upload-aria-live",
            existingContainer: "#existing-images",
        },
        useExistingCountFromCounter: true,
        liveUpdateCounter: true,
        csrfToken: null,
        debug: true, // Debug-Modus aktivieren
    };

    // Konfiguration mit benutzerdefinierten Optionen zusammenführen
    const options = deepMerge(defaults, userOptions);

    // Listing-ID aus dem Container extrahieren
    const listingId = container.dataset.listingId || null;

    if (options.debug && listingId) {
        console.log(`FileUpload: Listing-ID erkannt: ${listingId}`);
    }

    // DOM-Elemente abrufen
    const input = document.querySelector(options.selectors.input);
    const dropzone = document.querySelector(options.selectors.dropzone);
    const tagsContainer = document.querySelector(
        options.selectors.tagsContainer
    );
    const counterEl = document.querySelector(options.selectors.counter);
    const existingContainer = document.querySelector(
        options.selectors.existingContainer
    );

    // Frühe Validierung - Prüfen, ob die erforderlichen Elemente vorhanden sind
    if (!input || !dropzone || !tagsContainer) {
        console.error("FileUpload: Erforderliche DOM-Elemente nicht gefunden");
        return;
    }

    // Daten-Endpunkte aus data-Attributen (nur bei EDIT vorhanden)
    const existingUrl = dropzone.getAttribute("data-existing-url") || null;
    const deleteUrlTpl = dropzone.getAttribute("data-delete-url") || null;
    const restoreUrlTpl = dropzone.getAttribute("data-restore-url") || null;

    // CSRF-Token abrufen
    const csrf = options.csrfToken || getCsrfFromMeta();

    // aria-live Element für Barrierefreiheit
    let ariaLiveEl = document.querySelector(options.selectors.ariaLive);
    if (!ariaLiveEl) {
        const section =
            dropzone.closest(".listing-section") ||
            dropzone.parentElement ||
            document.body;
        ariaLiveEl = document.createElement("div");
        ariaLiveEl.className = "upload-aria-live";
        ariaLiveEl.setAttribute("aria-live", "polite");
        ariaLiveEl.setAttribute("role", "status");
        section.appendChild(ariaLiveEl);
    }

    // Formular finden
    const form = input.closest("form");

    // Akzeptierte MIME-Typen und Dateierweiterungen
    const acceptedMimeTypes = new Set([
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
    ]);

    const acceptedExtensions = new Set(["jpg", "jpeg", "png", "webp"]);

    // ======================================
    // ZUSTANDSVERWALTUNG
    // ======================================

    // Zustandsvariablen
    const filesState = []; // neue, noch nicht hochgeladene Dateien
    const existingState = []; // vorhandene Bilder vom Server (EDIT)
    // Speichert die gemischte Reihenfolge von bestehenden und neuen Elementen
    const mixedOrderState = [];

    // Dynamisches Limit unter Einbeziehung vorhandener Bilder
    let dynamicMax = options.maxFiles;
    let initialExistingCount = 0;

    // Limit aus Counter-Element extrahieren, wenn vorhanden
    if (options.useExistingCountFromCounter && counterEl) {
        const text = counterEl.textContent || "";
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (match) {
            initialExistingCount = parseInt(match[1], 10) || 0;
            const totalAllowed = parseInt(match[2], 10) || options.maxFiles;
            dynamicMax = Math.max(0, totalAllowed - initialExistingCount);

            if (options.debug) {
                console.log(
                    `FileUpload: Initialer Zählerstand: ${initialExistingCount}/${totalAllowed}`
                );
                console.log(`FileUpload: Dynamisches Limit: ${dynamicMax}`);
            }
        }
    }

    // ======================================
    // BESTEHENDE BILDER LADEN (EDIT-MODUS)
    // ======================================
    if (existingUrl && existingContainer) {
        if (options.debug) {
            console.log(
                `FileUpload: Lade bestehende Bilder von ${existingUrl}`
            );
        }

        fetchExistingImages(existingUrl)
            .then((images) => {
                // Bilder in den Zustand übernehmen
                existingState.splice(0, existingState.length, ...images);

                // Debug-Ausgabe der geladenen Bilder
                if (options.debug) {
                    console.log(
                        `FileUpload: ${images.length} bestehende Bilder geladen:`
                    );
                    console.table(
                        images.map((img) => ({
                            id: img.id,
                            name: img.name,
                            size: img.size
                                ? formatBytes(img.size)
                                : "unbekannt",
                            sortOrder: img.sort_order,
                            deleted: img.deleted ? "Ja" : "Nein",
                        }))
                    );
                }

                // Falls Counter nicht verlässlich war, berechne dynamicMax neu
                if (!options.useExistingCountFromCounter) {
                    dynamicMax = Math.max(
                        0,
                        options.maxFiles - existingState.length
                    );
                    if (options.debug) {
                        console.log(
                            `FileUpload: Dynamisches Limit neu berechnet: ${dynamicMax}`
                        );
                    }
                }

                // UI aktualisieren - sowohl die bestehende Ansicht als auch die kombinierte Tag-Ansicht
                renderExisting();
                renderTags(); // Kombinierte Tag-Ansicht rendern
                liveUpdateCounter();

                // Sortieren für bestehende Bilder aktivieren

                enableSorting(
                    existingContainer,
                    ".existing-image",
                    (items) => {
                        // Neue gemischte Reihenfolge erstellen
                        const newMixedOrder = [];

                        // Für jedes Element in der neuen Reihenfolge
                        items.forEach((el, position) => {
                            if (el.dataset.id) {
                                const id = parseInt(el.dataset.id, 10);
                                if (!isNaN(id)) {
                                    newMixedOrder.push({
                                        type: "existing",
                                        id,
                                        position,
                                    });
                                }
                            } else if (el.dataset.newIndex) {
                                const index = parseInt(el.dataset.newIndex, 10);
                                if (!isNaN(index)) {
                                    newMixedOrder.push({
                                        type: "new",
                                        index,
                                        position,
                                    });
                                }
                            }

                            // Aktualisiere die Positionsnummer im UI
                            const indexEl = el.querySelector(
                                ".existing-image__index-badge"
                            );
                            if (indexEl) {
                                indexEl.textContent = String(position + 1);
                            }
                        });

                        if (options.debug) {
                            console.log(
                                "FileUpload: Vorschau-Sortierung - Neue Reihenfolge aktualisiert"
                            );
                            console.log(
                                "FileUpload: Bestehende Bilder:",
                                existingState.map((img) => ({
                                    id: img.id,
                                    name: img.name,
                                    sort_order: img.sort_order,
                                }))
                            );
                            if (filesState.length > 0) {
                                console.log(
                                    "FileUpload: Neue Dateien:",
                                    filesState.map((f) => f.name)
                                );
                            }
                        }

                        // Gemischte Reihenfolge speichern
                        mixedOrderState.splice(
                            0,
                            mixedOrderState.length,
                            ...newMixedOrder
                        );

                        // Bestehende Elemente neu sortieren (für die interne Verwaltung)
                        const existingItems = newMixedOrder.filter(
                            (item) => item.type === "existing"
                        );
                        if (existingItems.length > 0) {
                            // Sortiere existingState nach der neuen Reihenfolge
                            const map = new Map(
                                existingState.map((img) => [img.id, img])
                            );
                            const reorderedExisting = existingItems
                                .map((item) => map.get(item.id))
                                .filter(Boolean);

                            existingState.splice(
                                0,
                                existingState.length,
                                ...reorderedExisting
                            );
                            existingState.forEach(
                                (img, idx) => (img.sort_order = idx)
                            );
                        }

                        // Neue Dateien neu sortieren (für die interne Verwaltung)
                        const newItems = newMixedOrder.filter(
                            (item) => item.type === "new"
                        );
                        if (newItems.length > 0) {
                            // Erstelle eine Kopie des aktuellen filesState
                            const currentFiles = [...filesState];

                            // Erstelle einen neuen filesState in der richtigen Reihenfolge
                            const reorderedFiles = [];

                            // Füge Dateien in der neuen Reihenfolge hinzu
                            for (const item of newItems) {
                                if (
                                    item.index >= 0 &&
                                    item.index < currentFiles.length
                                ) {
                                    reorderedFiles.push(
                                        currentFiles[item.index]
                                    );
                                }
                            }

                            // Füge alle Dateien hinzu, die nicht in der neuen Reihenfolge enthalten sind
                            const usedIndices = new Set(
                                newItems.map((item) => item.index)
                            );
                            for (let i = 0; i < currentFiles.length; i++) {
                                if (!usedIndices.has(i)) {
                                    reorderedFiles.push(currentFiles[i]);
                                }
                            }

                            // Ersetze den filesState mit der neuen Reihenfolge
                            filesState.splice(
                                0,
                                filesState.length,
                                ...reorderedFiles
                            );
                        }

                        // UI aktualisieren
                        renderExisting();
                        renderTags();
                        announce("Sortierung aktualisiert.");
                    },
                    {
                        indexSelector: ".existing-image__index-badge",
                    }
                );
            })
            .catch((error) => {
                console.error("Fehler beim Laden bestehender Bilder:", error);
            });
    } else if (options.debug) {
        console.log(
            "FileUpload: Keine bestehenden Bilder zu laden (CREATE-Modus oder URL nicht konfiguriert)"
        );
    }

    // ======================================
    // EVENT-LISTENER
    // ======================================

    // Input-Change Event (Dateiauswahl über Dialog)
    input.addEventListener("change", (e) => {
        const selected = Array.from(e.target.files || []);
        if (options.debug) {
            console.log(
                `FileUpload: ${selected.length} Dateien über Dialog ausgewählt`
            );
        }
        handleFiles(selected);
        input.value = ""; // Input zurücksetzen
    });

    // Dropzone-Klick Event (öffnet Datei-Dialog)
    dropzone.addEventListener("click", (e) => {
        const isButton = e.target.closest(".select-files");
        if (!isButton) input.click();
    });

    // Drag & Drop Events
    ["dragenter", "dragover"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add("dropzone--hover");
        });
    });

    ["dragleave", "drop"].forEach((evt) => {
        dropzone.addEventListener(evt, (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (evt === "drop") {
                const dt = e.dataTransfer;
                const dropped = Array.from(dt?.files || []);
                if (options.debug) {
                    console.log(
                        `FileUpload: ${dropped.length} Dateien per Drag & Drop hinzugefügt`
                    );
                }
                handleFiles(dropped);
            }
            dropzone.classList.remove("dropzone--hover");
        });
    });

    // Sortieren für Tags aktivieren
    enableSorting(
        tagsContainer,
        ".file-tag",
        (items) => {
            // Debug-Ausgabe der sortierten Elemente
            if (options.debug) {
                console.log(
                    "FileUpload: Tag-Sortierung - Elemente:",
                    items.map((el) => ({
                        kind: el.dataset.kind,
                        id: el.dataset.id || null,
                        index: el.dataset.index || null,
                    }))
                );
            }

            // Neue gemischte Reihenfolge erstellen
            const newMixedOrder = [];

            // Für jedes Element in der neuen Reihenfolge
            items.forEach((el, position) => {
                const kind = el.dataset.kind;

                if (kind === "existing") {
                    const id = parseInt(el.dataset.id, 10);
                    if (!isNaN(id)) {
                        newMixedOrder.push({ type: "existing", id, position });
                    }
                } else if (kind === "new") {
                    const index = parseInt(el.dataset.index, 10);
                    if (!isNaN(index)) {
                        newMixedOrder.push({ type: "new", index, position });
                    }
                }

                // Aktualisiere die Positionsnummer im UI
                const indexEl = el.querySelector(".file-tag__index");
                if (indexEl) {
                    indexEl.textContent = String(position + 1);
                }
            });

            if (options.debug) {
                console.log(
                    "FileUpload: Tag-Sortierung - Reihenfolge aktualisiert"
                );
                console.log(
                    "FileUpload: Bestehende Bilder:",
                    existingState.map((img) => ({
                        id: img.id,
                        name: img.name,
                        sort_order: img.sort_order,
                    }))
                );
                if (filesState.length > 0) {
                    console.log(
                        "FileUpload: Neue Dateien:",
                        filesState.map((f) => f.name)
                    );
                }
            }

            // Gemischte Reihenfolge speichern
            mixedOrderState.splice(0, mixedOrderState.length, ...newMixedOrder);

            // Bestehende Elemente neu sortieren (für die interne Verwaltung)
            const existingItems = newMixedOrder.filter(
                (item) => item.type === "existing"
            );
            if (existingItems.length > 0) {
                // Sortiere existingState nach der neuen Reihenfolge
                const map = new Map(existingState.map((img) => [img.id, img]));
                const reorderedExisting = existingItems
                    .map((item) => map.get(item.id))
                    .filter(Boolean);

                existingState.splice(
                    0,
                    existingState.length,
                    ...reorderedExisting
                );
                existingState.forEach((img, idx) => (img.sort_order = idx));

                if (options.debug) {
                    console.log(
                        "FileUpload: Tag-Sortierung - Bestehende Elemente neu sortiert:",
                        existingState.map((img) => img.id)
                    );
                }
            }

            // Neue Dateien neu sortieren (für die interne Verwaltung)
            const newItems = newMixedOrder.filter(
                (item) => item.type === "new"
            );
            if (newItems.length > 0) {
                // Erstelle eine Kopie des aktuellen filesState
                const currentFiles = [...filesState];

                // Erstelle einen neuen filesState in der richtigen Reihenfolge
                const reorderedFiles = [];

                // Füge Dateien in der neuen Reihenfolge hinzu
                for (const item of newItems) {
                    if (item.index >= 0 && item.index < currentFiles.length) {
                        reorderedFiles.push(currentFiles[item.index]);
                    }
                }

                // Füge alle Dateien hinzu, die nicht in der neuen Reihenfolge enthalten sind
                const usedIndices = new Set(newItems.map((item) => item.index));
                for (let i = 0; i < currentFiles.length; i++) {
                    if (!usedIndices.has(i)) {
                        reorderedFiles.push(currentFiles[i]);
                    }
                }

                // Ersetze den filesState mit der neuen Reihenfolge
                filesState.splice(0, filesState.length, ...reorderedFiles);

                if (options.debug) {
                    console.log(
                        "FileUpload: Tag-Sortierung - Neue Dateien neu sortiert:",
                        filesState.map((f) => f.name)
                    );
                }
            }

            // UI aktualisieren
            renderExisting();
            renderTags();
            announce("Sortierung aktualisiert.");
        },
        { indexSelector: ".file-tag__index" }
    );

    // Submit-Event-Listener
    if (form) {
        form.addEventListener("submit", async (ev) => {
            // Sortierreihenfolge als verstecktes Feld hinzufügen
            const sortOrderInput = document.createElement("input");
            sortOrderInput.type = "hidden";
            sortOrderInput.name = "image_sort_order";

            // Sammle die IDs der bestehenden, NICHT gelöschten Bilder in der aktuellen Reihenfolge
            const existingIds = existingState
                .filter((img) => !img.deleted) // Nur nicht gelöschte Bilder berücksichtigen
                .map((img) => img.id);

            sortOrderInput.value = JSON.stringify(existingIds);

            // Zum Formular hinzufügen
            form.appendChild(sortOrderInput);

            // Aktualisiere auch die sort_order-Werte für alle nicht gelöschten Bilder
            let sortOrderCounter = 0;
            existingState.forEach((img) => {
                if (!img.deleted) {
                    img.sort_order = sortOrderCounter++;
                }
            });

            if (options.debug) {
                console.log(`FileUpload: Formular wird abgesendet mit:`);
                console.log(
                    `- Sortierreihenfolge: ${JSON.stringify(existingIds)}`
                );
                console.log(`- Neue Dateien: ${filesState.length}`);
            }

            // Klassischer Submit: Reihenfolge der neuen Files in input.files setzen
            if (options.debug && filesState.length > 0) {
                console.log(
                    `FileUpload: Bereite klassischen Form-Submit mit ${filesState.length} Dateien vor`
                );
            }
            const dataTransfer = new DataTransfer();
            filesState.forEach((f) => dataTransfer.items.add(f));
            input.files = dataTransfer.files;
        });
    }

    // ======================================
    // FUNKTIONEN FÜR NEUE DATEIEN
    // ======================================

    /**
     * Verarbeitet die ausgewählten Dateien
     * @param {FileList|Array} newFiles - Die ausgewählten Dateien
     */
    function handleFiles(newFiles) {
        if (!newFiles || !newFiles.length) return;

        const errors = [];
        const beforeCount = filesState.length;

        // Berechne, wie viele Dateien noch hinzugefügt werden können
        const remaining = dynamicMax - filesState.length;
        if (remaining <= 0) {
            errors.push(
                `Es sind bereits die maximal erlaubten Dateien ausgewählt (${options.maxFiles}).`
            );
            if (options.debug) {
                console.warn(
                    "FileUpload: Maximale Anzahl an Dateien bereits erreicht"
                );
            }
            return showMessages(errors);
        }

        // Nur so viele Dateien hinzufügen, wie noch erlaubt sind
        const slice = newFiles.slice(0, remaining);

        // Optimierung: Verwende Promise.all für parallele Validierung
        Promise.all(slice.map(validateFile)).then((validatedFiles) => {
            // Filtere ungültige Dateien
            const validFiles = validatedFiles.filter((item) => item.valid);

            // Füge gültige Dateien zum State hinzu
            validFiles.forEach((item) => filesState.push(item.file));

            // Zeige Fehler für ungültige Dateien
            const invalidFiles = validatedFiles.filter((item) => !item.valid);
            invalidFiles.forEach((item) => errors.push(item.error));

            // Hinweis, wenn nicht alle Dateien hinzugefügt werden konnten
            if (newFiles.length > slice.length) {
                errors.push(
                    `Es konnten nur ${slice.length} von ${newFiles.length} Dateien hinzugefügt werden (Limit erreicht).`
                );
                if (options.debug) {
                    console.warn(
                        `FileUpload: Nur ${slice.length} von ${newFiles.length} Dateien hinzugefügt (Limit erreicht)`
                    );
                }
            }

            // UI aktualisieren - sowohl die einfache als auch die kombinierte Ansicht
            updateUI();
            renderExisting();
            renderTags();
            liveUpdateCounter();

            // Fehler anzeigen, falls vorhanden
            if (errors.length) showMessages(errors);

            // Erfolg melden
            const added = filesState.length - beforeCount;
            if (added > 0) {
                announce(
                    `${added} Datei(en) hinzugefügt. Ausgewählt: ${filesState.length}.`
                );
            }
        });

        // Hilfsfunktion zur Validierung einer Datei
        function validateFile(file) {
            return new Promise((resolve) => {
                const type = (file.type || "").toLowerCase();
                const extension = file.name.split(".").pop().toLowerCase();

                const mimeTypeOk = acceptedMimeTypes.has(type);
                const extensionOk = acceptedExtensions.has(extension);
                const typeOk = mimeTypeOk || extensionOk;

                const sizeOk = file.size <= options.maxFileSizeBytes;

                if (!typeOk) {
                    resolve({
                        valid: false,
                        file: file,
                        error: `Ungültiger Dateityp: ${file.name}. Erlaubt sind JPG, PNG, WEBP.`,
                    });
                    if (options.debug) {
                        console.warn(
                            `FileUpload: Ungültiger Dateityp für ${file.name}: ${type}, Endung: ${extension}`
                        );
                    }
                    return;
                }

                if (!sizeOk) {
                    resolve({
                        valid: false,
                        file: file,
                        error: `Datei zu groß: ${file.name} (max. 2 MB).`,
                    });
                    if (options.debug) {
                        console.warn(
                            `FileUpload: Datei zu groß: ${
                                file.name
                            } (${formatBytes(file.size)})`
                        );
                    }
                    return;
                }

                if (options.debug) {
                    console.log(
                        `FileUpload: Datei hinzugefügt: ${
                            file.name
                        } (${formatBytes(file.size)})`
                    );
                }

                resolve({
                    valid: true,
                    file: file,
                });
            });
        }
    }

    /**
     * Aktualisiert die UI mit den aktuellen Dateien
     */
    function updateUI() {
        tagsContainer.innerHTML = "";
        filesState.forEach((file, idx) => {
            const tag = renderTag(file, idx);
            tagsContainer.appendChild(tag);
        });

        if (options.debug) {
            console.log(
                `FileUpload: UI aktualisiert mit ${filesState.length} Dateien`
            );
        }
    }

    /**
     * Erstellt ein Tag-Element für eine Datei
     * @param {File} file - Die Datei
     * @param {number} index - Der Index der Datei
     * @returns {HTMLElement} - Das erstellte Tag-Element
     */
    function renderTag(file, index) {
        const tag = document.createElement("div");
        tag.className = "file-tag";
        tag.setAttribute("draggable", "true");
        tag.dataset.index = String(index);
        tag.setAttribute("role", "listitem"); // Für bessere Screenreader-Unterstützung

        // Sortier-Nummer
        const idx = document.createElement("span");
        idx.className = "file-tag__index";
        idx.textContent = String(index + 1);
        idx.setAttribute("aria-label", `Position ${index + 1}`);

        // Dateiname
        const name = document.createElement("span");
        name.className = "file-tag__name";
        name.textContent = file.name;

        // Dateigröße
        const size = document.createElement("span");
        size.className = "file-tag__size";
        size.textContent = `(${formatBytes(file.size)})`;
        size.setAttribute("aria-label", `Größe: ${formatBytes(file.size)}`);

        // Entfernen-Button
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "file-tag__remove";
        removeBtn.innerHTML = "×";
        removeBtn.setAttribute("aria-label", `Datei ${file.name} entfernen`);

        // Verbesserte Tastaturunterstützung
        removeBtn.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                removeBtn.click();
            }
        });

        removeBtn.addEventListener("click", () => {
            const i = filesState.indexOf(file);
            if (i > -1) {
                filesState.splice(i, 1);
                updateUI();
                renderExisting(); // Diese Zeile hinzufügen, um die Vorschaubilder zu aktualisieren
                renderTags();
                liveUpdateCounter();
                announce(`Datei entfernt. Ausgewählt: ${filesState.length}.`);

                if (options.debug) {
                    console.log(`FileUpload: Datei entfernt: ${file.name}`);
                }
            }
        });

        // Elemente zusammenfügen
        tag.appendChild(idx);
        tag.appendChild(name);
        tag.appendChild(size);
        tag.appendChild(removeBtn);

        return tag;
    }

    /**
     * Aktualisiert den Zähler für Dateien
     * @param {boolean} forceFromState - Ob der Zähler aus dem Zustand aktualisiert werden soll
     */
    function liveUpdateCounter(forceFromState = false) {
        if (!options.liveUpdateCounter || !counterEl) return;

        // Erwartetes Format: "(x/10 vorhanden)"
        const text = counterEl.textContent || "";
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return;

        const totalAllowed = parseInt(match[2], 10) || options.maxFiles;

        let existing = initialExistingCount;
        if (forceFromState && existingState.length >= 0) {
            existing = existingState.length;
            // Re-berechne dynamicMax, falls sich vorhandene geändert haben
            dynamicMax = Math.max(0, totalAllowed - existing);
        }

        const next = `(${existing}/${totalAllowed} vorhanden)`;
        counterEl.textContent = next;

        if (options.debug) {
            console.log(`FileUpload: Zähler aktualisiert: ${next}`);
        }
    }

    /**
     * Zeigt Fehlermeldungen an
     * @param {Array} messages - Die anzuzeigenden Nachrichten
     */
    function showMessages(messages) {
        if (!messages || !messages.length) return;
        ariaLiveEl.textContent = messages.join(" ");

        if (options.debug) {
            console.warn("FileUpload: Fehlermeldungen:", messages);
        }
    }

    /**
     * Kündigt eine Nachricht an (für Screenreader)
     * @param {string} msg - Die anzukündigende Nachricht
     */
    function announce(msg) {
        if (!msg) return;
        const liveRegion = document.querySelector(".upload-aria-live");
        if (liveRegion) {
            liveRegion.textContent = msg;
            liveRegion.classList.remove("initial");
        }

        if (options.debug) {
            console.log(`FileUpload: Ankündigung: ${msg}`);
        }
    }

    /**
     * Formatiert Bytes in lesbare Größenangaben
     * @param {number} bytes - Anzahl der Bytes
     * @returns {string} - Formatierte Größenangabe
     */
    function formatBytes(bytes) {
        if (!Number.isFinite(bytes)) return "";
        const units = ["B", "KB", "MB", "GB"];
        let i = 0;
        let v = bytes;
        while (v >= 1024 && i < units.length - 1) {
            v /= 1024;
            i++;
        }
        return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
    }

    /**
     * Ruft das CSRF-Token aus dem Meta-Tag ab
     * @returns {string|null} - Das CSRF-Token oder null
     */
    function getCsrfFromMeta() {
        const m = document.querySelector('meta[name="csrf-token"]');
        return m ? m.getAttribute("content") : null;
    }

    // ======================================
    // FUNKTIONEN FÜR BESTEHENDE BILDER (EDIT-MODUS)
    // ======================================

    /**
     * Lädt bestehende Bilder vom Server
     * @param {string} url - URL zum Abrufen der Bilder
     * @returns {Promise<Array>} - Array mit Bildobjekten
     */
    async function fetchExistingImages(url) {
        try {
            const res = await fetch(url, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });

            if (!res.ok)
                throw new Error("Konnte bestehende Bilder nicht laden.");

            const data = await res.json();

            // Erwartete Struktur: { images: [{id, url, thumb, originalName, sort_order, deleted?}], count? }
            const arr = Array.isArray(data?.images)
                ? data.images
                : Array.isArray(data)
                ? data
                : [];

            return arr
                .map((img) => ({
                    id: img.id,
                    url: img.url || img.thumb || "",
                    thumb: img.thumb || img.url || "",
                    name: img.originalName || img.name || `Bild #${img.id}`,
                    sort_order:
                        typeof img.sort_order === "number" ? img.sort_order : 0,
                    deleted: Boolean(img.deleted || img.trashed),
                    // Optionale Felder, falls vom Server geliefert
                    mime: img.mime || img.type || null,
                    size: img.size || null,
                    width: img.width || null,
                    height: img.height || null,
                }))
                .sort((a, b) => a.sort_order - b.sort_order);
        } catch (error) {
            console.error("Fehler beim Laden bestehender Bilder:", error);
            throw error;
        }
    }

    /**
     * Optimierte Version der renderExisting-Funktion mit DocumentFragment
     */
    function renderExisting() {
        if (!existingContainer) return;
        existingContainer.innerHTML = "";

        // Verwende DocumentFragment für bessere Performance
        const fragment = document.createDocumentFragment();
        const view = mergeView();

        view.forEach((item, idx) => {
            const isExisting = isExistingItem(item);
            const element = document.createElement("div");

            if (isExisting) {
                const img = item;
                element.className =
                    "existing-image" +
                    (img.deleted ? " existing-image--deleted" : "");
                element.dataset.id = String(img.id);

                element.innerHTML = `
                <div class="existing-image__thumb">
                    <div class="existing-image__index-container">
                        <div class="existing-image__index-badge" aria-label="Position">${
                            idx + 1
                        }</div>
                    </div>
                    <img src="${img.thumb || img.url}" alt="${escapeHtml(
                    img.name || "Bild"
                )}">
                </div>
                <div class="existing-image__meta">
                    <span class="existing-image__name" title="${escapeHtml(
                        img.name || ""
                    )}">${escapeHtml(img.name || "")}</span>
                </div>
            `;
            } else {
                const file = item;
                const fileIndex = filesState.indexOf(file);

                if (fileIndex === -1) {
                    if (options.debug) {
                        console.warn(
                            "FileUpload: Datei nicht im filesState gefunden:",
                            file
                        );
                    }
                    return;
                }

                element.className =
                    "existing-image existing-image--new existing-image--highlight";
                element.dataset.newIndex = String(fileIndex);

                // Erstelle Elemente mit createElements statt innerHTML für bessere Performance
                const thumbContainer = document.createElement("div");
                thumbContainer.className = "existing-image__thumb";

                const indexContainer = document.createElement("div");
                indexContainer.className = "existing-image__index-container";

                const indexBadge = document.createElement("div");
                indexBadge.className = "existing-image__index-badge";
                indexBadge.setAttribute("aria-label", "Position");
                indexBadge.textContent = String(idx + 1);

                const img = document.createElement("img");
                img.alt = escapeHtml(file.name);
                img.src = "/images/placeholder.jpg";

                if (file.type.startsWith("image/")) {
                    // Optimierung: Verwende URL.createObjectURL statt FileReader für bessere Performance
                    img.src = URL.createObjectURL(file);
                    // Wichtig: ObjectURL freigeben, wenn das Bild geladen wurde
                    img.onload = () => URL.revokeObjectURL(img.src);
                }

                // DOM-Struktur aufbauen
                indexContainer.appendChild(indexBadge);
                thumbContainer.appendChild(indexContainer);
                thumbContainer.appendChild(img);
                element.appendChild(thumbContainer);

                const metaContainer = document.createElement("div");
                metaContainer.className = "existing-image__meta";

                const newBadge = document.createElement("span");
                newBadge.className = "existing-image__badge";
                newBadge.textContent = "Neu";

                const nameSpan = document.createElement("span");
                nameSpan.className = "existing-image__name";
                nameSpan.title = escapeHtml(file.name);
                nameSpan.textContent = escapeHtml(file.name);

                metaContainer.appendChild(newBadge);
                metaContainer.appendChild(nameSpan);
                element.appendChild(metaContainer);
            }

            fragment.appendChild(element);
        });

        existingContainer.appendChild(fragment);

        if (options.debug) {
            console.log(
                `FileUpload: ${existingState.length} bestehende Bilder und ${filesState.length} neue Dateien gerendert in gemischter Reihenfolge`
            );
        }
    }

    /**
     * Escaped HTML-Sonderzeichen
     * @param {string} str - Der zu escapende String
     * @returns {string} - Der escapte String
     */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /**
     * Ersetzt Platzhalter in einer URL
     * @param {string} urlTpl - URL-Template mit Platzhaltern
     * @param {number|string} id - Einzusetzende ID
     * @returns {string} - URL mit eingesetzten Werten
     */
    function replaceId(urlTpl, id) {
        return urlTpl.replace(/:id/g, String(id)).replace(/{id}/g, String(id));
    }

    /**
     * Löscht ein Bild und aktualisiert die Sortierreihenfolge
     * @param {number|string} imageId - ID des zu löschenden Bildes
     * @returns {Promise<void>}
     */
    async function callDelete(imageId) {
        if (!deleteUrlTpl) throw new Error("Delete-URL nicht konfiguriert.");

        // Bild-ID als Ganzzahl umwandeln
        const numericId = parseInt(imageId, 10);

        // Finde das Bild im existingState
        const imageIndex = existingState.findIndex(
            (img) => img.id === numericId
        );
        if (imageIndex === -1) {
            throw new Error(`Bild mit ID ${imageId} nicht gefunden.`);
        }

        // API-Aufruf zum Löschen durchführen
        const url = replaceId(deleteUrlTpl, imageId);
        if (options.debug) {
            console.log(
                `FileUpload: Lösche Bild mit ID ${imageId} (URL: ${url})`
            );
        }

        const res = await fetch(url, {
            method: "DELETE",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
            },
            credentials: "same-origin",
        });

        if (!res.ok) {
            const data = await safeJson(res);
            if (options.debug) {
                console.error(
                    `FileUpload: Fehler beim Löschen des Bildes:`,
                    data?.message || "Unbekannter Fehler"
                );
            }
            throw new Error(data?.message || "Löschen fehlgeschlagen.");
        }

        // Nach erfolgreichem Löschen
        if (restoreUrlTpl) {
            // Markiere als gelöscht, aber behalte es in der Liste
            existingState[imageIndex].deleted = true;

            // Verschiebe das gelöschte Bild ans Ende
            const deletedImage = existingState.splice(imageIndex, 1)[0]; // Entferne aus der aktuellen Position
            existingState.push(deletedImage); // Füge am Ende hinzu
        } else {
            // Wenn keine Wiederherstellung möglich ist, entferne das Bild vollständig
            existingState.splice(imageIndex, 1);
        }

        // Aktualisiere sort_order NUR für die nicht gelöschten Bilder
        let sortOrderCounter = 0;
        existingState.forEach((img) => {
            if (!img.deleted) {
                img.sort_order = sortOrderCounter++;
            }
        });

        // Aktualisiere mixedOrderState für die UI
        mixedOrderState.length = 0;

        // Füge zuerst alle bestehenden Bilder hinzu
        existingState.forEach((img, idx) => {
            mixedOrderState.push({
                type: "existing",
                id: img.id,
                position: idx,
            });
        });

        // Füge dann alle neuen Dateien hinzu
        filesState.forEach((file, idx) => {
            mixedOrderState.push({
                type: "new",
                index: idx,
                position: existingState.length + idx,
            });
        });

        // UI aktualisieren
        renderExisting();
        renderTags();

        // Zähler aktualisieren
        liveUpdateCounter(true);

        // Benachrichtigung anzeigen
        announce("Bild gelöscht.");

        // Debug-Ausgabe für die aktuelle Sortierreihenfolge
        if (options.debug) {
            const nonDeletedIds = existingState
                .filter((img) => !img.deleted)
                .map((img) => img.id);
            console.log(
                `FileUpload: Aktuelle Sortierreihenfolge nach Löschen: ${JSON.stringify(
                    nonDeletedIds
                )}`
            );
        }
    }

    /**
     * Aktualisiert das versteckte Feld für die Sortierreihenfolge
     */
    function updateSortOrderField() {
        if (!sortOrderField) return;

        // Sammle die IDs der bestehenden, NICHT gelöschten Bilder in der aktuellen Reihenfolge
        const existingIds = existingState
            .filter((img) => !img.deleted) // Nur nicht gelöschte Bilder berücksichtigen
            .map((img) => img.id);

        sortOrderField.value = JSON.stringify(existingIds);

        if (options.debug) {
            console.log(
                `FileUpload: Sortierreihenfolge aktualisiert: ${sortOrderField.value}`
            );
        }
    }

    /**
     * Stellt ein gelöschtes Bild wieder her
     * @param {number|string} imageId - ID des wiederherzustellenden Bildes
     * @returns {Promise<void>}
     */
    async function callRestore(imageId) {
        if (!restoreUrlTpl) throw new Error("Restore-URL nicht konfiguriert.");

        const url = replaceId(restoreUrlTpl, imageId);
        if (options.debug) {
            console.log(
                `FileUpload: Stelle Bild mit ID ${imageId} wieder her (URL: ${url})`
            );
        }

        const res = await fetch(url, {
            method: "POST",
            headers: {
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
                ...(csrf ? { "X-CSRF-TOKEN": csrf } : {}),
            },
            credentials: "same-origin",
        });

        if (!res.ok) {
            const data = await safeJson(res);
            throw new Error(
                data?.message || "Wiederherstellen fehlgeschlagen."
            );
        }
    }

    /**
     * Versucht, eine JSON-Antwort zu parsen
     * @param {Response} res - Fetch-Response
     * @returns {Promise<Object|null>} - Geparste JSON oder null
     */
    async function safeJson(res) {
        try {
            return await res.json();
        } catch {
            return null;
        }
    }

    // ======================================
    // ERWEITERTE FUNKTIONEN (OPTIONAL)
    // ======================================

    /**
     * Prüft, ob ein Element ein bestehendes Item ist
     * @param {Object} item - Das zu prüfende Element
     * @returns {boolean} - true, wenn es ein bestehendes Item ist
     */
    function isExistingItem(item) {
        return (
            item &&
            typeof item === "object" &&
            "id" in item &&
            !("file" in item)
        );
    }

    /**
     * Prüft, ob ein Element ein neues Item ist
     * @param {Object} item - Das zu prüfende Element
     * @returns {boolean} - true, wenn es ein neues Item ist
     */
    function isNewItem(item) {
        return item && (item instanceof File || "file" in item);
    }

    /**
     * Gibt die Datei eines Items zurück
     * @param {Object} item - Das Item
     * @returns {File} - Die Datei
     */
    function getNewFile(item) {
        return item instanceof File ? item : item.file || item;
    }

    /**
     * Kombiniert bestehende und neue Dateien in einer Ansicht
     * @returns {Array} - Kombinierte Ansicht
     */
    function mergeView() {
        // Wenn eine gemischte Sortierreihenfolge existiert, verwende diese
        if (mixedOrderState.length > 0) {
            const result = [];

            // Für jedes Element in der gemischten Reihenfolge
            mixedOrderState.forEach((item) => {
                if (item.type === "existing") {
                    // Finde das bestehende Bild mit der entsprechenden ID
                    const existingItem = existingState.find(
                        (img) => img.id === item.id
                    );
                    if (existingItem) {
                        result.push(existingItem);
                    }
                } else if (item.type === "new") {
                    // Finde die neue Datei mit dem entsprechenden Index
                    if (item.index >= 0 && item.index < filesState.length) {
                        result.push(filesState[item.index]);
                    }
                }
            });

            // Füge alle Elemente hinzu, die nicht in der gemischten Reihenfolge enthalten sind
            const existingIds = new Set(
                mixedOrderState
                    .filter((item) => item.type === "existing")
                    .map((item) => item.id)
            );

            const newIndices = new Set(
                mixedOrderState
                    .filter((item) => item.type === "new")
                    .map((item) => item.index)
            );

            // Füge bestehende Bilder hinzu, die nicht in der Reihenfolge sind
            existingState.forEach((img) => {
                if (!existingIds.has(img.id)) {
                    result.push(img);
                }
            });

            // Füge neue Dateien hinzu, die nicht in der Reihenfolge sind
            filesState.forEach((file, idx) => {
                if (!newIndices.has(idx)) {
                    result.push(file);
                }
            });

            return result;
        }

        // Fallback: Wenn keine gemischte Sortierreihenfolge existiert, verwende die alte Methode
        const existingSorted = [...existingState].sort((a, b) => {
            const sa = Number.isFinite(a.sort_order) ? a.sort_order : 0;
            const sb = Number.isFinite(b.sort_order) ? b.sort_order : 0;
            return sa - sb;
        });

        return [...existingSorted, ...filesState];
    }

    /**
     * Gibt die aktuelle Sortierreihenfolge zurück
     * @returns {Array} - Array mit IDs der sortierten Elemente
     */
    function getCurrentSortOrder() {
        return existingState.map((img) => img.id);
    }

    /**
     * Rendert Badges für ein Item
     * @param {Object} item - Das Item
     * @returns {string} - HTML für Badges
     */
    function renderBadgesFor(item) {
        const badges = [];

        if (isExistingItem(item)) {
            if (item.deleted) {
                badges.push(
                    '<span class="tag-badge tag-badge--danger">Gelöscht</span>'
                );
            }

            if (item.mime) {
                badges.push(
                    `<span class="tag-badge">${escapeHtml(
                        item.mime.split("/").pop().toUpperCase()
                    )}</span>`
                );
            }

            if (Number.isFinite(item.size)) {
                badges.push(
                    `<span class="tag-badge">${formatBytes(item.size)}</span>`
                );
            }

            if (item.width && item.height) {
                badges.push(
                    `<span class="tag-badge">${item.width}×${item.height}</span>`
                );
            }
        } else {
            const f = getNewFile(item);
            const ext = (f.name?.split(".").pop() || "").toUpperCase();

            if (ext) {
                badges.push(
                    `<span class="tag-badge">${escapeHtml(ext)}</span>`
                );
            }

            if (Number.isFinite(f.size)) {
                badges.push(
                    `<span class="tag-badge">${formatBytes(f.size)}</span>`
                );
            }
        }

        return badges.join("");
    }

    /**
     * Optimierte Version der renderTags-Funktion mit DocumentFragment
     */
    function renderTags() {
        if (!tagsContainer) return;
        const view = mergeView();
        tagsContainer.innerHTML = "";

        // Verwende DocumentFragment für bessere Performance
        const fragment = document.createDocumentFragment();

        if (options.debug) {
            console.log(
                "FileUpload: Rendere Tags für gemischte Ansicht:",
                view.length
            );
        }

        view.forEach((item, idx) => {
            const position = idx + 1;
            const isExisting = isExistingItem(item);
            const isDeleted = !!(isExisting && item.deleted);

            const tag = document.createElement("div");
            tag.className =
                "file-tag" +
                (isExisting ? " file-tag--existing" : " file-tag--new") +
                (isDeleted ? " file-tag--deleted" : "");
            tag.setAttribute("draggable", "true");
            tag.dataset.kind = isExisting ? "existing" : "new";

            if (isExisting) {
                tag.dataset.id = String(item.id);
            } else {
                const fileIndex = filesState.indexOf(item);
                tag.dataset.index = String(fileIndex);

                if (options.debug && fileIndex === -1) {
                    console.warn(
                        "FileUpload: Datei nicht im filesState gefunden:",
                        item
                    );
                }
            }

            const name = isExisting
                ? item.name || "Bild"
                : getNewFile(item).name || "Datei";

            // Erstelle die Struktur mit createElement für bessere Performance
            const indexSpan = document.createElement("span");
            indexSpan.className = "file-tag__index";
            indexSpan.setAttribute("aria-label", "Position");
            indexSpan.textContent = String(position);

            const nameSpan = document.createElement("span");
            nameSpan.className = "file-tag__name";
            nameSpan.title = escapeHtml(name);
            nameSpan.textContent = escapeHtml(name);

            const sizeSpan = document.createElement("span");
            sizeSpan.className = "file-tag__size";
            sizeSpan.innerHTML = renderBadgesFor(item);

            const actionsSpan = document.createElement("span");
            actionsSpan.className = "file-tag__actions";

            if (isExisting) {
                if (!isDeleted && deleteUrlTpl) {
                    const delBtn = document.createElement("button");
                    delBtn.type = "button";
                    delBtn.className =
                        "file-tag__remove file-tag__remove--danger js-delete";
                    delBtn.title = "Löschen";
                    delBtn.textContent = "✕";

                    delBtn.addEventListener("click", async () => {
                        try {
                            await callDelete(item.id);
                            const i = existingState.findIndex(
                                (e) => e.id === item.id
                            );
                            if (i > -1) {
                                if (restoreUrlTpl)
                                    existingState[i].deleted = true;
                                else existingState.splice(i, 1);
                                renderExisting();
                                renderTags();
                                liveUpdateCounter(true);
                                announce("Bild gelöscht.");
                            }
                        } catch (e) {
                            announce(e?.message || "Fehler beim Löschen.");
                        }
                    });

                    actionsSpan.appendChild(delBtn);
                }

                if (isDeleted && restoreUrlTpl) {
                    const resBtn = document.createElement("button");
                    resBtn.type = "button";
                    resBtn.className = "file-tag__remove js-restore";
                    resBtn.title = "Wiederherstellen";
                    resBtn.textContent = "↺";

                    resBtn.addEventListener("click", async () => {
                        try {
                            await callRestore(item.id);
                            const i = existingState.findIndex(
                                (e) => e.id === item.id
                            );
                            if (i > -1) {
                                existingState[i].deleted = false;
                                renderExisting();
                                renderTags();
                                liveUpdateCounter(true);
                                announce("Bild wiederhergestellt.");
                            }
                        } catch (e) {
                            announce(
                                e?.message || "Fehler beim Wiederherstellen."
                            );
                        }
                    });

                    actionsSpan.appendChild(resBtn);
                }
            } else {
                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.className = "file-tag__remove js-remove";
                removeBtn.title = "Entfernen";
                removeBtn.textContent = "✕";

                removeBtn.addEventListener("click", () => {
                    const f = getNewFile(item);
                    const idxInFiles = filesState.findIndex((x) => {
                        const xf = getNewFile(x);
                        return (
                            xf.name === f.name &&
                            xf.size === f.size &&
                            xf.type === f.type
                        );
                    });

                    if (idxInFiles > -1) {
                        filesState.splice(idxInFiles, 1);
                        updateUI();
                        renderExisting(); // Diese Zeile hinzufügen, um die Vorschaubilder zu aktualisieren
                        renderTags();
                        liveUpdateCounter(true);
                        announce(
                            `Datei entfernt. Ausgewählt: ${filesState.length}.`
                        );

                        if (options.debug) {
                            console.log(
                                `FileUpload: Datei entfernt: ${f.name}`
                            );
                        }
                    }
                });

                actionsSpan.appendChild(removeBtn);
            }

            // Füge alle Elemente zum Tag hinzu
            tag.appendChild(indexSpan);
            tag.appendChild(nameSpan);
            tag.appendChild(sizeSpan);
            tag.appendChild(actionsSpan);

            fragment.appendChild(tag);
        });

        tagsContainer.appendChild(fragment);

        if (options.debug) {
            console.log(
                `FileUpload: ${view.length} Tags gerendert (${existingState.length} bestehende, ${filesState.length} neue)`
            );
        }
    }

    // ======================================
    // HILFSFUNKTIONEN
    // ======================================

    /**
     * Deep-Merge zweier Objekte
     * @param {Object} target - Das Zielobjekt
     * @param {Object} source - Das Quellobjekt
     * @returns {Object} - Das gemergete Objekt
     */
    function deepMerge(target, source) {
        const out = { ...target };
        if (!source) return out;

        for (const key of Object.keys(source)) {
            const v = source[key];
            if (v && typeof v === "object" && !Array.isArray(v)) {
                out[key] = deepMerge(target[key] || {}, v);
            } else {
                out[key] = v;
            }
        }

        return out;
    }

    /**
     * Aktiviert die Sortierung für beliebige Container mit Drag & Drop
     * @param {HTMLElement} container - Der Container mit den sortierbaren Elementen
     * @param {string} itemSelector - CSS-Selektor für die sortierbaren Elemente
     * @param {Function} onReorder - Callback nach Neuordnung mit den sortierten Elementen
     * @param {Object} options - Zusätzliche Optionen
     */
    function enableSorting(
        container,
        itemSelector,
        onReorder,
        sortOptions = {}
    ) {
        if (!container) return;

        const opts = {
            handleSelector: null,
            indexSelector: null,
            ...sortOptions,
        };

        let dragEl = null;
        let dragGhost = null;
        let lastTarget = null;
        let dropIndex = -1;

        // Verwende Delegation für bessere Performance
        container.addEventListener("dragstart", handleDragStart);
        container.addEventListener("dragend", handleDragEnd);
        container.addEventListener("dragover", handleDragOver);
        container.addEventListener("drop", handleDrop);
        container.addEventListener("dragenter", preventDefault);
        container.addEventListener("dragleave", preventDefault);

        function preventDefault(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        function handleDragStart(e) {
            const handle = opts.handleSelector
                ? e.target.closest(opts.handleSelector)
                : null;
            const item = e.target.closest(itemSelector);

            if (!item) return;
            if (opts.handleSelector && !handle) {
                e.preventDefault();
                return;
            }

            // Optimierung: Verzögere das Hinzufügen der Klasse für bessere Performance
            requestAnimationFrame(() => {
                item.classList.add("is-dragging");
            });

            dragEl = item;

            // Optimierung: Erstelle einen besseren Drag-Ghost für flüssigeres Dragging
            if (
                e.dataTransfer.setDragImage &&
                typeof e.dataTransfer.setDragImage === "function"
            ) {
                // Erstelle ein Clone-Element als Ghost
                dragGhost = item.cloneNode(true);
                dragGhost.style.opacity = "0.8";
                dragGhost.style.position = "absolute";
                dragGhost.style.top = "-9999px";
                document.body.appendChild(dragGhost);

                // Setze den Ghost mit Offset
                const rect = item.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;
                e.dataTransfer.setDragImage(dragGhost, offsetX, offsetY);

                // Entferne den Ghost nach kurzer Verzögerung
                setTimeout(() => {
                    if (dragGhost && dragGhost.parentNode) {
                        dragGhost.parentNode.removeChild(dragGhost);
                    }
                }, 0);
            }

            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData(
                "text/plain",
                dragEl.dataset.id || dragEl.dataset.index || ""
            );

            if (options.debug) {
                console.log(
                    `FileUpload: Sortierung gestartet für Element ${
                        dragEl.dataset.id || dragEl.dataset.index
                    }`
                );
            }
        }

        function handleDragEnd(e) {
            if (dragEl) {
                dragEl.classList.remove("is-dragging");
                dragEl = null;
            }

            // Entferne alle Drag-Indikatoren
            const indicators = container.querySelectorAll(".drag-indicator");
            indicators.forEach((el) => el.parentNode.removeChild(el));

            if (lastTarget) {
                lastTarget.classList.remove("drag-over");
                lastTarget = null;
            }
        }

        function handleDragOver(e) {
            e.preventDefault();
            if (!dragEl) return;

            const target = e.target.closest(itemSelector);
            if (!target || target === dragEl) return;

            // Optimierung: Throttle für flüssigere Bewegung
            if (lastTarget === target) return;

            if (lastTarget) {
                lastTarget.classList.remove("drag-over");
            }

            lastTarget = target;
            target.classList.add("drag-over");

            // Position bestimmen (vor oder nach dem Ziel)
            const rect = target.getBoundingClientRect();
            const horizontal = rect.width > rect.height;
            const before = horizontal
                ? e.clientX - rect.left < rect.width / 2
                : e.clientY - rect.top < rect.height / 2;

            // Optimierung: Verwende requestAnimationFrame für flüssigere Animation
            requestAnimationFrame(() => {
                if (before) {
                    container.insertBefore(dragEl, target);
                } else {
                    container.insertBefore(dragEl, target.nextSibling);
                }
            });
        }

        function handleDrop(e) {
            e.preventDefault();
            const items = Array.from(container.querySelectorAll(itemSelector));

            // Optimierung: Verwende requestAnimationFrame für flüssigere Animation
            requestAnimationFrame(() => {
                // Indizes aktualisieren
                if (opts.indexSelector) {
                    items.forEach((item, idx) => {
                        const indexEl = item.querySelector(opts.indexSelector);
                        if (indexEl) indexEl.textContent = String(idx + 1);
                    });
                }

                // Callback aufrufen
                if (typeof onReorder === "function") {
                    onReorder(items);
                }
            });
        }

        if (options.debug) {
            console.log(
                `FileUpload: Sortierung aktiviert für ${itemSelector} in ${container.className}`
            );
        }

        return function cleanup() {
            container.removeEventListener("dragstart", handleDragStart);
            container.removeEventListener("dragend", handleDragEnd);
            container.removeEventListener("dragover", handleDragOver);
            container.removeEventListener("drop", handleDrop);
            container.removeEventListener("dragenter", preventDefault);
            container.removeEventListener("dragleave", preventDefault);
        };
    }

    /**
     * Setzt die Sortierreihenfolge manuell
     * @param {Array} newOrder - Array mit IDs oder Indizes in der gewünschten Reihenfolge
     * @param {Object} options - Optionen für die Sortierung
     * @returns {boolean} - true bei Erfolg, false bei Fehler
     */
    setSortOrder: (newOrder, sortOptions = {}) => {
        if (!Array.isArray(newOrder) || newOrder.length === 0) {
            if (options.debug) {
                console.warn(
                    "FileUpload: Ungültige Sortierreihenfolge übergeben",
                    newOrder
                );
            }
            return false;
        }

        const opts = {
            type: "mixed", // 'mixed', 'existing', 'new'
            ...sortOptions,
        };

        try {
            // Neue gemischte Reihenfolge erstellen
            const newMixedOrder = [];

            if (opts.type === "existing") {
                // Nur bestehende Bilder sortieren
                newOrder.forEach((id, position) => {
                    newMixedOrder.push({
                        type: "existing",
                        id: parseInt(id, 10),
                        position,
                    });
                });

                // Bestehende Elemente neu sortieren
                const map = new Map(existingState.map((img) => [img.id, img]));
                const reorderedExisting = newMixedOrder
                    .map((item) => map.get(item.id))
                    .filter(Boolean);

                existingState.splice(
                    0,
                    existingState.length,
                    ...reorderedExisting
                );
                existingState.forEach((img, idx) => (img.sort_order = idx));

                // Neue Dateien unverändert hinzufügen
                filesState.forEach((file, index) => {
                    newMixedOrder.push({
                        type: "new",
                        index,
                        position: existingState.length + index,
                    });
                });
            } else if (opts.type === "new") {
                // Nur neue Dateien sortieren
                const reorderedFiles = [];

                newOrder.forEach((index, position) => {
                    const idx = parseInt(index, 10);
                    if (idx >= 0 && idx < filesState.length) {
                        reorderedFiles.push(filesState[idx]);
                        newMixedOrder.push({
                            type: "new",
                            index: idx,
                            position: existingState.length + position,
                        });
                    }
                });

                // Dateien, die nicht in newOrder enthalten sind, am Ende hinzufügen
                const usedIndices = new Set(
                    newOrder.map((idx) => parseInt(idx, 10))
                );
                for (let i = 0; i < filesState.length; i++) {
                    if (!usedIndices.has(i)) {
                        reorderedFiles.push(filesState[i]);
                        newMixedOrder.push({
                            type: "new",
                            index: i,
                            position:
                                existingState.length +
                                reorderedFiles.length -
                                1,
                        });
                    }
                }

                // Ersetze den filesState mit der neuen Reihenfolge
                filesState.splice(0, filesState.length, ...reorderedFiles);

                // Bestehende Bilder unverändert am Anfang hinzufügen
                existingState.forEach((img, idx) => {
                    newMixedOrder.unshift({
                        type: "existing",
                        id: img.id,
                        position: idx,
                    });
                });
            } else {
                // Gemischte Sortierung (Standard)
                newOrder.forEach((item, position) => {
                    if (typeof item === "object") {
                        // Format: {type: 'existing'|'new', id: number|index: number}
                        newMixedOrder.push({ ...item, position });
                    } else if (typeof item === "number" || /^\d+$/.test(item)) {
                        // Einfaches Format: Wenn Zahl < 1000, dann Index, sonst ID
                        const num = parseInt(item, 10);
                        if (num < 1000) {
                            // Annahme: IDs sind größer als 1000, Indizes kleiner
                            newMixedOrder.push({
                                type: "new",
                                index: num,
                                position,
                            });
                        } else {
                            newMixedOrder.push({
                                type: "existing",
                                id: num,
                                position,
                            });
                        }
                    }
                });

                // Bestehende Elemente neu sortieren
                const existingItems = newMixedOrder.filter(
                    (item) => item.type === "existing"
                );
                if (existingItems.length > 0) {
                    const map = new Map(
                        existingState.map((img) => [img.id, img])
                    );
                    const reorderedExisting = existingItems
                        .map((item) => map.get(item.id))
                        .filter(Boolean);

                    existingState.splice(
                        0,
                        existingState.length,
                        ...reorderedExisting
                    );
                    existingState.forEach((img, idx) => (img.sort_order = idx));
                }

                // Neue Dateien neu sortieren
                const newItems = newMixedOrder.filter(
                    (item) => item.type === "new"
                );
                if (newItems.length > 0) {
                    const currentFiles = [...filesState];
                    const reorderedFiles = [];

                    for (const item of newItems) {
                        if (
                            item.index >= 0 &&
                            item.index < currentFiles.length
                        ) {
                            reorderedFiles.push(currentFiles[item.index]);
                        }
                    }

                    // Füge alle Dateien hinzu, die nicht in der neuen Reihenfolge enthalten sind
                    const usedIndices = new Set(
                        newItems.map((item) => item.index)
                    );
                    for (let i = 0; i < currentFiles.length; i++) {
                        if (!usedIndices.has(i)) {
                            reorderedFiles.push(currentFiles[i]);
                        }
                    }

                    filesState.splice(0, filesState.length, ...reorderedFiles);
                }
            }

            // Gemischte Reihenfolge speichern
            mixedOrderState.splice(0, mixedOrderState.length, ...newMixedOrder);

            if (options.debug) {
                console.log(
                    "FileUpload: Sortierreihenfolge manuell gesetzt:",
                    newMixedOrder
                );
            }

            // UI aktualisieren
            renderExisting();
            renderTags();
            announce("Sortierung aktualisiert.");

            return true;
        } catch (error) {
            if (options.debug) {
                console.error(
                    "FileUpload: Fehler beim Setzen der Sortierreihenfolge:",
                    error
                );
            }
            return false;
        }
    };

    // ======================================
    // ÖFFENTLICHE API
    // ======================================
    // Initialisierungsnachricht
    if (options.debug) {
        console.log(`FileUpload: Initialisiert mit Optionen:`, options);
    }

    return {
        /**
         * Fügt Dateien hinzu
         * @param {FileList|Array} files - Die hinzuzufügenden Dateien
         */
        addFiles: (files) => {
            if (files && files.length) {
                handleFiles(Array.from(files));
            }
        },

        /**
         * Entfernt eine Datei anhand ihres Index
         * @param {number} index - Der Index der zu entfernenden Datei
         * @returns {boolean} - true, wenn die Datei entfernt wurde
         */
        removeFile: (index) => {
            if (index >= 0 && index < filesState.length) {
                filesState.splice(index, 1);
                updateUI();
                renderExisting();
                liveUpdateCounter();
                return true;
            }
            return false;
        },

        /**
         * Gibt den aktuellen Zustand zurück
         * @returns {Object} - Der aktuelle Zustand
         */
        getState: () => ({
            files: [...filesState],
            existingImages: [...existingState],
            sortOrder: getCurrentSortOrder(),
        }),

        /**
         * Aktualisiert die UI
         */
        refresh: () => {
            updateUI();
            renderExisting();
            renderTags();
            liveUpdateCounter(true);
        },

        /**
         * Gibt die aktuelle Sortierreihenfolge zurück
         * @returns {Array} - Array mit IDs der sortierten Elemente
         */
        getSortOrder: getCurrentSortOrder,
        /**
         * Setzt die Sortierreihenfolge manuell
         * @param {Array} newOrder - Array mit IDs oder Indizes in der gewünschten Reihenfolge
         * @param {Object} options - Optionen für die Sortierung
         * @returns {boolean} - true bei Erfolg, false bei Fehler
         */
        setSortOrder: (newOrder, sortOptions = {}) => {
            if (!Array.isArray(newOrder) || newOrder.length === 0) {
                if (options.debug) {
                    console.warn(
                        "FileUpload: Ungültige Sortierreihenfolge übergeben",
                        newOrder
                    );
                }
                return false;
            }

            const opts = {
                type: "mixed", // 'mixed', 'existing', 'new'
                ...sortOptions,
            };

            try {
                // Neue gemischte Reihenfolge erstellen
                const newMixedOrder = [];

                if (opts.type === "existing") {
                    // Nur bestehende Bilder sortieren
                    newOrder.forEach((id, position) => {
                        newMixedOrder.push({
                            type: "existing",
                            id: parseInt(id, 10),
                            position,
                        });
                    });

                    // Bestehende Elemente neu sortieren
                    const map = new Map(
                        existingState.map((img) => [img.id, img])
                    );
                    const reorderedExisting = newMixedOrder
                        .map((item) => map.get(item.id))
                        .filter(Boolean);

                    existingState.splice(
                        0,
                        existingState.length,
                        ...reorderedExisting
                    );
                    existingState.forEach((img, idx) => (img.sort_order = idx));

                    // Neue Dateien unverändert hinzufügen
                    filesState.forEach((file, index) => {
                        newMixedOrder.push({
                            type: "new",
                            index,
                            position: existingState.length + index,
                        });
                    });
                } else if (opts.type === "new") {
                    // Nur neue Dateien sortieren
                    const reorderedFiles = [];

                    newOrder.forEach((index, position) => {
                        const idx = parseInt(index, 10);
                        if (idx >= 0 && idx < filesState.length) {
                            reorderedFiles.push(filesState[idx]);
                            newMixedOrder.push({
                                type: "new",
                                index: idx,
                                position: existingState.length + position,
                            });
                        }
                    });

                    // Dateien, die nicht in newOrder enthalten sind, am Ende hinzufügen
                    const usedIndices = new Set(
                        newOrder.map((idx) => parseInt(idx, 10))
                    );
                    for (let i = 0; i < filesState.length; i++) {
                        if (!usedIndices.has(i)) {
                            reorderedFiles.push(filesState[i]);
                            newMixedOrder.push({
                                type: "new",
                                index: i,
                                position:
                                    existingState.length +
                                    reorderedFiles.length -
                                    1,
                            });
                        }
                    }

                    // Ersetze den filesState mit der neuen Reihenfolge
                    filesState.splice(0, filesState.length, ...reorderedFiles);

                    // Bestehende Bilder unverändert am Anfang hinzufügen
                    existingState.forEach((img, idx) => {
                        newMixedOrder.unshift({
                            type: "existing",
                            id: img.id,
                            position: idx,
                        });
                    });
                } else {
                    // Gemischte Sortierung (Standard)
                    newOrder.forEach((item, position) => {
                        if (typeof item === "object") {
                            // Format: {type: 'existing'|'new', id: number|index: number}
                            newMixedOrder.push({ ...item, position });
                        } else if (
                            typeof item === "number" ||
                            /^\d+$/.test(item)
                        ) {
                            // Einfaches Format: Wenn Zahl < 1000, dann Index, sonst ID
                            const num = parseInt(item, 10);
                            if (num < 1000) {
                                // Annahme: IDs sind größer als 1000, Indizes kleiner
                                newMixedOrder.push({
                                    type: "new",
                                    index: num,
                                    position,
                                });
                            } else {
                                newMixedOrder.push({
                                    type: "existing",
                                    id: num,
                                    position,
                                });
                            }
                        }
                    });

                    // Bestehende Elemente neu sortieren
                    const existingItems = newMixedOrder.filter(
                        (item) => item.type === "existing"
                    );
                    if (existingItems.length > 0) {
                        const map = new Map(
                            existingState.map((img) => [img.id, img])
                        );
                        const reorderedExisting = existingItems
                            .map((item) => map.get(item.id))
                            .filter(Boolean);

                        existingState.splice(
                            0,
                            existingState.length,
                            ...reorderedExisting
                        );
                        existingState.forEach(
                            (img, idx) => (img.sort_order = idx)
                        );
                    }

                    // Neue Dateien neu sortieren
                    const newItems = newMixedOrder.filter(
                        (item) => item.type === "new"
                    );
                    if (newItems.length > 0) {
                        const currentFiles = [...filesState];
                        const reorderedFiles = [];

                        for (const item of newItems) {
                            if (
                                item.index >= 0 &&
                                item.index < currentFiles.length
                            ) {
                                reorderedFiles.push(currentFiles[item.index]);
                            }
                        }

                        // Füge alle Dateien hinzu, die nicht in der neuen Reihenfolge enthalten sind
                        const usedIndices = new Set(
                            newItems.map((item) => item.index)
                        );
                        for (let i = 0; i < currentFiles.length; i++) {
                            if (!usedIndices.has(i)) {
                                reorderedFiles.push(currentFiles[i]);
                            }
                        }

                        filesState.splice(
                            0,
                            filesState.length,
                            ...reorderedFiles
                        );
                    }
                }

                // Gemischte Reihenfolge speichern
                mixedOrderState.splice(
                    0,
                    mixedOrderState.length,
                    ...newMixedOrder
                );

                if (options.debug) {
                    console.log(
                        "FileUpload: Sortierreihenfolge manuell gesetzt:",
                        newMixedOrder
                    );
                }

                // UI aktualisieren
                renderExisting();
                renderTags();
                announce("Sortierung aktualisiert.");

                return true;
            } catch (error) {
                if (options.debug) {
                    console.error(
                        "FileUpload: Fehler beim Setzen der Sortierreihenfolge:",
                        error
                    );
                }
                return false;
            }
        },
    };
}
