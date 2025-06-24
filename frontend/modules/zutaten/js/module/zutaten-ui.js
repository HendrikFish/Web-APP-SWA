import { getVorschlaege } from './zutaten-api.js';

let zutatenVorschlaege = [];
let einheitenStammdaten = []; // Globale Variable für Einheiten
let currentlyEditingId = null; // Hält die ID der aktuell bearbeiteten Zutat

// DOM-Elemente einmalig abrufen
const zutatForm = document.getElementById('zutat-form');
const toggleNaehrwerteBtn = document.getElementById('toggle-naehrwerte-btn');
const naehrwerteSection = document.getElementById('naehrwerte-section');
const toggleAllergeneBtn = document.getElementById('toggle-allergene-btn');
const allergeneSection = document.getElementById('allergene-section');

/**
 * Setzt das Formular zurück in den "Neue Zutat"-Modus.
 */
export function resetForm() {
    zutatForm.reset();
    
    // Manuelles Zurücksetzen der Allergen-Buttons
    const allergeneButtons = document.querySelectorAll('#allergene-container .allergen-button');
    allergeneButtons.forEach(button => {
        button.classList.remove('active');
        button.setAttribute('aria-pressed', 'false');
    });

    // UI-Texte und Nährwert-Bereich zurücksetzen
    document.querySelector('.card-header h1').textContent = 'Neue Zutat erfassen';
    document.querySelector('button[type="submit"]').textContent = 'Zutat speichern';
    naehrwerteSection.classList.add('d-none'); // Versteckt den Bereich
    allergeneSection.classList.add('d-none'); // Versteckt den Bereich

    // Eventuell hinzugefügten "Abbrechen"-Button entfernen
    const cancelButton = document.getElementById('cancel-edit-btn');
    if (cancelButton) {
        cancelButton.remove();
    }
    
    currentlyEditingId = null;
    
    // Preisberechnung zurücksetzen und Einheiten-Dropdowns korrekt initialisieren
    document.getElementById('preis-verwendung').textContent = 'wird berechnet...';
    document.getElementById('verwendungseinheit').innerHTML = '<option value="">Bitte wählen...</option>';
}

/**
 * Füllt das Formular mit den Daten einer Zutat für die Bearbeitung.
 * @param {object} zutat - Das Zutat-Objekt, das bearbeitet werden soll.
 */
