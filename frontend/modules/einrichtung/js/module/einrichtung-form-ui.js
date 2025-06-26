// UI-Handler für das Einrichtungsformular
// Verantwortlich für das Rendern des Formulars, die Validierung der Eingaben
// und das Handling von Formular-Events (z.B. Submit). 

import { getStammdaten, createEinrichtung, updateEinrichtung } from "./einrichtung-api.js";
import { showToast } from "@shared/components/toast-notification/toast-notification.js";
import { Collapse } from 'bootstrap';

// Validation Schema - wird bei Bedarf geladen
let einrichtungSchema = null;

const formContainer = document.getElementById('einrichtung-form-container');
const formCollapseEl = document.getElementById('form-collapse-container');
const bsCollapse = formCollapseEl ? new Collapse(formCollapseEl, { toggle: false }) : null;

let currentEditId = null; // Hält die ID des zu bearbeitenden Eintrags

/**
 * Erstellt das HTML für ein einzelnes Formularfeld basierend auf den Optionen.
 */
function createFormField(id, label, type = 'text', options = {}) {
    // ... Implementierung folgt ...
}


/**
 * Baut das HTML für das komplette Einrichtungsformular.
 * @param {object} stammdaten - Die vom Server geladenen Stammdaten.
 * @returns {string} - Der HTML-String für das Formular.
 */
