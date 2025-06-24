// In dieser Datei wird die Logik zum Rendern der Rezeptliste gekapselt.
// z.B. renderRezeptListe(rezepte), etc. 

// Dieses Modul verwaltet die Anzeige und Interaktion der Rezeptliste.
// Es kapselt die Logik für das Rendern, Filtern und Sortieren von Rezepten.

// Interner Zustand des Moduls
const state = {
    alleRezepte: [],
    searchTerm: '',
    sortBy: 'name-asc', // Standard-Sortierung
};

// DOM-Elemente
let listeContainer;
let sucheInput;
let sortierungSelect;

/**
 * Initialisiert das Modul, selektiert DOM-Elemente und richtet Event-Listener ein.
 */
export function initRezeptListe() {
    listeContainer = document.getElementById('rezept-liste-container');
    sucheInput = document.getElementById('rezept-suche-input');
    sortierungSelect = document.getElementById('rezept-sortierung-select');

    if (!listeContainer || !sucheInput || !sortierungSelect) {
        console.error('Einige Elemente für die Rezeptliste wurden nicht gefunden.');
        return;
    }

    sucheInput.addEventListener('input', (e) => {
        state.searchTerm = e.target.value;
        renderRezeptListe();
    });

    sortierungSelect.addEventListener('change', (e) => {
        state.sortBy = e.target.value;
        renderRezeptListe();
    });
}

/**
 * Aktualisiert die Liste der Rezepte von außen.
 * @param {Array} neueRezepte - Das vollständige Array mit den neuen Rezepten.
 */
export function updateRezeptListe(neueRezepte) {
    state.alleRezepte = neueRezepte;
    renderRezeptListe();
}

/**
 * Filtert und sortiert die Rezepte basierend auf dem aktuellen Zustand.
 * @returns {Array} Das gefilterte und sortierte Array von Rezepten.
 */
function filterAndSortRezepte() {
    let gefilterteRezepte = [...state.alleRezepte];

    // 1. Filtern nach Suchbegriff
    if (state.searchTerm) {
        const suchbegriff = state.searchTerm.toLowerCase();
        gefilterteRezepte = gefilterteRezepte.filter(rezept =>
            rezept.name.toLowerCase().includes(suchbegriff)
        );
    }

    // 2. Sortieren
    gefilterteRezepte.sort((a, b) => {
        switch (state.sortBy) {
            case 'name-asc':
                return a.name.localeCompare(b.name);
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'date-new':
                // Annahme: Rezepte haben eine 'createdAt' Eigenschaft. Falls nicht, muss dies angepasst werden.
                return new Date(b.createdAt) - new Date(a.createdAt);
            case 'date-old':
                return new Date(a.createdAt) - new Date(b.createdAt);
            default:
                return 0;
        }
    });

    return gefilterteRezepte;
}

/**
 * Rendert die Liste der Rezepte im entsprechenden Container.
 * Verwendet die gefilterten und sortierten Daten.
 */
function renderRezeptListe() {
    if (!listeContainer) return;

    const anzuzeigendeRezepte = filterAndSortRezepte();

    listeContainer.innerHTML = ''; // Leert die Liste vor dem Neuzeichnen

    if (anzuzeigendeRezepte.length === 0) {
        listeContainer.innerHTML = '<p class="text-center text-muted">Keine passenden Rezepte gefunden.</p>';
        return;
    }

    anzuzeigendeRezepte.forEach(rezept => {
        const rezeptElement = document.createElement('a');
        rezeptElement.href = '#'; // Verhindert Neuladen der Seite
        rezeptElement.className = 'list-group-item list-group-item-action';
        rezeptElement.dataset.id = rezept.id;

        // Erstellungsdatum für Sortierung (optional in Anzeige)
        const erstelltAm = rezept.createdAt ? new Date(rezept.createdAt).toLocaleDateString('de-DE') : '';
        const erstelltVon = rezept.createdBy?.name || '';

        let erstellInfo = '';
        if (erstelltVon && erstelltAm) {
            erstellInfo = `Erstellt von ${erstelltVon} am ${erstelltAm}`;
        } else if (erstelltAm) {
            erstellInfo = `Erstellt am ${erstelltAm}`;
        }

        rezeptElement.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h5 class="mb-1">${rezept.name}</h5>
                <small class="text-muted">${rezept.kategorie || 'Ohne Kategorie'}</small>
            </div>
            <p class="mb-1 text-truncate">${rezept.anleitung || 'Keine Anleitung vorhanden.'}</p>
            <div class="d-flex justify-content-between align-items-center mt-2">
                 <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-primary" data-action="edit">
                        <i class="bi bi-pencil-fill"></i> <span class="d-none d-md-inline">Bearbeiten</span>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-action="delete">
                        <i class="bi bi-trash-fill"></i> <span class="d-none d-md-inline">Löschen</span>
                    </button>
                </div>
                <small class="text-muted">${erstellInfo}</small>
            </div>
        `;
        listeContainer.appendChild(rezeptElement);
    });
} 