export function startEditMode(zutat) {
    resetForm(); // Formular zuerst komplett zurücksetzen
    currentlyEditingId = zutat.zutatennummer;

    // UI für den Bearbeitungsmodus anpassen
    document.querySelector('.card-header h1').textContent = 'Zutat bearbeiten';
    const submitButton = document.querySelector('button[type="submit"]');
    submitButton.textContent = 'Änderungen speichern';
    
    // Abbrechen-Button hinzufügen, falls nicht vorhanden
    if (!document.getElementById('cancel-edit-btn')) {
        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.id = 'cancel-edit-btn';
        cancelButton.textContent = 'Abbrechen';
        cancelButton.className = 'btn btn-secondary mt-2';
        cancelButton.addEventListener('click', resetForm);
        submitButton.parentElement.appendChild(cancelButton);
    }

    // Formularfelder füllen
    document.getElementById('zutat-name').value = zutat.name;
    document.getElementById('zutat-kategorie').value = zutat.kategorie;
    document.getElementById('zutat-lieferant').value = zutat.lieferant;
    document.getElementById('zutat-herkunft').value = zutat.herkunft || '';
    
    // Preis und Einheiten
    const preisDaten = zutat.preis || {};
    document.getElementById('preis-basis').value = preisDaten.basis || 0;
    
    // Einheiten mit korrekter Logik setzen
    const basisEinheitSelect = document.getElementById('basiseinheit');
    basisEinheitSelect.value = preisDaten.basiseinheit || '';
    basisEinheitSelect.dispatchEvent(new Event('change'));
    
    setTimeout(() => {
        const verwendungseinheitSelect = document.getElementById('verwendungseinheit');
        verwendungseinheitSelect.value = preisDaten.verwendungseinheit || '';
        calculatePreisVerwendung();
    }, 100);

    // Allergene Buttons setzen und Bereich ggf. anzeigen
    if (zutat.allergene && zutat.allergene.length > 0) {
        allergeneSection.classList.remove('d-none');
        const allergeneButtons = document.querySelectorAll('#allergene-container .allergen-button');
        allergeneButtons.forEach(button => {
            const isPressed = zutat.allergene.some(a => a.code === button.dataset.code);
            button.classList.toggle('active', isPressed);
            button.setAttribute('aria-pressed', isPressed);
        });
    }

    // Nährwerte füllen und den Bereich ggf. anzeigen
    const naehrwerte = zutat.naehrwerte || {};
    if (Object.keys(naehrwerte).length > 0) {
        naehrwerteSection.classList.remove('d-none');
        document.getElementById('naehrwert-kalorien').value = naehrwerte.kalorien_kcal || '';
        document.getElementById('naehrwert-fett').value = naehrwerte.fett_g || '';
        document.getElementById('naehrwert-zucker').value = naehrwerte.davon_zucker_g || '';
        document.getElementById('naehrwert-eiweiss').value = naehrwerte.eiweiss_g || '';
        document.getElementById('naehrwert-kohlenhydrate').value = naehrwerte.kohlenhydrate_g || '';
        document.getElementById('naehrwert-salz').value = naehrwerte.salz_g || '';
    }

    // Zum Formular scrollen
    zutatForm.scrollIntoView({ behavior: 'smooth' });
}

export function initializeZutatenUI() {
    const zutatNameInput = document.getElementById('zutat-name');
    const customSuggestionsContainer = document.getElementById('custom-suggestions');

    zutatNameInput.addEventListener('input', async () => {
        const query = zutatNameInput.value.toLowerCase();
        if (query.length < 2) {
            customSuggestionsContainer.innerHTML = '';
            customSuggestionsContainer.style.display = 'none';
            return;
        }

        if (zutatenVorschlaege.length === 0) {
            try {
                zutatenVorschlaege = await getVorschlaege();
            } catch (error) {
                console.error("Fehler beim Laden der Vorschläge:", error);
                // Optional: Nutzerfeedback geben
            }
        }

        const filtered = zutatenVorschlaege
            .filter(z => (z && z.name) ? z.name.toLowerCase().includes(query) : false)
            .slice(0, 3);

        if (filtered.length > 0) {
            customSuggestionsContainer.innerHTML = filtered.map(item =>
                `<a href="#" class="list-group-item list-group-item-action" data-name="${item.name}">${item.name}</a>`
            ).join('');
            customSuggestionsContainer.style.display = 'block';
        } else {
            customSuggestionsContainer.style.display = 'none';
        }
    });

    customSuggestionsContainer.addEventListener('click', (e) => {
        e.preventDefault();
        if (e.target.matches('.list-group-item')) {
            const selectedName = e.target.dataset.name;
            zutatNameInput.value = selectedName;
            customSuggestionsContainer.innerHTML = '';
            customSuggestionsContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!zutatNameInput.contains(e.target) && !customSuggestionsContainer.contains(e.target)) {
            customSuggestionsContainer.style.display = 'none';
        }
    });

    // Event Listener für den Nährwerte-Button
    toggleNaehrwerteBtn.addEventListener('click', () => {
        naehrwerteSection.classList.toggle('d-none');
    });

    // Event Listener für den Allergene-Button
    toggleAllergeneBtn.addEventListener('click', () => {
        allergeneSection.classList.toggle('d-none');
    });
}

