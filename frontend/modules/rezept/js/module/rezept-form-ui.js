// In dieser Datei wird die Logik für das Rezept-Formular gekapselt.
// z.B. renderRezeptFormular(), getFormData(), etc.

import { berechnePreisFürMenge, erstellePreisaufschlüsselung } from './preis-berechnung.js'; 

/**
 * Erstellt und rendert das HTML für das Rezept-Erstellungs- und Bearbeitungsformular.
 * @param {Object} [rezept=null] - Das Rezept-Objekt zum Bearbeiten, oder null für ein neues Rezept.
 */
export function renderRezeptFormular(rezept = null) {
    const container = document.getElementById('rezept-form');
    if (!container) {
        console.error('Der Formular-Container wurde nicht gefunden.');
        return;
    }

    container.dataset.id = rezept ? rezept.id : '';

    container.innerHTML = `
        <input type="hidden" id="rezept-id" value="${rezept?.id || ''}">
        
        <div class="mb-3">
            <label for="rezept-name" class="form-label">Rezeptname</label>
            <input type="text" id="rezept-name" class="form-control" placeholder="Rezeptnamen eingeben" value="${rezept ? rezept.name : ''}" required>
        </div>

        <div class="mb-3">
            <label for="rezept-kategorie" class="form-label">Kategorie</label>
            <select id="rezept-kategorie" class="form-select" required>
                <option value="" disabled selected>Wähle eine Kategorie</option>
            </select>
        </div>
        
        <hr>

        <h5 class="h6">Zutaten hinzufügen</h5>
        <div class="mb-3 position-relative">
            <label for="zutat-suche" class="form-label">Zutat suchen</label>
            <input type="text" id="zutat-suche" class="form-control" placeholder="Zutat suchen..." autocomplete="off">
            <div id="zutat-vorschlaege-container" class="list-group position-absolute w-100" style="z-index: 10;">
                <!-- Vorschläge werden hier per JS eingefügt -->
            </div>
        </div>

        <div id="rezept-zutaten-liste" class="mb-3">
            <!-- Hinzugefügte Zutaten werden hier angezeigt -->
        </div>

        <hr>

        <div class="mb-3">
            <label for="rezept-anleitung" class="form-label">Anleitung</label>
            <textarea id="rezept-anleitung" class="form-control" rows="5">${rezept ? rezept.anleitung : ''}</textarea>
        </div>
        
        <hr>

        <div id="rezept-zusammenfassung" class="mb-3">
            <h5 class="h6">Live-Berechnung</h5>
            <div class="card rezept--live-summary">
                <div class="card-body p-3">
                    <div class="row g-2">
                        <div class="col-md-6">
                            <p class="mb-1 d-flex justify-content-between">
                                <strong><i class="bi bi-currency-euro me-1"></i>Kosten:</strong> 
                                <span id="summary-kosten" class="fw-bold text-success">0,00 €</span>
                            </p>
                            <p class="mb-1 d-flex justify-content-between">
                                <strong><i class="bi bi-speedometer2 me-1"></i>Kalorien:</strong> 
                                <span id="summary-kalorien" class="fw-bold">0 kcal</span>
                            </p>
                        </div>
                        <div class="col-md-6">
                            <p class="mb-1 d-flex justify-content-between">
                                <strong><i class="bi bi-weight me-1"></i>Gewicht:</strong> 
                                <span id="summary-gewicht" class="fw-bold text-info">0 g</span>
                            </p>
                            <p class="mb-1 d-flex justify-content-between">
                                <strong><i class="bi bi-droplet me-1"></i>Volumen:</strong> 
                                <span id="summary-volumen" class="fw-bold text-primary">0 ml</span>
                            </p>
                        </div>
                    </div>
                    <hr class="my-2">
                    <p class="mb-0 d-flex justify-content-between">
                        <strong><i class="bi bi-exclamation-triangle me-1"></i>Allergene:</strong> 
                        <span id="summary-allergene" class="badge bg-success">Keine</span>
                    </p>
                </div>
            </div>
        </div>

        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
            <button type="button" id="form-abbrechen-btn" class="btn btn-secondary">Abbrechen</button>
            <button type="submit" class="btn btn-primary">${rezept ? 'Änderungen speichern' : 'Rezept erstellen'}</button>
        </div>
    `;
}

/**
 * Füllt das Kategorie-Dropdown mit den übergebenen Stammdaten.
 * @param {Array<string>} kategorien - Ein Array von Kategorie-Namen.
 */
