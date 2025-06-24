// In dieser Datei wird die Logik für das Rezept-Formular gekapselt.
// z.B. renderRezeptFormular(), getFormData(), etc. 

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
            <h5 class="h6">Live-Zusammenfassung</h5>
            <div class="card bg-light border">
                <div class="card-body p-3">
                    <p class="mb-1 d-flex justify-content-between"><strong>Geschätzte Kosten:</strong> <span id="summary-kosten" class="fw-bold">0,00 €</span></p>
                    <p class="mb-1 d-flex justify-content-between"><strong>Allergene:</strong> <span id="summary-allergene" class="badge bg-warning text-dark">Keine</span></p>
                    <p class="mb-0 d-flex justify-content-between"><strong>Kalorien (gesamt):</strong> <span id="summary-kalorien" class="fw-bold">0 kcal</span></p>
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

        li.innerHTML = `
            <span>${zutat.name}</span>
            <div class="d-flex align-items-center gap-2">
                <div class="input-group input-group-sm" style="width: 150px;">
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
                <span style="width: 50px;">${einheit}</span>
                <button type="button" class="btn btn-sm btn-outline-danger" data-id="${zutat.id}" data-action="remove-zutat">&times;</button>
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
    
    const zutatenFürPayload = zutaten.map(z => ({
        zutatId: z.id,
        menge: parseFloat(document.getElementById(`menge-${z.id}`).value) || 0,
        einheit: z.einheit,
    }));

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
export function updateLiveSummary(aktuelleZutaten) {
    const summaryKosten = document.getElementById('summary-kosten');
    const summaryAllergene = document.getElementById('summary-allergene');
    const summaryKalorien = document.getElementById('summary-kalorien');

    if (!summaryKosten || !summaryAllergene || !summaryKalorien) {
        console.error("Summary-Elemente nicht gefunden!");
        return;
    }

    let totalKosten = 0;
    const alleAllergene = new Set();
    let totalKalorien = 0;

    aktuelleZutaten.forEach(zutat => {
        const mengenInput = document.getElementById(`menge-${zutat.id}`);
        const menge = mengenInput ? parseFloat(mengenInput.value) || 0 : (zutat.menge || 0);

        if (zutat.preis && typeof zutat.preis.basis === 'number' && typeof zutat.preis.umrechnungsfaktor === 'number' && zutat.preis.umrechnungsfaktor !== 0) {
            const preisProVerwendungseinheit = zutat.preis.basis / zutat.preis.umrechnungsfaktor;
            totalKosten += preisProVerwendungseinheit * menge;
        }

        if (zutat.allergene && zutat.allergene.length > 0) {
            zutat.allergene.forEach(allergen => alleAllergene.add(allergen.code));
        }

        if (zutat.naehrwerte && typeof zutat.naehrwerte.kalorien_kcal === 'number') {
            const einheitLowerCase = zutat.einheit?.toLowerCase() || '';
            if (einheitLowerCase !== 'stück' && einheitLowerCase !== 'stk') {
                totalKalorien += (zutat.naehrwerte.kalorien_kcal / 100) * menge;
            }
        }
    });

    summaryKosten.textContent = `${totalKosten.toFixed(2).replace('.', ',')} €`;
    summaryKalorien.textContent = `${Math.round(totalKalorien)} kcal`;

    if (alleAllergene.size > 0) {
        summaryAllergene.textContent = Array.from(alleAllergene).join(', ');
        summaryAllergene.className = 'badge bg-danger';
    } else {
        summaryAllergene.textContent = 'Keine';
        summaryAllergene.className = 'badge bg-success';
    }
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