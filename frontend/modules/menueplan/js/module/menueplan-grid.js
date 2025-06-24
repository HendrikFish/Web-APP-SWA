// menueplan-grid.js
// Dieses Modul ist ausschließlich für das Rendern des visuellen Wochen-Rasters zuständig.
// Es folgt einem reinen "Render"-Ansatz: Es nimmt den aktuellen Zustand entgegen
// und zeichnet das Grid jedes Mal komplett neu, ohne manuelle DOM-Manipulationen.

import {
    getState,
    removeRezeptFromPlan,
    toggleEinrichtungsZuweisung
} from './menueplan-state.js';

// Callback entfernt - wird nicht mehr benötigt

/**
 * Erstellt eine einzelne Rezept-Karte.
 * @param {object} rezept - Das Rezept-Objekt { id, name }.
 * @returns {HTMLElement} - Das Karten-Element.
 */
function createRezeptCard(rezept) {
    const card = document.createElement('div');
    card.className = 'rezept-card';
    card.dataset.rezeptId = rezept.id;
    card.innerHTML = `
        <i class="bi bi-grip-vertical rezept-drag-handle" draggable="true" title="Rezept verschieben"></i>
            <span class="rezept-name">${rezept.name}</span>
            <button type="button" class="btn-close" aria-label="Rezept entfernen"></button>
    `;
    return card;
}

/**
 * Erstellt die Buttons für die Einrichtungszuweisung.
 * @param {string} tag - Der Wochentag.
 * @param {object} kategorie - Das Kategorie-Objekt.
 * @param {object} anforderungsmatrix - Die Matrix der Einrichtungsanforderungen.
 * @param {object} zuweisungen - Die aktuellen Zuweisungen aus dem Plan.
 * @returns {HTMLElement} - Der Container mit den Buttons.
 */