function buildFormHtml(stammdaten) {
    // Hier wird die Struktur des Formulars definiert
    const formHtml = `
        <div class="card shadow-sm rounded-0">
            <div class="card-body">
                <h3 class="card-title mb-4">Neue Einrichtung anlegen</h3>
                <form id="einrichtung-form">
                    <div class="row">

                        <!-- ========== Spalte 1: Grunddaten & Konfiguration ========== -->
                        <div class="col-12 col-lg-4 border-end-lg">
                            <h4 class="h5 mb-3">Grunddaten</h4>
                            <div class="mb-3">
                                <label for="name" class="form-label">Name der Einrichtung</label>
                                <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="mb-3">
                                <label for="kuerzel" class="form-label">Kürzel</label>
                                <input type="text" class="form-control" id="kuerzel" required>
                            </div>
                            <div class="mb-3">
                                <label for="adresse" class="form-label">Adresse</label>
                                <textarea class="form-control" id="adresse" rows="2" required></textarea>
                            </div>
                            <div class="mb-3">
                                <label for="ansprechperson" class="form-label">Ansprechperson</label>
                                <input type="text" class="form-control" id="ansprechperson">
                            </div>
                            <div class="mb-3">
                                <label for="telefon" class="form-label">Telefonnummer</label>
                                <input type="tel" class="form-control" id="telefon">
                            </div>
                            <div class="mb-3">
                                <label for="email" class="form-label">E-Mail</label>
                                <input type="email" class="form-control" id="email">
                            </div>

                            <hr class="my-4">
                            
                            <h4 class="h5 mb-3">Konfiguration</h4>
                            <div class="mb-3">
                                <div class="form-label">Einrichtungstyp</div>
                                <input type="hidden" id="einrichtung-typ" value="extern">
                                <div class="btn-group w-100" role="group" aria-label="Einrichtungstyp">
                                    <button type="button" class="btn btn-outline-primary active" data-typ="extern">Extern</button>
                                    <button type="button" class="btn btn-outline-primary" data-typ="intern">Intern</button>
                                </div>
                            </div>
                             <div class="mb-3">
                                <label for="personengruppe" class="form-label">Personengruppe</label>
                                <select class="form-select" id="personengruppe">
                                    ${stammdaten.personengruppen.map(p => `<option value="${p}">${p}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="tour" class="form-label">Tour</label>
                                <select class="form-select" id="tour">
                                    ${stammdaten.touren.map(t => `<option value="${t.name}">${t.name} (${t.zeit})</option>`).join('')}
                                </select>
                            </div>
                        </div>

                        <!-- ========== Spalte 2: Speiseplan ========== -->
                        <div class="col-12 col-lg-4 border-end-lg">
                            <h4 class="h5 mb-3">Speiseangebot (Mittag)</h4>
                            ${['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'].map(tag => `
                                <div class="mb-3">
                                    <label class="form-label fw-bold d-block">${tag}</label>
                                    <div class="btn-group w-100" role="group" aria-label="Speiseangebot für ${tag}">
                                        ${stammdaten.speiseplanKomponenten.map(komponente => `
                                            <input type="checkbox" class="btn-check" id="${tag}-${komponente}" autocomplete="off" value="${komponente}">
                                            <label class="btn btn-outline-secondary" for="${tag}-${komponente}">${komponente}</label>
                                        `).join('')}
                                        <button type="button" class="btn btn-outline-primary select-all-day-btn" data-tag="${tag}">Alle</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- ========== Spalte 3: Gruppen & Aktionen ========== -->
                        <div class="col-12 col-lg-4">
                            <h4 class="h5 mb-3">Gruppenverwaltung</h4>
                            <div id="gruppen-liste">
                                <!-- Gruppen werden hier dynamisch hinzugefügt -->
                            </div>
                            <button type="button" class="btn btn-outline-secondary btn-sm mt-2" id="add-gruppe-btn">
                                <i class="bi bi-plus"></i> Gruppe hinzufügen
                            </button>
                            <p class="mt-3">Gesamtanzahl Personen: <strong id="gesamt-personen">0</strong></p>

                            <hr class="my-4">
                            
                             <!-- Speiseangebot Abend (nur für Interne) -->
                            <div id="abendessen-container" class="d-none">
                                <h4 class="h5 mb-3">Speiseangebot (Abend)</h4>
                                <!-- Optionen für Abendessen hier -->
                            </div>

                            <div class="d-grid gap-2 mt-5">
                                 <button type="submit" class="btn btn-primary">Einrichtung speichern</button>
                                 <button type="button" class="btn btn-light" id="cancel-btn">Abbrechen</button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;

    // CSS für die responsiven Trennlinien nur einmal hinzufügen
    if (!document.getElementById('form-layout-styles')) {
        const style = document.createElement('style');
        style.id = 'form-layout-styles';
        style.textContent = `
            @media (min-width: 992px) { /* lg breakpoint */
                .border-end-lg {
                    border-right: 1px solid #dee2e6;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    return formHtml;
}

/**
 * Fügt die Event-Listener zum Formular hinzu.
 */
function addFormEventListeners() {
    const form = document.getElementById('einrichtung-form');
    if (!form) return;

    // Listener für "Alle auswählen" bei Speiseangebot
    form.addEventListener('click', (e) => {
        if (e.target.matches('.select-all-day-btn')) {
            const tag = e.target.dataset.tag;
            const checkboxes = Array.from(form.querySelectorAll(`input.btn-check[id^="${tag}-"]`));
            const allSelected = checkboxes.every(checkbox => checkbox.checked);
            const newCheckedState = !allSelected;
            checkboxes.forEach(checkbox => {
                checkbox.checked = newCheckedState;
            });
        }
    });

    // Automatische Hauptspeise-Auswahl bei Suppe oder Dessert
    form.addEventListener('change', (e) => {
        if (e.target.matches('input.btn-check[id*="-Suppe"], input.btn-check[id*="-Dessert"]')) {
            const checkbox = e.target;
            const isChecked = checkbox.checked;
            
            // Tag extrahieren (z.B. "Montag" aus "Montag-Suppe")
            const tagMatch = checkbox.id.match(/^([^-]+)-/);
            if (tagMatch && isChecked) {
                const tag = tagMatch[1];
                const hauptspeiseCheckbox = form.querySelector(`#${tag}-Hauptspeise`);
                
                if (hauptspeiseCheckbox && !hauptspeiseCheckbox.checked) {
                    hauptspeiseCheckbox.checked = true;
                    console.log(`🍽️ Automatische Hauptspeise-Auswahl für ${tag} aktiviert`);
                    
                    // Toast-Benachrichtigung für bessere UX
                    import('@shared/components/toast-notification/toast-notification.js')
                        .then(({ showToast }) => {
                            showToast(`Hauptspeise für ${tag} automatisch hinzugefügt`, 'info', 2000);
                        });
                }
            }
        }
    });

    const typBtnGroup = document.querySelector('[aria-label="Einrichtungstyp"]');
    const addGruppeBtn = document.getElementById('add-gruppe-btn');
    const gruppenListe = document.getElementById('gruppen-liste');
    
    form.addEventListener('submit', handleFormSubmit);

    if (typBtnGroup) {
        typBtnGroup.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || button.classList.contains('select-all-day-btn')) return;

            typBtnGroup.querySelector('.active').classList.remove('active');
            button.classList.add('active');

            const typ = button.dataset.typ;
            document.getElementById('einrichtung-typ').value = typ;
            document.getElementById('abendessen-container').classList.toggle('d-none', typ !== 'intern');
        });
    }

    addGruppeBtn.addEventListener('click', () => {
        addGruppeRow();
    });

    gruppenListe.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-gruppe-btn')) {
            e.target.closest('.gruppen-zeile').remove();
            updateGesamtPersonen();
        }
    });

    gruppenListe.addEventListener('input', (e) => {
        if (e.target.classList.contains('gruppe-anzahl')) {
            updateGesamtPersonen();
        }
    });

    const cancelBtn = document.getElementById('cancel-btn');
    cancelBtn.addEventListener('click', resetForm);

    const addButtons = document.querySelectorAll('#add-einrichtung-btn-mobile, #add-einrichtung-btn-desktop');
    addButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Wenn der "Neu"-Button geklickt wird, stellen wir sicher,
            // dass das Formular für die Neuerstellung bereit ist,
            // falls es zuvor im Bearbeitungsmodus war.
            if (currentEditId !== null) {
                clearAndResetFormState();
            }
        });
    });
}