export function populateKategorien(kategorien) {
    const select = document.getElementById('rezept-kategorie');
    if (!select) return;

    select.innerHTML = '<option value="">Bitte Kategorie wählen...</option>';
    kategorien.forEach(kategorie => {
        const option = document.createElement('option');
        option.value = kategorie;
        option.textContent = kategorie;
        select.appendChild(option);
    });
}

/**
 * Rendert die Zutatensuch-Vorschläge.
 * @param {Array} vorschlaege - Ein Array von Zutat-Objekten für die Vorschläge.
 */
export function renderZutatVorschlaege(vorschlaege) {
    const container = document.getElementById('zutat-vorschlaege-container');
    if (!container) return;

    container.innerHTML = '';
    if (vorschlaege.length === 0) {
        container.classList.remove('d-block');
        return;
    }

    vorschlaege.forEach(zutat => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        item.textContent = zutat.name;
        item.dataset.id = zutat.id;
        container.appendChild(item);
    });
}

/**
 * Rendert die Liste der Zutaten, die bereits zum Rezept hinzugefügt wurden.
 * @param {Array} zutaten - Das Array der aktuell zum Rezept gehörenden Zutaten.
 */
export function renderAktuelleRezeptZutaten(aktuelleZutaten) {
    const container = document.getElementById('rezept-zutaten-liste');
    if (!container) return;

    container.innerHTML = '';

    if (aktuelleZutaten.length === 0) {
        container.innerHTML = '<p class="text-muted fst-italic">Noch keine Zutaten hinzugefügt.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.className = 'list-group';
    aktuelleZutaten.forEach(zutat => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const menge = zutat.menge !== undefined ? zutat.menge : 1;
        const einheit = zutat.einheit || 'Stk';

        const istStueckEinheit = einheit?.toLowerCase() === 'stk.' || einheit?.toLowerCase() === 'pkg.' || einheit?.toLowerCase() === 'stk' || einheit?.toLowerCase() === 'stück' || einheit?.toLowerCase() === 'packung';
        const durchschnittsgewicht = zutat.durchschnittsgewicht || getDurchschnittsgewichtFürZutat(zutat);

        li.innerHTML = `
            <div class="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-2">
                <div class="fw-medium">${zutat.name}</div>
                <div class="d-flex flex-column flex-md-row align-items-md-center rezept--zutat-controls">
                    <div class="d-flex align-items-center gap-2">
                        <div class="input-group input-group-sm" style="width: 120px;">
                            <button class="btn btn-outline-secondary" type="button" data-action="step-down" data-id="${zutat.id}">-</button>
                            <input 
                                type="number" 
                                class="form-control text-center" 
                                value="${menge}" 
                                min="0"
                                step="1"
                                data-id="${zutat.id}"
                                data-field="menge"
                                id="menge-${zutat.id}"
                            >
                            <button class="btn btn-outline-secondary" type="button" data-action="step-up" data-id="${zutat.id}">+</button>
                        </div>
                        <span class="text-nowrap rezept--gewicht-label" style="width: 35px;">${einheit}</span>
                    </div>
                    ${istStueckEinheit ? `
                        <div class="d-flex align-items-center gap-1">
                            <span class="text-muted small">@</span>
                            <div class="input-group input-group-sm" style="width: 80px;">
                                <input 
                                    type="number" 
                                    class="form-control text-center rezept--durchschnittsgewicht-input" 
                                    value="${durchschnittsgewicht}" 
                                    min="1"
                                    step="1"
                                    data-id="${zutat.id}"
                                    data-field="durchschnittsgewicht"
                                    id="gewicht-${zutat.id}"
                                    title="Durchschnittsgewicht pro Stück/Packung"
                                >
                            </div>
                            <span class="text-muted small rezept--gewicht-label">g</span>
                        </div>
                    ` : ''}
                    <button type="button" class="btn btn-sm btn-outline-danger" data-id="${zutat.id}" data-action="remove-zutat" title="Zutat entfernen">&times;</button>
                </div>
            </div>
        `;
        ul.appendChild(li);
    });
    container.appendChild(ul);
}

/**
 * Sammelt alle Daten aus dem aktuell angezeigten Rezeptformular.
 * @param {Array} zutaten - Das Array der aktuell zum Rezept gehörenden Zutaten.
 * @returns {Object} Das zusammengestellte Rezept-Datenobjekt.
 */