export function populateStammdaten(stammdaten) {
    const kategorieSelect = document.getElementById('zutat-kategorie');
    const lieferantSelect = document.getElementById('zutat-lieferant');
    const allergeneContainer = document.getElementById('allergene-container');
    const basisEinheitSelect = document.getElementById('basiseinheit');
    const verwendungseinheitSelect = document.getElementById('verwendungseinheit');

    if (kategorieSelect && stammdaten.kategorien) {
        kategorieSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        stammdaten.kategorien.forEach(kategorie => {
            const option = new Option(kategorie, kategorie);
            kategorieSelect.add(option);
        });
    }

    if (lieferantSelect && stammdaten.lieferanten) {
        lieferantSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        stammdaten.lieferanten.forEach(lieferant => {
            const option = new Option(lieferant, lieferant);
            lieferantSelect.add(option);
        });
    }
    
    if (allergeneContainer && stammdaten.allergene) {
        allergeneContainer.innerHTML = '';
        stammdaten.allergene.forEach(allergen => {
            const button = document.createElement('button');
            button.type = 'button'; // Wichtig, um Formular-Submit zu verhindern
            button.className = 'btn btn-outline-secondary btn-sm allergen-button';
            button.dataset.code = allergen.code;
            button.textContent = `${allergen.code} - ${allergen.name}`;
            allergeneContainer.appendChild(button);
        });

        allergeneContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('allergen-button')) {
                e.target.classList.toggle('active');
                const isPressed = e.target.classList.contains('active');
                e.target.setAttribute('aria-pressed', isPressed);
            }
        });
    }

    einheitenStammdaten = stammdaten.einheiten || [];

    if (basisEinheitSelect && verwendungseinheitSelect && einheitenStammdaten.length > 0) {
        basisEinheitSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        einheitenStammdaten.forEach(einheit => {
            const option = document.createElement('option');
            option.value = einheit.abk;
            option.textContent = `${einheit.name} (${einheit.abk})`;
            option.dataset.typ = einheit.typ;
            basisEinheitSelect.appendChild(option);
        });

        basisEinheitSelect.addEventListener('change', () => {
            const selectedOption = basisEinheitSelect.options[basisEinheitSelect.selectedIndex];
            const selectedTyp = selectedOption.dataset.typ;
            
            verwendungseinheitSelect.innerHTML = '<option value="">Bitte wählen...</option>';
            
            if (selectedTyp) {
                const kompatibleEinheiten = einheitenStammdaten.filter(e => e.typ === selectedTyp);
                kompatibleEinheiten.forEach(einheit => {
                    const option = document.createElement('option');
                    option.value = einheit.abk;
                    option.textContent = `${einheit.name} (${einheit.abk})`;
                    verwendungseinheitSelect.appendChild(option);
                });
            }
            calculatePreisVerwendung();
        });

        document.getElementById('preis-basis').addEventListener('input', calculatePreisVerwendung);
        verwendungseinheitSelect.addEventListener('change', calculatePreisVerwendung);
    }
}

function calculatePreisVerwendung() {
    const preisBasisInput = document.getElementById('preis-basis');
    const basisEinheitSelect = document.getElementById('basiseinheit');
    const verwendungseinheitSelect = document.getElementById('verwendungseinheit');
    const preisVerwendungElement = document.getElementById('preis-verwendung');

    const preisBasis = parseFloat(preisBasisInput.value);
    const basisEinheitAbk = basisEinheitSelect.value;
    const verwendungseinheitAbk = verwendungseinheitSelect.value;

    if (isNaN(preisBasis) || !basisEinheitAbk || !verwendungseinheitAbk) {
        preisVerwendungElement.textContent = 'wird berechnet...';
        return;
    }

    const basisEinheit = einheitenStammdaten.find(e => e.abk === basisEinheitAbk);
    const verwendungseinheit = einheitenStammdaten.find(e => e.abk === verwendungseinheitAbk);

    if (!basisEinheit || !verwendungseinheit || basisEinheit.typ !== verwendungseinheit.typ) {
        preisVerwendungElement.textContent = 'Einheiten inkompatibel';
        return;
    }

    const preisProStandardEinheit = preisBasis / basisEinheit.faktor;
    const preisProVerwendung = preisProStandardEinheit * verwendungseinheit.faktor;

    if (isNaN(preisProVerwendung)) {
        preisVerwendungElement.textContent = 'Ungültige Berechnung';
        return;
    }

    preisVerwendungElement.innerHTML = `ca. <span class="fw-bold">${preisProVerwendung.toFixed(4).replace('.', ',')} €</span>`;
}