/**
 * Fügt eine neue Zeile für die Gruppeneingabe hinzu.
 */
function addGruppeRow(gruppe = { name: '', anzahl: '' }) {
    const gruppenListe = document.getElementById('gruppen-liste');
    const row = document.createElement('div');
    row.className = 'row g-2 mb-2 align-items-center gruppen-zeile';
    row.innerHTML = `
        <div class="col-sm-6">
            <input type="text" class="form-control gruppe-name" placeholder="Gruppenname" value="${gruppe.name}">
        </div>
        <div class="col-sm-4">
            <input type="number" class="form-control gruppe-anzahl" placeholder="Anzahl" min="0" value="${gruppe.anzahl}">
        </div>
        <div class="col-sm-2 text-end">
            <button type="button" class="btn btn-sm btn-outline-danger remove-gruppe-btn">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    gruppenListe.appendChild(row);
}

/**
 * Aktualisiert die Anzeige der Gesamtanzahl der Personen.
 */
function updateGesamtPersonen() {
    const gesamtPersonenEl = document.getElementById('gesamt-personen');
    const anzahlInputs = document.querySelectorAll('.gruppe-anzahl');
    const total = Array.from(anzahlInputs).reduce((sum, input) => {
        return sum + (parseInt(input.value, 10) || 0);
    }, 0);
    gesamtPersonenEl.textContent = total;
}

/**
 * Verarbeitet das Absenden des Formulars.
 * @param {Event} e - Das Submit-Event.
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    clearValidationErrors();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Speichern...';

    const einrichtungData = getFormData(form);

    try {
        // Einfache Frontend-Validierung ohne Zod-Abhängigkeit
        const validationErrors = {};
        
        if (!einrichtungData.name || einrichtungData.name.length < 3) {
            validationErrors.name = ['Der Name muss mindestens 3 Zeichen lang sein.'];
        }
        
        if (!einrichtungData.kuerzel || einrichtungData.kuerzel.length < 1) {
            validationErrors.kuerzel = ['Ein Kürzel ist erforderlich.'];
        }
        
        if (!einrichtungData.adresse || einrichtungData.adresse.length < 5) {
            validationErrors.adresse = ['Die Adresse muss mindestens 5 Zeichen lang sein.'];
        }
        
        if (einrichtungData.email && einrichtungData.email.length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(einrichtungData.email)) {
                validationErrors.email = ['Bitte geben Sie eine gültige E-Mail-Adresse ein.'];
            }
        }
        
        if (Object.keys(validationErrors).length > 0) {
            showValidationErrors(validationErrors);
            return;
        }

        if (currentEditId) {
            await updateEinrichtung(currentEditId, einrichtungData);
            showToast('Erfolg', 'Einrichtung wurde erfolgreich aktualisiert.', 'success');
            document.dispatchEvent(new CustomEvent('einrichtung-aktualisiert'));
        } else {
            await createEinrichtung(einrichtungData);
            showToast('Erfolg', 'Neue Einrichtung wurde erfolgreich erstellt.', 'success');
            document.dispatchEvent(new CustomEvent('einrichtung-erstellt'));
        }
        resetForm(); // Setzt das Formular zurück und schließt es
        
    } catch (error) {
        showToast('Fehler', error.message, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Einrichtung speichern';
    }
}

function showValidationErrors(errors) {
    for (const [field, messages] of Object.entries(errors)) {
        const input = document.getElementById(field);
        if (input) {
            input.classList.add('is-invalid');
            const feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            feedback.textContent = messages.join(', ');
            input.parentNode.appendChild(feedback);
        }
    }
}

function clearValidationErrors() {
    document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    document.querySelectorAll('.invalid-feedback').forEach(el => el.remove());
}

/**
 * Liest alle Daten aus dem Formular und gibt sie als Objekt zurück.
 * @param {HTMLFormElement} form - Das Formular-Element.
 * @returns {object} - Die gesammelten Formulardaten.
 */
function getFormData(form) {
    const data = {
        name: form.querySelector('#name').value,
        kuerzel: form.querySelector('#kuerzel').value,
        adresse: form.querySelector('#adresse').value,
        ansprechperson: form.querySelector('#ansprechperson').value,
        telefon: form.querySelector('#telefon').value,
        email: form.querySelector('#email').value,
        isIntern: document.getElementById('einrichtung-typ').value === 'intern',
        personengruppe: form.querySelector('#personengruppe').value,
        tour: form.querySelector('#tour').value,
        speiseplan: {},
        gruppen: []
    };

    // Speiseplan (Mittag)
    const tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    tage.forEach(tag => {
        data.speiseplan[tag.toLowerCase()] = {
            suppe: form.querySelector(`#${tag}-Suppe`)?.checked || false,
            hauptspeise: form.querySelector(`#${tag}-Hauptspeise`)?.checked || false,
            dessert: form.querySelector(`#${tag}-Dessert`)?.checked || false,
        };
    });
    
    // Gruppen
    const anzahlInputs = form.querySelectorAll('.gruppe-anzahl');
    const gruppen = [];
    form.querySelectorAll('.gruppen-zeile').forEach(zeile => {
        const name = zeile.querySelector('.gruppe-name').value;
        const anzahl = parseInt(zeile.querySelector('.gruppe-anzahl').value, 10);
        if (name && anzahl > 0) {
            gruppen.push({ name, anzahl });
        }
    });

    data.gruppen = gruppen;

    return data;
}