export function getRezeptFormularDaten(zutaten) {
    const form = document.getElementById('rezept-form');
    const rezeptName = form.querySelector('#rezept-name').value;
    const rezeptAnleitung = form.querySelector('#rezept-anleitung').value;
    const rezeptKategorie = form.querySelector('#rezept-kategorie').value;
    
    const zutatenFürPayload = zutaten.map(z => {
        const gewichtInput = document.getElementById(`gewicht-${z.id}`);
        const benutzerDefiniertesDurchschnittsgewicht = gewichtInput ? 
            parseFloat(gewichtInput.value) : null;
        
        const payload = {
            zutatId: z.id,
            menge: parseFloat(document.getElementById(`menge-${z.id}`).value) || 0,
            einheit: z.einheit,
        };
        
        // Nur benutzerdefinierte Durchschnittsgewichte speichern
        if (benutzerDefiniertesDurchschnittsgewicht && 
            benutzerDefiniertesDurchschnittsgewicht !== getDurchschnittsgewichtFürZutat(z)) {
            payload.durchschnittsgewicht = benutzerDefiniertesDurchschnittsgewicht;
        }
        
        return payload;
    });

    return {
        name: rezeptName,
        anleitung: rezeptAnleitung,
        kategorie: rezeptKategorie,
        portionen: 1, // Temporär, bis das Feld wieder eingeführt wird
        zutaten: zutatenFürPayload,
    };
}

/**
 * Berechnet die Gesamtwerte (Kosten, Allergene, Nährwerte)
 * und aktualisiert die Live-Zusammenfassung im Formular.
 * @param {Array} aktuelleZutaten - Die Liste der aktuell im Formular befindlichen Zutaten.
 */
/**
 * Konvertiert Mengen in Basis-Einheiten (Gramm für Gewicht, Milliliter für Volumen)
 * @param {number} menge - Die Menge
 * @param {string} einheit - Die Einheit (g, kg, ml, l, etc.)
 * @param {number} durchschnittsgewicht - Durchschnittsgewicht für Stück-Zutaten in Gramm
 * @returns {Object} - {gewicht: number, volumen: number} in Basis-Einheiten
 */
function konvertiereZuBasisEinheiten(menge, einheit, durchschnittsgewicht = 0) {
    const einheitLower = einheit?.toLowerCase() || '';
    
    // Gewichts-Einheiten (in Gramm konvertieren)
    if (einheitLower === 'g') {
        return { gewicht: menge, volumen: 0 };
    } else if (einheitLower === 'kg') {
        return { gewicht: menge * 1000, volumen: 0 };
    }
    
    // Volumen-Einheiten (in Milliliter konvertieren)
    else if (einheitLower === 'ml') {
        return { gewicht: 0, volumen: menge };
    } else if (einheitLower === 'l') {
        return { gewicht: 0, volumen: menge * 1000 };
    }
    
    // Stück-Einheiten (Durchschnittsgewicht verwenden)
    else if (einheitLower === 'stk.' || einheitLower === 'stk' || einheitLower === 'stück' || einheitLower === 'pkg.' || einheitLower === 'packung') {
        return { gewicht: menge * durchschnittsgewicht, volumen: 0 };
    }
    
    // Unbekannte Einheit
    return { gewicht: 0, volumen: 0 };
}

/**
 * Formatiert Gewichts- oder Volumen-Werte in benutzerfreundliche Einheiten
 * @param {number} wert - Der Wert in Basis-Einheit (g oder ml)
 * @param {string} typ - 'gewicht' oder 'volumen'
 * @returns {string} - Formatierter String mit Einheit
 */
function formatiereMengenangabe(wert, typ) {
    if (wert === 0) return '0 ' + (typ === 'gewicht' ? 'g' : 'ml');
    
    if (typ === 'gewicht') {
        if (wert >= 1000) {
            return `${(wert / 1000).toFixed(1)} kg`;
        }
        return `${Math.round(wert)} g`;
    } else { // volumen
        if (wert >= 1000) {
            return `${(wert / 1000).toFixed(1)} l`;
        }
        return `${Math.round(wert)} ml`;
    }
}