/**
 * Sammelt alle Daten aus dem Zutat-Formular, validiert sie
 * und gibt sie als sauberes, strukturiertes Objekt zurück.
 * @returns {object|null} Das Zutat-Datenobjekt oder null bei Validierungsfehlern.
 */
export function getZutatFormularDaten() {
    const basisEinheit = einheitenStammdaten.find(e => e.abk === document.getElementById('basiseinheit').value);
    const verwendungseinheit = einheitenStammdaten.find(e => e.abk === document.getElementById('verwendungseinheit').value);
    
    let umrechnungsfaktor = 1;
    if (basisEinheit && verwendungseinheit && basisEinheit.typ === verwendungseinheit.typ) {
        umrechnungsfaktor = basisEinheit.faktor / verwendungseinheit.faktor;
    }

    const data = {
        name: document.getElementById('zutat-name').value.trim(),
        kategorie: document.getElementById('zutat-kategorie').value,
        lieferant: document.getElementById('zutat-lieferant').value,
        herkunft: document.getElementById('zutat-herkunft').value,
        preis: {
            basis: parseFloat(document.getElementById('preis-basis').value),
            basiseinheit: document.getElementById('basiseinheit').value,
            verwendungseinheit: document.getElementById('verwendungseinheit').value,
            umrechnungsfaktor: umrechnungsfaktor
        },
        allergene: [],
        naehrwerte: {}
    };

    // Allergene nur hinzufügen, wenn der Bereich sichtbar ist
    if (!allergeneSection.classList.contains('d-none')) {
        data.allergene = Array.from(document.querySelectorAll('#allergene-container .allergen-button.active'))
            .map(button => ({ code: button.dataset.code, name: button.textContent.split(' - ')[1] }));
    }

    // Nährwerte nur hinzufügen, wenn der Bereich sichtbar ist und Werte eingetragen sind
    if (!naehrwerteSection.classList.contains('d-none')) {
        const kalorien = parseFloat(document.getElementById('naehrwert-kalorien').value);
        const fett = parseFloat(document.getElementById('naehrwert-fett').value);
        const zucker = parseFloat(document.getElementById('naehrwert-zucker').value);
        const eiweiss = parseFloat(document.getElementById('naehrwert-eiweiss').value);
        const kohlenhydrate = parseFloat(document.getElementById('naehrwert-kohlenhydrate').value);
        const salz = parseFloat(document.getElementById('naehrwert-salz').value);

        // Nur gefüllte Nährwertfelder dem Objekt hinzufügen
        if (!isNaN(kalorien)) data.naehrwerte.kalorien_kcal = kalorien;
        if (!isNaN(fett)) data.naehrwerte.fett_g = fett;
        if (!isNaN(zucker)) data.naehrwerte.davon_zucker_g = zucker;
        if (!isNaN(eiweiss)) data.naehrwerte.eiweiss_g = eiweiss;
        if (!isNaN(kohlenhydrate)) data.naehrwerte.kohlenhydrate_g = kohlenhydrate;
        if (!isNaN(salz)) data.naehrwerte.salz_g = salz;
    }

    return data;
}

export function isFormValid() {
    return zutatForm.checkValidity();
}

// Stellt die ID der aktuell bearbeiteten Zutat bereit
export function getCurrentlyEditingId() {
    return currentlyEditingId;
}
