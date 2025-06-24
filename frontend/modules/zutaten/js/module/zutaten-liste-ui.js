import { getZutaten, deleteZutat, exportZutaten, importZutaten } from './zutaten-api.js';
import { startEditMode } from './zutaten-ui.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';

let alleZutaten = []; // Lokaler Cache für die Zutatenliste
const listenContainer = document.getElementById('zutaten-liste-container');
const filterInput = document.getElementById('filter-zutaten');
const kategorieFilter = document.getElementById('filter-kategorie');
const sortSelect = document.getElementById('sort-zutaten');
const exportBtn = document.getElementById('zutaten-export-btn');
const importInput = document.getElementById('zutaten-import-input');

/**
 * Rendert die Liste der Zutaten in den Container.
 * @param {Array<object>} zutaten - Das Array der zu rendernden Zutaten.
 */
function renderZutatenListe(zutaten) {
    if (!listenContainer) return;

    listenContainer.innerHTML = ''; // Liste leeren

    if (zutaten.length === 0) {
        listenContainer.innerHTML = '<p class="text-center text-muted">Keine Zutaten gefunden.</p>';
        return;
    }

    zutaten.forEach(zutat => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        // Preis sicher formatieren
        const basisPreis = (zutat.preis && typeof zutat.preis.basis === 'number')
            ? zutat.preis.basis.toFixed(2).replace('.', ',')
            : 'N/A';
        const basisEinheit = (zutat.preis && zutat.preis.basiseinheit)
            ? zutat.preis.basiseinheit
            : '';

        item.innerHTML = `
            <div class="flex-grow-1">
                <strong>${zutat.name}</strong>
                <small class="text-muted d-block">${zutat.kategorie} | ${zutat.lieferant}</small>
            </div>
            <div class="d-flex align-items-center">
                <span class="badge bg-secondary fw-normal rounded-pill me-3">${basisPreis} € / ${basisEinheit}</span>
                <button class="btn btn-sm btn-outline-secondary edit-button me-2" data-id="${zutat.zutatennummer}">
                    <i class="bi bi-pencil"></i><span class="d-none d-md-inline ms-1">Bearbeiten</span>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-button" data-id="${zutat.zutatennummer}">
                    <i class="bi bi-trash"></i><span class="d-none d-md-inline ms-1">Löschen</span>
                </button>
            </div>
        `;
        listenContainer.appendChild(item);
    });
}

/**
 * Filtert und sortiert die Liste basierend auf den aktuellen Einstellungen.
 */
function applyFilterAndSort() {
    const suchbegriff = filterInput.value.toLowerCase();
    const ausgewaehlteKategorie = kategorieFilter.value;
    const sortValue = sortSelect.value;

    let gefilterteZutaten = [...alleZutaten]; // Kopie für die Verarbeitung erstellen

    // 1. Nach Kategorie filtern (wenn eine ausgewählt ist)
    if (ausgewaehlteKategorie) {
        gefilterteZutaten = gefilterteZutaten.filter(zutat => zutat.kategorie === ausgewaehlteKategorie);
    }

    // 2. Anhand des Textes filtern (auf der bereits vorgefilterten Liste)
    if (suchbegriff) {
        gefilterteZutaten = gefilterteZutaten.filter(zutat => 
            zutat.name.toLowerCase().includes(suchbegriff) ||
            zutat.lieferant.toLowerCase().includes(suchbegriff)
        );
    }

    // 3. Sortieren
    switch (sortValue) {
        case 'name-asc':
            gefilterteZutaten.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'name-desc':
            gefilterteZutaten.sort((a, b) => b.name.localeCompare(a.name));
            break;
    }

    renderZutatenListe(gefilterteZutaten);
}

/**
 * Fügt eine einzelne Zutat zur Liste hinzu (an den Anfang).
 * @param {object} zutat - Die neue Zutat, die hinzugefügt werden soll.
 */
export function addZutatToList(zutat) {
    // Neue Zutat am Anfang des Arrays hinzufügen
    alleZutaten.unshift(zutat);
    // Die Liste mit dem aktuellen Filter neu rendern
    applyFilterAndSort();
}

/**
 * Füllt die Filter-Steuerelemente mit Daten (z.B. Kategorien).
 * @param {object} stammdaten - Die Stammdaten mit den Kategorien.
 */
export function initializeFilterControls(stammdaten) {
    if (!kategorieFilter || !stammdaten || !stammdaten.kategorien) return;

    stammdaten.kategorien.forEach(kategorie => {
        const option = new Option(kategorie, kategorie);
        kategorieFilter.add(option);
    });

    // Event-Listener hinzufügen, damit die Liste bei Änderung neu filtert
    kategorieFilter.addEventListener('change', applyFilterAndSort);
}

/**
 * Initialisiert die Zutatenliste, lädt die Daten und richtet den Filter ein.
 */
export async function initializeZutatenListe() {
    if (!listenContainer) return;

    listenContainer.addEventListener('click', async (event) => {
        const editButton = event.target.closest('.edit-button');
        if (editButton) {
            const zutatId = parseInt(editButton.dataset.id, 10);
            const zutatToEdit = alleZutaten.find(z => z.zutatennummer === zutatId);
            if (zutatToEdit) {
                startEditMode(zutatToEdit);
            }
            return;
        }

        const deleteButton = event.target.closest('.delete-button');
        if (deleteButton) {
            const zutatId = parseInt(deleteButton.dataset.id, 10);
            const zutatToDelete = alleZutaten.find(z => z.zutatennummer === zutatId);
            
            if (zutatToDelete && confirm(`Möchten Sie die Zutat "${zutatToDelete.name}" wirklich löschen?`)) {
                try {
                    await deleteZutat(zutatId);
                    showToast('Zutat erfolgreich gelöscht', 'success');
                    
                    // Liste aktualisieren, um die gelöschte Zutat zu entfernen
                    await refreshZutatenListe();

                } catch (error) {
                    showToast(error.message || 'Fehler beim Löschen.', 'error');
                }
            }
        }
    });

    try {
        alleZutaten = await getZutaten();
        applyFilterAndSort();
    } catch (error) {
        console.error('Fehler beim Laden der Zutatenliste:', error);
        listenContainer.innerHTML = '<p class="text-center text-danger">Fehler beim Laden der Zutaten.</p>';
    }

    filterInput?.addEventListener('input', applyFilterAndSort);
    sortSelect?.addEventListener('change', applyFilterAndSort);

    // Event Listener für Export
    exportBtn?.addEventListener('click', async () => {
        try {
            await exportZutaten();
            showToast('Zutaten werden exportiert...', 'info');
        } catch (error) {
            showToast(error.message || 'Export fehlgeschlagen.', 'error');
        }
    });

    // Event Listener für Import
    importInput?.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const result = await importZutaten(file);
            showToast(`${result.importedCount} Zutaten importiert, ${result.skippedCount} Duplikate übersprungen.`, 'success');
            await refreshZutatenListe();
        } catch (error) {
            showToast(error.message || 'Import fehlgeschlagen.', 'error');
        } finally {
            // Das Input-Feld zurücksetzen, damit dieselbe Datei erneut ausgewählt werden kann
            event.target.value = null;
        }
    });
}

/**
 * Lädt die Zutatenliste neu und rendert sie.
 * Wird aufgerufen, nachdem eine neue Zutat gespeichert wurde.
 */
export async function refreshZutatenListe() {
    try {
        alleZutaten = await getZutaten();
        applyFilterAndSort(); // Stellt sicher, dass der bestehende Filter angewendet wird
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Zutatenliste:', error);
    }
} 