export function updateLiveSummary(aktuelleZutaten) {
    const summaryKosten = document.getElementById('summary-kosten');
    const summaryAllergene = document.getElementById('summary-allergene');
    const summaryKalorien = document.getElementById('summary-kalorien');
    const summaryGewicht = document.getElementById('summary-gewicht');
    const summaryVolumen = document.getElementById('summary-volumen');

    if (!summaryKosten || !summaryAllergene || !summaryKalorien || !summaryGewicht || !summaryVolumen) {
        console.error("Summary-Elemente nicht gefunden!");
        return;
    }

    let totalKosten = 0;
    const alleAllergene = new Set();
    let totalKalorien = 0;
    let totalGewicht = 0;
    let totalVolumen = 0;

    aktuelleZutaten.forEach(zutat => {
        const mengenInput = document.getElementById(`menge-${zutat.id}`);
        const menge = mengenInput ? parseFloat(mengenInput.value) || 0 : (zutat.menge || 0);

        // Benutzerdefiniertes Durchschnittsgewicht zuerst lesen
        const gewichtInput = document.getElementById(`gewicht-${zutat.id}`);
        const durchschnittsgewicht = gewichtInput ? 
            parseFloat(gewichtInput.value) || getDurchschnittsgewichtFürZutat(zutat) : 
            (zutat.durchschnittsgewicht || getDurchschnittsgewichtFürZutat(zutat));

        // Kosten berechnen mit benutzerdefinierten Durchschnittsgewicht
        const kostenFürMenge = berechnePreisFürMenge(zutat, menge, zutat.einheit, durchschnittsgewicht);
        if (kostenFürMenge > 0) {
            totalKosten += kostenFürMenge;
            
            // Debug-Ausgabe für detaillierte Preisaufschlüsselung
            if (window.DEBUG_PREIS) {
                const aufschlüsselung = erstellePreisaufschlüsselung(zutat, menge, zutat.einheit, durchschnittsgewicht);
                console.log('Preisberechnung:', aufschlüsselung);
            }
        }

        // Allergene sammeln
        if (zutat.allergene && zutat.allergene.length > 0) {
            zutat.allergene.forEach(allergen => alleAllergene.add(allergen.code));
        }

        // Kalorien berechnen
        if (zutat.naehrwerte && typeof zutat.naehrwerte.kalorien_kcal === 'number') {
            const einheitLowerCase = zutat.einheit?.toLowerCase() || '';
            if (einheitLowerCase !== 'stück' && einheitLowerCase !== 'stk' && einheitLowerCase !== 'stk.') {
                totalKalorien += (zutat.naehrwerte.kalorien_kcal / 100) * menge;
            }
        }

        // Gewicht und Volumen berechnen
        const { gewicht, volumen } = konvertiereZuBasisEinheiten(menge, zutat.einheit, durchschnittsgewicht);
        totalGewicht += gewicht;
        totalVolumen += volumen;
    });

    // UI aktualisieren
    summaryKosten.textContent = `${totalKosten.toFixed(2).replace('.', ',')} €`;
    summaryKalorien.textContent = `${Math.round(totalKalorien)} kcal`;
    summaryGewicht.textContent = formatiereMengenangabe(totalGewicht, 'gewicht');
    summaryVolumen.textContent = formatiereMengenangabe(totalVolumen, 'volumen');

    if (alleAllergene.size > 0) {
        summaryAllergene.textContent = Array.from(alleAllergene).join(', ');
        summaryAllergene.className = 'badge bg-danger';
    } else {
        summaryAllergene.textContent = 'Keine';
        summaryAllergene.className = 'badge bg-success';
    }
}

/**
 * Schätzt das Durchschnittsgewicht für gängige Stück-Zutaten
 * @param {Object} zutat - Das Zutat-Objekt
 * @returns {number} - Durchschnittsgewicht in Gramm
 */
function getDurchschnittsgewichtFürZutat(zutat) {
    const name = zutat.name?.toLowerCase() || '';
    
    // Häufige Zutatenschätzungen (in Gramm)
    const schätzungen = {
        'ei': 60,
        'eier': 60,
        'zwiebel': 150,
        'tomate': 120,
        'kartoffel': 150,
        'apfel': 180,
        'zitrone': 100,
        'packung': 250,  // Durchschnittliche Packung
        'dose': 400,     // Durchschnittliche Dose
        'scheibe': 25,   // Brotscheibe, Käsescheibe
    };
    
    // Einfache Wort-Suche in Zutatennamen
    for (const [schlüssel, gewicht] of Object.entries(schätzungen)) {
        if (name.includes(schlüssel)) {
            return gewicht;
        }
    }
    
    // Standard-Fallback: 100g pro Stück
    return 100;
}

export function resetRezeptFormular() {
    const formContainer = document.getElementById('rezept-form');
    if(formContainer) {
        formContainer.innerHTML = `
            <p class="text-center text-muted">
                Bitte wählen Sie ein Rezept aus der Liste zum Bearbeiten oder erstellen Sie ein neues.
            </p>
        `;
        formContainer.dataset.id = '';
    }
} 