function createEinrichtungsButtons(tag, kategorie, anforderungsmatrix, zuweisungen) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'einrichtungs-buttons d-flex flex-wrap gap-1 mt-2';

    const benoetigteEinrichtungen = anforderungsmatrix[tag]?.[kategorie.id] || [];
    benoetigteEinrichtungen.forEach(e => {
        const isSelected = zuweisungen[kategorie.id]?.includes(e.id);
        const andereKategorie = kategorie.id === 'menu1' ? 'menu2' : 'menu1';
        const isAssignedToOther = zuweisungen[andereKategorie]?.includes(e.id);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn flex-fill ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`;
        if(isAssignedToOther) button.classList.add('d-none');
        
        button.dataset.tag = tag;
        button.dataset.kategorie = kategorie.id;
        button.dataset.einrichtungId = e.id;
        button.title = e.name || '';
        button.textContent = e.kuerzel;
        buttonsContainer.appendChild(button);
    });

    return buttonsContainer;
}

/**
 * Aktualisiert den Inhalt einer einzelnen Drop-Zone mit den neuesten Rezepten.
 * @param {HTMLElement} dropZone - Das DOM-Element der Drop-Zone.
 * @param {Array} rezepte - Das Array der Rezept-Objekte für diese Zone.
 */
function updateDropZoneContent(dropZone, rezepte) {
    dropZone.innerHTML = ''; // Nur den Inhalt der Zone leeren
    rezepte.forEach(rezept => {
        dropZone.appendChild(createRezeptCard(rezept));
    });
    dropZone.classList.toggle('has-content', rezepte.length > 0);
}

/**
 * Die zentrale Render-Funktion. Baut das Grid initial auf und aktualisiert es danach gezielt.
 * Unterstützt sowohl Desktop-Grid als auch Mobile-Accordion-Layout.
 */
function render() {
    const gridWrapper = document.getElementById('menueplan-grid-wrapper');
    if (!gridWrapper) return;

    const { currentPlan, stammdaten } = getState();
    if (!currentPlan || !stammdaten) return;
    
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const kategorien = stammdaten.stammdaten.kategorien;

    // Prüfe ob Mobile-Layout benötigt wird
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        renderMobileAccordion(gridWrapper, wochentage, kategorien, currentPlan, stammdaten);
        return;
    }

    let gridContainer = gridWrapper.querySelector('.menueplan-grid');

    // --- Fall 1: Das Grid existiert noch nicht -> Initialaufbau ---
    if (!gridContainer) {
        gridContainer = document.createElement('div');
        gridContainer.className = 'menueplan-grid';
        
        // Header-Zeile erstellen
        const header = document.createElement('div');
        header.className = 'grid-header';
        header.innerHTML = `<div class="grid-header-cell grid-corner-cell">Mahlzeit</div>`;
        wochentage.forEach(tag => {
            const tagCapitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
            header.innerHTML += `<div class="grid-header-cell">${tagCapitalized}</div>`;
        });
        gridContainer.appendChild(header);

        // Grid-Zeilen und Zellen erstellen
        kategorien.forEach(kategorie => {
            const kategorieCell = document.createElement('div');
            kategorieCell.className = 'grid-kategorie-cell';
            kategorieCell.textContent = kategorie.name;
            
            gridContainer.appendChild(kategorieCell);

            wochentage.forEach(tag => {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.tag = tag.toLowerCase();
                cell.dataset.kategorie = kategorie.id;

                const handle = document.createElement('div');
                handle.className = 'cell-drag-handle';
                handle.draggable = true;
                handle.innerHTML = `<i class="bi bi-grip-vertical" title="Alle Rezepte in dieser Zelle verschieben"></i>`;
                cell.appendChild(handle);

                const cellContent = document.createElement('div');
                cellContent.className = 'cell-content-wrapper';

                const dropZone = document.createElement('div');
                dropZone.className = 'drop-zone';
                dropZone.id = `dropzone-${tag}-${kategorie.id}`;
                dropZone.dataset.tag = tag;
                dropZone.dataset.kategorie = kategorie.id;
                cellContent.appendChild(dropZone);

                if (kategorie.id === 'menu1' || kategorie.id === 'menu2') {
                    const buttonsContainer = document.createElement('div');
                    buttonsContainer.className = 'einrichtungs-buttons-wrapper';
                    cellContent.appendChild(buttonsContainer);
                }

                cell.appendChild(cellContent);
                gridContainer.appendChild(cell);
            });
        });
        
        gridWrapper.innerHTML = ''; // Nur beim allerersten Mal leeren
        gridWrapper.appendChild(gridContainer);
    }

    // --- Fall 2: Gezielte Aktualisierung des bestehenden Grids ---
    const anforderungsmatrix = getAnforderungsmatrix(stammdaten.einrichtungen, stammdaten.stammdaten);
    kategorien.forEach(kategorie => {
        wochentage.forEach(tag => {
            const cell = gridContainer.querySelector(`.grid-cell[data-tag='${tag}'][data-kategorie='${kategorie.id}']`);
            if (!cell) return;

            // Drop-Zone Inhalt aktualisieren
            const dropZone = cell.querySelector('.drop-zone');
            const rezepteInSlot = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie.id] || [];
            if(dropZone) {
                updateDropZoneContent(dropZone, rezepteInSlot);
            }

            // Einrichtungs-Buttons aktualisieren
            if (kategorie.id === 'menu1' || kategorie.id === 'menu2') {
                const buttonsWrapper = cell.querySelector('.einrichtungs-buttons-wrapper');
                const zuweisungen = currentPlan.days?.[tag]?.Zuweisungen || {};
                if(buttonsWrapper) {
                    buttonsWrapper.innerHTML = ''; // Nur Buttons leeren
                    buttonsWrapper.appendChild(createEinrichtungsButtons(tag, kategorie, anforderungsmatrix, zuweisungen));
                }
            }
        });
    });
}

/**
 * Rendert das Mobile-Accordion-Layout
 * @param {HTMLElement} gridWrapper - Der Container
 * @param {Array} wochentage - Die Wochentage
 * @param {Array} kategorien - Die Mahlzeit-Kategorien  
 * @param {Object} currentPlan - Der aktuelle Plan
 * @param {Object} stammdaten - Die Stammdaten
 */
function renderMobileAccordion(gridWrapper, wochentage, kategorien, currentPlan, stammdaten) {
    let mobileContainer = gridWrapper.querySelector('.mobile-accordion');
    
    // Container erstellen falls nicht vorhanden
    if (!mobileContainer) {
        mobileContainer = document.createElement('div');
        mobileContainer.className = 'mobile-accordion';
        gridWrapper.innerHTML = ''; // Desktop-Grid entfernen
        gridWrapper.appendChild(mobileContainer);
    }

    const anforderungsmatrix = getAnforderungsmatrix(stammdaten.einrichtungen, stammdaten.stammdaten);
    
    // Accordion für jeden Tag erstellen/aktualisieren
    wochentage.forEach(tag => {
        const tagCapitalized = tag.charAt(0).toUpperCase() + tag.slice(1);
        let daySection = mobileContainer.querySelector(`[data-day="${tag}"]`);
        
        if (!daySection) {
            // Tag-Sektion erstellen
            daySection = document.createElement('div');
            daySection.className = 'day-accordion-section';
            daySection.dataset.day = tag;
            
            // Tag-Header erstellen
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `
                <div class="day-title">
                    <span>${tagCapitalized}</span>
                    <span class="day-counter">0 Rezepte</span>
                </div>
                <i class="bi bi-chevron-down day-toggle-icon"></i>
            `;
            
            // Tag-Inhalt erstellen
            const dayContent = document.createElement('div');
            dayContent.className = 'day-content';
            
            daySection.appendChild(dayHeader);
            daySection.appendChild(dayContent);
            mobileContainer.appendChild(daySection);
            
                         // Click-Handler für Expand/Collapse
             dayHeader.addEventListener('click', () => {
                 const isExpanded = dayHeader.classList.contains('expanded');
                 
                 // Alle anderen Tage schließen
                 mobileContainer.querySelectorAll('.day-header').forEach(header => {
                     header.classList.remove('expanded');
                     header.parentNode.querySelector('.day-content').classList.remove('expanded');
                 });
                 
                 // Aktuellen Tag togglen
                 if (!isExpanded) {
                     dayHeader.classList.add('expanded');
                     dayContent.classList.add('expanded');
                 }
             });
             
             // Auto-Expand entfernt - alle Accordions starten geschlossen für bessere Übersicht
        }
        
        // Tag-Inhalt aktualisieren
        const dayContent = daySection.querySelector('.day-content');
        const dayHeader = daySection.querySelector('.day-header');
        
        // Rezept-Counter berechnen
        let totalRezepte = 0;
        kategorien.forEach(kategorie => {
            const rezepte = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie.id] || [];
            totalRezepte += rezepte.length;
        });
        
        // Counter aktualisieren
        const counter = dayHeader.querySelector('.day-counter');
        counter.textContent = `${totalRezepte} Rezept${totalRezepte !== 1 ? 'e' : ''}`;
        
        // Kategorien rendern
        dayContent.innerHTML = '';
        kategorien.forEach(kategorie => {
            const categoryRow = document.createElement('div');
            categoryRow.className = 'mobile-category-row';
            
            // Kategorie-Icon basierend auf Typ
            const iconMap = {
                'suppe': '🍲',
                'menu1': '🍽️', 
                'menu2': '🥘',
                'beilage': '🥗',
                'dessert': '🍰',
                'getraenk': '🥤'
            };
            const icon = iconMap[kategorie.id] || '🍴';
            
            categoryRow.innerHTML = `
                <div class="mobile-category-title">
                    <span class="mobile-category-icon">${icon}</span>
                    <span>${kategorie.name}</span>
                </div>
                <div class="mobile-drop-zone-container">
                    <div class="mobile-zone-drag-handle" data-tag="${tag}" data-kategorie="${kategorie.id}" title="Alle Rezepte dieser Kategorie verschieben">
                        <i class="bi bi-grip-vertical"></i>
                    </div>
                    <div class="mobile-drop-zone" data-tag="${tag}" data-kategorie="${kategorie.id}" id="mobile-dropzone-${tag}-${kategorie.id}">
                        <div class="mobile-drop-zone-placeholder">Rezept hier hinzufügen</div>
                    </div>
                </div>
            `;
            
            dayContent.appendChild(categoryRow);
            
            // Drop-Zone Inhalt aktualisieren
            const dropZone = categoryRow.querySelector('.mobile-drop-zone');
            const rezepte = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie.id] || [];
            updateMobileDropZoneContent(dropZone, rezepte);
            
            // Einrichtungs-Buttons für Menüs hinzufügen
            if (kategorie.id === 'menu1' || kategorie.id === 'menu2') {
                const zuweisungen = currentPlan.days?.[tag]?.Zuweisungen || {};
                const buttonsContainer = createMobileEinrichtungsButtons(tag, kategorie, anforderungsmatrix, zuweisungen);
                categoryRow.appendChild(buttonsContainer);
            }
        });
    });
}

/**
 * Aktualisiert den Inhalt einer Mobile Drop-Zone
 * @param {HTMLElement} dropZone - Das Drop-Zone Element
 * @param {Array} rezepte - Array der Rezepte
 */
function updateMobileDropZoneContent(dropZone, rezepte) {
    const placeholder = dropZone.querySelector('.mobile-drop-zone-placeholder');
    const container = dropZone.closest('.mobile-drop-zone-container');
    
    if (rezepte.length === 0) {
        if (placeholder) placeholder.style.display = 'block';
        dropZone.classList.remove('has-content');
        if (container) container.classList.remove('has-content');
        // Entferne alle Rezept-Karten
        dropZone.querySelectorAll('.rezept-card').forEach(card => card.remove());
    } else {
        if (placeholder) placeholder.style.display = 'none';
        dropZone.classList.add('has-content');
        if (container) container.classList.add('has-content');
        
        // Entferne bestehende Karten
        dropZone.querySelectorAll('.rezept-card').forEach(card => card.remove());
        
        // Neue Karten hinzufügen
        rezepte.forEach(rezept => {
            dropZone.appendChild(createRezeptCard(rezept));
        });
    }
}

/**
 * Erstellt Einrichtungs-Buttons für Mobile Layout
 * @param {string} tag - Der Wochentag
 * @param {object} kategorie - Die Kategorie
 * @param {object} anforderungsmatrix - Die Anforderungsmatrix
 * @param {object} zuweisungen - Die aktuellen Zuweisungen
 * @returns {HTMLElement} - Der Button-Container
 */
function createMobileEinrichtungsButtons(tag, kategorie, anforderungsmatrix, zuweisungen) {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'mobile-einrichtungs-buttons';

    const benoetigteEinrichtungen = anforderungsmatrix[tag]?.[kategorie.id] || [];
    
    if (benoetigteEinrichtungen.length > 0) {
        const title = document.createElement('div');
        title.className = 'fw-bold text-muted mb-2';
        title.innerHTML = `<i class="bi bi-building"></i> Einrichtungs-Zuweisungen:`;
        buttonsContainer.appendChild(title);
        
        benoetigteEinrichtungen.forEach(e => {
            const isSelected = zuweisungen[kategorie.id]?.includes(e.id);
            const andereKategorie = kategorie.id === 'menu1' ? 'menu2' : 'menu1';
            const isAssignedToOther = zuweisungen[andereKategorie]?.includes(e.id);

            if (!isAssignedToOther) {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `btn ${isSelected ? 'btn-primary' : 'btn-outline-secondary'}`;
                button.dataset.tag = tag;
                button.dataset.kategorie = kategorie.id;
                button.dataset.einrichtungId = e.id;
                button.title = e.name || '';
                button.textContent = e.kuerzel;
                buttonsContainer.appendChild(button);
            }
        });
    }

    return buttonsContainer;
}

/**
 * Erstellt eine Anforderungsmatrix, die angibt, welche Einrichtung an welchem Tag welche Mahlzeit benötigt.
 * GESCHÄFTSLOGIK: Verwendet bei historischen Plänen den gespeicherten Snapshot statt aktueller Stammdaten.
 * @returns {object} Die Anforderungsmatrix.
 */
function getAnforderungsmatrix(einrichtungen, stammdaten) {
    const { currentPlan } = getState();
    
    // GESCHÄFTSLOGIK: Historische Genauigkeit - verwende Snapshot falls vorhanden
    let aktuelleEinrichtungen = einrichtungen;
    if (currentPlan?.einrichtungsSnapshot?.einrichtungen) {
        console.log('Verwende historischen Einrichtungs-Snapshot für Menüplan');
        aktuelleEinrichtungen = currentPlan.einrichtungsSnapshot.einrichtungen;
    }
    const matrix = {};
    const tage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    
    tage.forEach(tag => {
        matrix[tag] = {};
        stammdaten.kategorien.forEach(kat => {
            matrix[tag][kat.id] = [];
        });

        aktuelleEinrichtungen.forEach(e => {
            // GESCHÄFTSLOGIK: Sonderbehandlung für interne Einrichtungen
            // Interne Einrichtungen erhalten ALLE Mahlzeiten-Kategorien
            if (e.isIntern === true) {
                stammdaten.kategorien.forEach(kat => {
                    if (matrix[tag][kat.id]) {
                        matrix[tag][kat.id].push({ 
                            id: e.id, 
                            kuerzel: e.kuerzel, 
                            name: e.name,
                            isIntern: true 
                        });
                    }
                });
                return; // Keine weitere Verarbeitung für interne Einrichtungen
            }

            // Normale Verarbeitung für externe Einrichtungen
            if (!e.speiseplan || !e.speiseplan[tag]) return;
            const tagesplan = e.speiseplan[tag];
            
            if (tagesplan.suppe) matrix[tag].suppe.push({ id: e.id, kuerzel: e.kuerzel, name: e.name });
            if (tagesplan.dessert) matrix[tag].dessert.push({ id: e.id, kuerzel: e.kuerzel, name: e.name });
            
            if (tagesplan.hauptspeise) {
                if (matrix[tag].menu1) matrix[tag].menu1.push({ id: e.id, kuerzel: e.kuerzel, name: e.name });
                if (matrix[tag].menu2) matrix[tag].menu2.push({ id: e.id, kuerzel: e.kuerzel, name: e.name });
            }
        });
    });
    return matrix;
}


/**
 * Event-Handler für Klicks im Grid (delegiert).
 * @param {Event} e - Das Klick-Event.
 */
function handleGridClick(e) {
    // Klick auf "Rezept entfernen" Button
    const removeBtn = e.target.closest('.btn-close');
    if (removeBtn) {
        const card = removeBtn.closest('.rezept-card');
        const dropZone = card.closest('.drop-zone');
        removeRezeptFromPlan(dropZone.dataset.tag, dropZone.dataset.kategorie, card.dataset.rezeptId);
        return; // Verhindert weitere Aktionen
    }

    // Klick auf Einrichtungs-Button
    const einrichtungsBtn = e.target.closest('button[data-einrichtung-id]');
    if (einrichtungsBtn) {
        const { tag, kategorie, einrichtungId } = einrichtungsBtn.dataset;
        toggleEinrichtungsZuweisung(tag, kategorie, einrichtungId);
    }
}


/**
 * Initialisiert das Grid-Modul.
 */
export function initGrid() {
    const gridWrapper = document.getElementById('menueplan-grid-wrapper');
    if (gridWrapper) {
        gridWrapper.addEventListener('click', handleGridClick);
        
        // Window Resize Handler für Layout-Wechsel
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                console.log('Fenster-Größe geändert, re-rendere Layout...');
                render(); // Layout neu rendern
                
                // Drag & Drop neu initialisieren
                import('./menueplan-dragdrop.js').then(dragDrop => {
                    dragDrop.initDragAndDrop();
                });
            }, 250); // 250ms debouncing
        });
    }
}

// Die einzige exportierte Funktion, die von außen aufgerufen wird, um das Grid neu zu zeichnen.
export { render };
