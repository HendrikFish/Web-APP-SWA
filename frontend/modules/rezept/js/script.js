// Importiert Bootstrap, die Icons und unsere eigenen Stile.
// Die Reihenfolge ist wichtig: zuerst das Framework, dann unsere Anpassungen.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@shared/styles/layout.css';
import '../css/style.css';

import { initializeHeader } from '@shared/components/header/header.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { createRezept, fetchRezepte, fetchRezeptStammdaten, fetchAlleZutaten, deleteRezept, updateRezept } from './module/rezept-api.js';
import { initRezeptListe, updateRezeptListe } from './module/rezept-liste-ui.js';
import { 
    getRezeptFormularDaten,
    renderRezeptFormular, 
    populateKategorien, 
    renderZutatVorschlaege,
    renderAktuelleRezeptZutaten,
    updateLiveSummary,
    resetRezeptFormular
} from './module/rezept-form-ui.js';
import { berechnePreisFürMenge, erstellePreisaufschlüsselung } from './module/preis-berechnung.js';

// Globale State-Variablen für das Modul
let alleZutaten = [];
let alleRezepte = [];
let aktuelleRezeptZutaten = [];

async function initializeRezeptModul() {
    console.log("Rezept-Modul wird initialisiert...");
    
    // UI-Komponente für die Liste initialisieren (richtet Listener ein)
    initRezeptListe();

    // Vorabladen aller Zutaten für die Suche
    try {
        alleZutaten = await fetchAlleZutaten();
    } catch (error) {
        console.error('Kritischer Fehler: Die globale Zutatenliste konnte nicht geladen werden.', error);
        showToast('Die Zutatensuche ist nicht verfügbar.', 'error');
    }

    await refreshRezeptListe();

    // Event Listener für "Neues Rezept erstellen"
    const neuesRezeptBtn = document.getElementById('neues-rezept-btn');
    if (neuesRezeptBtn) {
        neuesRezeptBtn.addEventListener('click', async () => {
            aktuelleRezeptZutaten = []; // Zustand zurücksetzen
            renderRezeptFormular(); 
            renderAktuelleRezeptZutaten(aktuelleRezeptZutaten);
            try {
                const stammdaten = await fetchRezeptStammdaten();
                populateKategorien(stammdaten.kategorien);
                setupFormEventListeners(); // Event Listeners für das neue Formular einrichten
            } catch (error) {
                console.error('Fehler beim Laden der Stammdaten für das Formular:', error);
                showToast('Kategorien konnten nicht geladen werden.', 'error');
            }
        });
    }

    // Delegierten Event Listener für die ganze Liste hinzufügen
    const listeContainer = document.getElementById('rezept-liste-container');
    if (listeContainer) {
        listeContainer.addEventListener('click', handleListenAktion);
    }

    // Delegierter Event Listener für Formular-Submissions.
    // Wird nur EINMAL an ein statisches Elternelement gehängt.
    document.querySelector('main.container').addEventListener('submit', (e) => {
        if (e.target.id === 'rezept-form') {
            handleFormSubmit(e);
        }
    });
}

async function refreshRezeptListe() {
    try {
        alleRezepte = await fetchRezepte();
        updateRezeptListe(alleRezepte);
    } catch (error) {
        console.error('Fehler beim Initialisieren der Rezeptliste:', error);
        showToast('Fehler beim Laden der Rezepte.', 'error');
        const listeContainer = document.getElementById('rezept-liste-container');
        if(listeContainer) {
            listeContainer.innerHTML = '<p class="text-center text-danger">Die Rezepte konnten nicht geladen werden.</p>';
        }
    }
}

function setupFormEventListeners() {
    const zutatSucheInput = document.getElementById('zutat-suche');
    const vorschlaegeContainer = document.getElementById('zutat-vorschlaege-container');
    const form = document.getElementById('rezept-form');
    const zutatenListeContainer = document.getElementById('rezept-zutaten-liste');

    // Event Listener für die Zutatensuche
    if(zutatSucheInput) {
        zutatSucheInput.addEventListener('input', () => {
            const suchbegriff = zutatSucheInput.value.toLowerCase();
            if (suchbegriff.length < 2) {
                renderZutatVorschlaege([]);
                return;
            }
            const passendeZutaten = alleZutaten.filter(z => z.name.toLowerCase().includes(suchbegriff));
            renderZutatVorschlaege(passendeZutaten.slice(0, 5));
        });
    }

    // Event Listener für das Klicken auf einen Vorschlag
    if(vorschlaegeContainer) {
        vorschlaegeContainer.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('a');
            if (!target) return;

            const zutatId = target.dataset.id;
            const bereitsVorhanden = aktuelleRezeptZutaten.find(z => z.id === zutatId);

            if (!bereitsVorhanden) {
                const zutat = alleZutaten.find(z => z.id === zutatId);
                aktuelleRezeptZutaten.push({ ...zutat, menge: 1, einheit: zutat.preis?.verwendungseinheit || 'Stk' });
                renderAktuelleRezeptZutaten(aktuelleRezeptZutaten);
                updateLiveSummary(aktuelleRezeptZutaten);
            }
            
            zutatSucheInput.value = '';
            renderZutatVorschlaege([]);
        });
    }

    // Delegierter Event Listener für Aktionen in der Zutatenliste (Entfernen, Menge ändern)
    if(zutatenListeContainer) {
        zutatenListeContainer.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = e.target.dataset.id;

            if (action === 'remove-zutat') {
                aktuelleRezeptZutaten = aktuelleRezeptZutaten.filter(z => z.id !== id);
                renderAktuelleRezeptZutaten(aktuelleRezeptZutaten);
                updateLiveSummary(aktuelleRezeptZutaten);
                return;
            }

            if (action === 'step-up' || action === 'step-down') {
                const input = document.getElementById(`menge-${id}`);
                if (!input) return;

                const zutat = aktuelleRezeptZutaten.find(z => z.id === id);
                if (!zutat) return;

                const einheit = zutat.einheit?.toLowerCase() || 'stk';
                const schritt = (einheit === 'g' || einheit === 'ml') ? 10 : 1;

                let wert = parseFloat(input.value) || 0;
                
                if (action === 'step-up') {
                    wert += schritt;
                } else {
                    wert -= schritt;
                }

                input.value = wert < 0 ? 0 : wert;
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        zutatenListeContainer.addEventListener('input', (e) => {
            if (e.target.matches('input[data-field="menge"]')) {
                const zutatId = e.target.dataset.id;
                const neueMenge = parseFloat(e.target.value) || 0;
                const zutatImState = aktuelleRezeptZutaten.find(z => z.id === zutatId);
                if (zutatImState) {
                    zutatImState.menge = neueMenge;
                }
                updateLiveSummary(aktuelleRezeptZutaten);
            }
            
            if (e.target.matches('input[data-field="durchschnittsgewicht"]')) {
                const zutatId = e.target.dataset.id;
                const neuesDurchschnittsgewicht = parseFloat(e.target.value) || 100;
                const zutatImState = aktuelleRezeptZutaten.find(z => z.id === zutatId);
                if (zutatImState) {
                    zutatImState.durchschnittsgewicht = neuesDurchschnittsgewicht;
                }
                updateLiveSummary(aktuelleRezeptZutaten);
            }
        });
    }
}