/**
 * Setzt benutzerdefinierte Formularelemente zurück, die von form.reset() nicht erfasst werden.
 */
function resetCustomFormElements() {
    const typBtnGroup = document.querySelector('[aria-label="Einrichtungstyp"]');
    if (typBtnGroup) {
        typBtnGroup.querySelector('.active').classList.remove('active');
        typBtnGroup.querySelector('[data-typ="extern"]').classList.add('active');
        document.getElementById('einrichtung-typ').value = 'extern';
        document.getElementById('abendessen-container').classList.add('d-none');
    }
    
    document.getElementById('gruppen-liste').innerHTML = '';
    updateGesamtPersonen();
}

/**
 * Füllt das Formular mit den Daten einer bestehenden Einrichtung.
 * @param {object} einrichtung - Das Einrichtungsobjekt.
 */
function populateForm(einrichtung) {
    const form = document.getElementById('einrichtung-form');
    form.querySelector('#name').value = einrichtung.name;
    form.querySelector('#kuerzel').value = einrichtung.kuerzel;
    form.querySelector('#adresse').value = einrichtung.adresse;
    form.querySelector('#ansprechperson').value = einrichtung.ansprechperson;
    form.querySelector('#telefon').value = einrichtung.telefon;
    form.querySelector('#email').value = einrichtung.email;
    form.querySelector('#personengruppe').value = einrichtung.personengruppe;
    form.querySelector('#tour').value = einrichtung.tour;

    // Einrichtungstyp Buttons
    const isIntern = einrichtung.isIntern;
    document.getElementById('einrichtung-typ').value = isIntern ? 'intern' : 'extern';
    const typBtnGroup = document.querySelector('[aria-label="Einrichtungstyp"]');
    typBtnGroup.querySelector('.active').classList.remove('active');
    typBtnGroup.querySelector(`[data-typ="${isIntern ? 'intern' : 'extern'}"]`).classList.add('active');
    document.getElementById('abendessen-container').classList.toggle('d-none', !isIntern);

    // Speiseplan - mit automatischer Hauptspeise-Korrektur
    Object.keys(einrichtung.speiseplan).forEach(tag => {
        const tagData = einrichtung.speiseplan[tag];
        const tagCapitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
        
        // Prüfe ob Suppe oder Dessert aktiv ist, aber Hauptspeise fehlt
        const hatSuppe = tagData.suppe;
        const hatDessert = tagData.dessert;
        const hatHauptspeise = tagData.hauptspeise;
        
        // Automatische Hauptspeise-Korrektur für bestehende Einrichtungen
        if ((hatSuppe || hatDessert) && !hatHauptspeise) {
            console.log(`🔧 Korrigiere ${tag}: Hauptspeise automatisch hinzugefügt (Suppe: ${hatSuppe}, Dessert: ${hatDessert})`);
            tagData.hauptspeise = true;
        }
        
        // Checkboxen setzen
        Object.keys(tagData).forEach(komponente => {
            const checkbox = form.querySelector(`#${tagCapitalized}-${komponente.charAt(0).toUpperCase() + komponente.slice(1)}`);
            if(checkbox) checkbox.checked = tagData[komponente];
        });
    });

    // Gruppen
    const gruppenListe = document.getElementById('gruppen-liste');
    gruppenListe.innerHTML = ''; // Alte Gruppen entfernen
    einrichtung.gruppen.forEach(gruppe => {
        addGruppeRow(gruppe); // addGruppeRow anpassen, um Daten zu akzeptieren
    });
    updateGesamtPersonen();
}

