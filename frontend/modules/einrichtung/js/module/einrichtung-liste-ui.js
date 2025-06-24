// UI-Handler für die Einrichtungsliste
// Verantwortlich für das Abrufen der Einrichtungsdaten über die API
// und das dynamische Rendern der Liste. 

import { getEinrichtungen, deleteEinrichtung, getEinrichtung } from "./einrichtung-api.js";
import { showToast } from "@shared/components/toast-notification/toast-notification.js";
import { switchToEditMode } from "./einrichtung-form-ui.js";
import { Collapse } from 'bootstrap';

const listeContainer = document.getElementById('einrichtung-liste-container');
const formCollapse = document.getElementById('form-collapse-container');
const bsCollapse = formCollapse ? new Collapse(formCollapse, { toggle: false }) : null;
const searchInput = document.getElementById('search-input');
const sortKeyGroup = document.getElementById('sort-key-group');
const sortDirectionGroup = document.getElementById('sort-direction-group');
let alleEinrichtungen = []; // Cache für alle Einrichtungen
let sortKey = 'name'; // Standard-Sortierkriterium
let sortDirection = 'asc'; // Standard-Sortierrichtung (asc/desc)

/**
 * Erstellt das HTML für eine einzelne Einrichtungskarte.
 * @param {object} einrichtung - Das Einrichtungsobjekt.
 * @returns {string} - Der HTML-String für die Karte.
 */
function createEinrichtungCardHtml(einrichtung) {
    const gesamtPersonen = einrichtung.gruppen.reduce((sum, gruppe) => sum + gruppe.anzahl, 0);

    return `
        <div class="card shadow-sm mb-3">
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">${einrichtung.name} (${einrichtung.kuerzel})</h5>
                        <h6 class="card-subtitle mb-2 text-muted">${einrichtung.adresse}</h6>
                    </div>
                    <span class="badge ${einrichtung.isIntern ? 'bg-primary' : 'bg-secondary'}">${einrichtung.isIntern ? 'Intern' : 'Extern'}</span>
                </div>
                <p class="card-text">
                    <strong>Ansprechperson:</strong> ${einrichtung.ansprechperson || 'N/A'}<br>
                    <strong>Telefon:</strong> ${einrichtung.telefon || 'N/A'}<br>
                    <strong>Gesamtpersonen:</strong> ${gesamtPersonen}
                </p>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary" data-id="${einrichtung.id}">Bearbeiten</button>
                    <button class="btn btn-sm btn-outline-danger" data-id="${einrichtung.id}">Löschen</button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Ruft die Einrichtungen ab und speichert sie im Cache, dann rendert sie.
 */
async function fetchAndRenderEinrichtungen() {
    if (!listeContainer) return;
    listeContainer.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Lade...</span></div>';

    try {
        alleEinrichtungen = await getEinrichtungen();
        // Füge berechnete Eigenschaften hinzu, die für die Sortierung nützlich sind
        alleEinrichtungen.forEach(e => {
            e.gesamtPersonen = e.gruppen.reduce((sum, gruppe) => sum + gruppe.anzahl, 0);
        });
        sortAndRender();
    } catch (error) {
        listeContainer.innerHTML = '<div class="alert alert-danger">Fehler beim Laden der Einrichtungen.</div>';
        showToast('Fehler', 'Die Einrichtungsliste konnte nicht geladen werden.', 'error');
    }
}

/**
 * Sortiert die globale Liste und rendert sie dann.
 */
function sortAndRender() {
    let zuRendern = [...alleEinrichtungen];

    // Dynamische Sortierlogik
    zuRendern.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        let comparison = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
            comparison = valA - valB;
        } else if (typeof valA === 'string' && typeof valB === 'string') {
            comparison = valA.localeCompare(valB, 'de');
        } else {
            // Fallback für gemischte oder undefinierte Typen
            if (valA > valB) comparison = 1;
            else if (valA < valB) comparison = -1;
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
    });

    // Anwenden des Suchfilters
    const suchbegriff = searchInput.value.toLowerCase();
    if (suchbegriff) {
        zuRendern = zuRendern.filter(e => 
            e.name.toLowerCase().includes(suchbegriff) ||
            e.kuerzel.toLowerCase().includes(suchbegriff)
        );
    }
    
    renderEinrichtungen(zuRendern);
}

/**
 * Rendert eine gegebene Liste von Einrichtungen.
 * @param {Array} einrichtungen - Die anzuzeigenden Einrichtungen.
 */
function renderEinrichtungen(einrichtungen) {
    if (!listeContainer) return;
    
    if (einrichtungen.length === 0) {
        if(searchInput.value) {
            listeContainer.innerHTML = '<p class="text-muted">Keine Einrichtungen für Ihre Suche gefunden.</p>';
        } else {
            listeContainer.innerHTML = '<p class="text-muted">Noch keine Einrichtungen erstellt.</p>';
        }
        return;
    }
    listeContainer.innerHTML = einrichtungen.map(createEinrichtungCardHtml).join('');
}

/**
 * Initialisiert die Einrichtungsliste und richtet die Event-Listener ein.
 */
export function initEinrichtungListe() {
    fetchAndRenderEinrichtungen();

    // Event-Listener für die Suche
    searchInput.addEventListener('input', sortAndRender);

    // Event-Listener für Sortier-Kriterium
    if (sortKeyGroup) {
        sortKeyGroup.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || button.classList.contains('active')) return;

            sortKeyGroup.querySelector('.active').classList.remove('active');
            button.classList.add('active');

            sortKey = button.dataset.key;
            sortAndRender();
        });
    }

    // Event-Listener für Sortier-Richtung
    if (sortDirectionGroup) {
        sortDirectionGroup.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || button.classList.contains('active')) return;

            sortDirectionGroup.querySelector('.active').classList.remove('active');
            button.classList.add('active');

            sortDirection = button.dataset.direction;
            sortAndRender();
        });
    }

    // Event-Listener für Bearbeiten/Löschen-Buttons (Delegation)
    listeContainer.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.btn-outline-primary');
        const deleteButton = e.target.closest('.btn-outline-danger');

        if (editButton) {
            const einrichtungId = editButton.dataset.id;
            try {
                const einrichtung = await getEinrichtung(einrichtungId);
                switchToEditMode(einrichtung);
                bsCollapse?.show(); // Formular aufklappen
            } catch (error) {
                showToast('Fehler', 'Die Daten der Einrichtung konnten nicht geladen werden.', 'error');
            }
            return;
        }

        if (deleteButton) {
            const einrichtungId = deleteButton.dataset.id;
            const card = deleteButton.closest('.card');
            const einrichtungName = card.querySelector('.card-title').textContent.split('(')[0].trim();
            
            if (confirm(`Sind Sie sicher, dass Sie die Einrichtung "${einrichtungName}" wirklich löschen möchten?`)) {
                try {
                    await deleteEinrichtung(einrichtungId);
                    showToast('Erfolg', `Einrichtung "${einrichtungName}" wurde gelöscht.`);
                    fetchAndRenderEinrichtungen(); // Liste neu laden
                } catch (error) {
                    showToast('Fehler', error.message, 'error');
                }
            }
            return;
        }
    });

    // Event-Listener für Bearbeiten/Löschen-Buttons (Delegation)
    document.addEventListener('einrichtung-erstellt', () => {
        showToast('Info', 'Aktualisiere Einrichtungsliste...', 'info');
        fetchAndRenderEinrichtungen();
    });
    document.addEventListener('einrichtung-aktualisiert', () => {
        showToast('Info', 'Aktualisiere Einrichtungsliste...', 'info');
        fetchAndRenderEinrichtungen();
    });
} 