/**
 * Behandelt die `submit`-Anfrage des Rezeptformulars.
 * @param {Event} e Das Submit-Event.
 */
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const editingId = form.dataset.id;

    try {
        const rezeptDaten = getRezeptFormularDaten(aktuelleRezeptZutaten);

        if (!rezeptDaten.name || !rezeptDaten.kategorie) {
            showToast('Bitte Rezeptname und Kategorie ausfüllen.', 'warning');
            return;
        }
        if (rezeptDaten.zutaten.length === 0) {
            showToast('Bitte fügen Sie mindestens eine Zutat hinzu.', 'warning');
            return;
        }

        if (editingId) {
            await updateRezept(editingId, rezeptDaten);
            showToast('Rezept erfolgreich aktualisiert!', 'success');
        } else {
            await createRezept(rezeptDaten);
            showToast('Rezept erfolgreich erstellt!', 'success');
        }
        
        resetRezeptFormular();
        await refreshRezeptListe();
        aktuelleRezeptZutaten = [];

    } catch (error) {
        console.error('Fehler beim Speichern des Rezepts:', error);
        showToast(error.message, 'error');
    }
}

async function handleListenAktion(e) {
    const target = e.target;
    const button = target.closest('button[data-action]');
    if (!button) return;

    const rezeptElement = target.closest('a.list-group-item');
    const rezeptId = rezeptElement.dataset.id;
    const action = button.dataset.action;

    if (action === 'delete') {
        if (confirm('Sind Sie sicher, dass Sie dieses Rezept wirklich löschen möchten?')) {
            try {
                await deleteRezept(rezeptId);
                showToast('Rezept erfolgreich gelöscht.', 'success');
                await refreshRezeptListe();
            } catch (error) {
                console.error('Fehler beim Löschen des Rezepts:', error);
                showToast(error.message, 'error');
            }
        }
    }
    
    if (action === 'edit') {
        const rezeptZumBearbeiten = alleRezepte.find(r => r.id === rezeptId);
        if (!rezeptZumBearbeiten) {
            showToast('Fehler: Rezept nicht gefunden.', 'error');
            return;
        }

        aktuelleRezeptZutaten = rezeptZumBearbeiten.zutaten.map(rezeptZutat => {
            const vollesZutatObjekt = alleZutaten.find(z => z.id === rezeptZutat.zutatId);
            const einheit = rezeptZutat.einheit || vollesZutatObjekt?.preis?.verwendungseinheit || 'Stk';
            
            // Durchschnittsgewicht laden oder aus Stammdaten ableiten
            const durchschnittsgewicht = rezeptZutat.durchschnittsgewicht || 
                vollesZutatObjekt?.durchschnittsgewicht;
            
            return { 
                ...vollesZutatObjekt, 
                menge: rezeptZutat.menge, 
                einheit: einheit,
                durchschnittsgewicht: durchschnittsgewicht
            };
        });
        
        renderRezeptFormular(rezeptZumBearbeiten);
        renderAktuelleRezeptZutaten(aktuelleRezeptZutaten);

        try {
            const stammdaten = await fetchRezeptStammdaten();
            populateKategorien(stammdaten.kategorien);
            document.getElementById('rezept-kategorie').value = rezeptZumBearbeiten.kategorie;
            setupFormEventListeners();
            updateLiveSummary(aktuelleRezeptZutaten);
        } catch (error) {
            console.error('Fehler beim Laden der Stammdaten für das Bearbeiten:', error);
            showToast('Kategorien konnten nicht geladen werden.', 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeHeader();
        await initializeRezeptModul();
        showToast('Rezept-Modul erfolgreich geladen!', 'success');
    } catch (error) {
        console.error('Fehler bei der Initialisierung des Rezept-Moduls:', error);
        showToast('Fehler beim Laden des Rezept-Moduls.', 'error');
    }
}); 