/**
 * Setzt NUR den Zustand und Inhalt des Formulars zurück, ohne es zu schließen.
 */
function clearAndResetFormState() {
    currentEditId = null;
    const form = document.getElementById('einrichtung-form');
    if (!form) return;

    form.reset(); // Standard-Formular-Reset
    clearValidationErrors();
    resetCustomFormElements(); // Setzt unsere speziellen UI-Elemente zurück
    
    // UI für "Neu anlegen" wiederherstellen
    // Wichtig: Suche vom Container aus, da der Titel außerhalb des Formulars liegt
    const container = document.getElementById('einrichtung-form-container');
    if(container) {
        container.querySelector('h3.card-title').textContent = 'Neue Einrichtung anlegen';
        container.querySelector('button[type="submit"]').textContent = 'Einrichtung speichern';
    }
}

/**
 * Setzt das Formular zurück in den Ausgangszustand (neu anlegen)
 * UND schließt das Akkordeon. Wird für "Abbrechen" und nach Erfolg verwendet.
 */
function resetForm() {
    clearAndResetFormState();
    bsCollapse?.hide();
}

/**
 * Schaltet das Formular in den Bearbeitungsmodus und füllt es mit Daten.
 */
export function switchToEditMode(einrichtung) {
    clearAndResetFormState(); // Setzt das Formular zuerst zurück
    currentEditId = einrichtung.id;
    
    // Wichtig: Suche vom Container aus, da der Titel außerhalb des Formulars liegt
    const container = document.getElementById('einrichtung-form-container');
    if (!container) return;

    // UI für "Bearbeiten" anpassen
    container.querySelector('h3.card-title').textContent = `Einrichtung bearbeiten: ${einrichtung.name}`;
    container.querySelector('button[type="submit"]').textContent = 'Änderungen speichern';
    
    populateForm(einrichtung);

    // Akkordeon öffnen, falls es geschlossen ist
    bsCollapse?.show();
}

/**
 * Initialisiert das Einrichtungsformular, lädt Stammdaten und rendert es.
 */
export async function initEinrichtungForm() {
    if (!formContainer) return;

    try {
        const stammdaten = await getStammdaten();
        formContainer.innerHTML = buildFormHtml(stammdaten);
        addFormEventListeners();
        
        // Einmalige automatische Korrektur der bestehenden Speiseplan-Logik
        try {
            const { autoFixSpeiseplanOnLoad } = await import('../../fix-speiseplan-logic.js');
            await autoFixSpeiseplanOnLoad();
        } catch (error) {
            console.warn('⚠️ Auto-Fix Skript konnte nicht geladen werden:', error);
        }
        
    } catch (error) {
        console.error("Fehler beim Initialisieren des Einrichtungsformulars:", error);
        formContainer.innerHTML = '<div class="alert alert-danger">Fehler beim Laden des Formulars.</div>';
    }
} 