// menueplan-dragdrop.js
// Kapselt die Drag-and-Drop-Funktionalität.
// Dieses Modul ist nur für das Handling der Drag-Events und das Auslösen
// von Zustandsänderungen zuständig. Es manipuliert nicht das DOM.

import {
    getState,
    setCurrentDragData,
    updatePlanWithDraggedRezept,
    updatePlanWithDraggedZone
} from './menueplan-state.js';

// Touch-Support Variablen
let touchDragData = null;
let touchStartElement = null;
let touchDropZoneElement = null;


function handleRezeptDragStart(e) {
    const card = e.target.closest('.rezept-card');
    if (!card) return;

    const sourceCell = card.closest('.grid-cell');
    if (!sourceCell) return;

    const rezeptId = card.dataset.rezeptId;
    const rezeptName = card.querySelector('.rezept-name').textContent; 

    e.dataTransfer.setData('text/plain', rezeptId);
    e.dataTransfer.setData('rezept-name', rezeptName);
    e.dataTransfer.setData('source-tag', sourceCell.dataset.tag);
    e.dataTransfer.setData('source-kategorie', sourceCell.dataset.kategorie);
    e.dataTransfer.effectAllowed = 'move';
    setCurrentDragData({ type: 'rezept', id: rezeptId });
}

function handleSearchDragStart(e, rezept) {
    e.dataTransfer.setData('text/plain', rezept.id);
    e.dataTransfer.setData('rezept-name', rezept.name);
    e.dataTransfer.effectAllowed = 'move';
    setCurrentDragData({ type: 'rezept', id: rezept.id });
}

function handleCellDragStart(e) {
    const handle = e.target.closest('.cell-drag-handle');
    if (!handle) return;
    
    const cell = handle.closest('.grid-cell');
    if (!cell) return;

    const { tag, kategorie } = cell.dataset;
    const { currentPlan } = getState();

    const recipes = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie] || [];
    if (recipes.length === 0) {
        e.preventDefault(); // Verhindert das Ziehen einer leeren Zelle
        return;
    }

    const data = {
        recipes,
        sourceTag: tag,
        sourceKategorie: kategorie,
    };

    e.dataTransfer.setData('application/json/cell-drop', JSON.stringify(data));
    e.dataTransfer.effectAllowed = 'move';
    setCurrentDragData({ type: 'cell', sourceKategorie: kategorie, sourceTag: tag });
}

// Zone-Drag-Funktionalität entfernt (unnötig)


function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Prüfe sowohl Desktop (.grid-cell) als auch Mobile (.mobile-drop-zone) Drop-Zonen
    const cell = e.currentTarget.closest('.grid-cell');
    const mobileDropZone = e.currentTarget.closest('.mobile-drop-zone');
    const dropTarget = cell || mobileDropZone;
    
    if (!dropTarget) return;
    dropTarget.classList.remove('drag-over-active', 'drag-over-invalid');

    const { currentDragData, currentPlan } = getState();
    if (!currentDragData) return;

    const { tag, kategorie } = dropTarget.dataset;

    // Fall 1: Eine ganze Zelle wird gedroppt (einzelne Zelle)
    const cellDataJSON = e.dataTransfer.getData('application/json/cell-drop');
    if (cellDataJSON) {
        const { sourceTag, sourceKategorie } = JSON.parse(cellDataJSON);
        if (tag === sourceTag && kategorie === sourceKategorie) return; // Nicht auf sich selbst droppen

        updatePlanWithDraggedZone(tag, kategorie, sourceTag, sourceKategorie);
        setCurrentDragData(null);
        return;
    }
    
    // Fall 2: Ein einzelnes Rezept wird gedroppt
    if (currentDragData.type === 'rezept') {
        const rezeptId = e.dataTransfer.getData('text/plain');
        if (!rezeptId) return;

        const rezeptName = e.dataTransfer.getData('rezept-name');
        const sourceTag = e.dataTransfer.getData('source-tag');
        const sourceKategorie = e.dataTransfer.getData('source-kategorie');
        
        const rezepteImSlot = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie] || [];
        if (rezepteImSlot.some(r => r.id === rezeptId)) {
            dropTarget.classList.add('drag-over-invalid');
            setTimeout(() => dropTarget.classList.remove('drag-over-invalid'), 500);
            return;
        }

        updatePlanWithDraggedRezept(tag, kategorie, rezeptId, rezeptName, sourceTag, sourceKategorie);
    }
    
    setCurrentDragData(null);
}

function handleDragOver(e) {
    e.preventDefault();
    
    // Prüfe sowohl Desktop als auch Mobile Drop-Zonen
    const cell = e.currentTarget.closest('.grid-cell');
    const mobileDropZone = e.currentTarget.closest('.mobile-drop-zone');
    const dropTarget = cell || mobileDropZone;
    
    if (!dropTarget) return;
    const { currentDragData, currentPlan } = getState();

    if (!currentDragData) return;
    
    const { tag, kategorie } = dropTarget.dataset;

    // Validierung für Zellen-Drop (nur bei Desktop verfügbar)
    if (currentDragData.type === 'cell' && cell) {
        if (tag === currentDragData.sourceTag && kategorie === currentDragData.sourceKategorie) {
            dropTarget.classList.add('drag-over-invalid');
            return;
        }
    }
    
    // Validierung für Rezept-Drop
    if (currentDragData.type === 'rezept') {
        const rezeptId = currentDragData.id;
        const rezepteImSlot = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie] || [];
        if (rezepteImSlot.some(r => r.id === rezeptId)) {
            dropTarget.classList.add('drag-over-invalid');
            return;
        }
    }

    dropTarget.classList.remove('drag-over-invalid');
    dropTarget.classList.add('drag-over-active');
}

function handleDragLeave(e) {
    e.preventDefault();
    
    // Prüfe sowohl Desktop als auch Mobile Drop-Zonen
    const cell = e.currentTarget.closest('.grid-cell');
    const mobileDropZone = e.currentTarget.closest('.mobile-drop-zone');
    const dropTarget = cell || mobileDropZone;
    
    if (!dropTarget) return;
    dropTarget.classList.remove('drag-over-active', 'drag-over-invalid');
}

// === TOUCH-SUPPORT FÜR MOBILE GERÄTE ===

function handleTouchStart(e) {
    // Prüfe ob es ein Zone-Drag-Handle ist
    const zoneDragHandle = e.target.closest('.mobile-zone-drag-handle');
    
    if (zoneDragHandle) {
        // Zone-Drag aus Mobile
        const { tag, kategorie } = zoneDragHandle.dataset;
        const { currentPlan } = getState();
        
        const recipes = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie] || [];
        if (recipes.length === 0) return; // Keine Rezepte zum Verschieben
        
        touchStartElement = zoneDragHandle;
        touchDragData = {
            type: 'zone',
            recipes: recipes,
            sourceTag: tag,
            sourceKategorie: kategorie
        };
        
        // Visuelles Feedback
        zoneDragHandle.classList.add('zone-dragging');
        
        // Zugehörige Category Row hervorheben
        const categoryRow = zoneDragHandle.closest('.mobile-category-row');
        if (categoryRow) {
            categoryRow.style.opacity = '0.7';
            categoryRow.style.transform = 'scale(0.98)';
        }
        
        return;
    }
    
    // Prüfe ob es ein Rezept-Element ist (sowohl Grid als auch Search)
    const rezeptCard = e.target.closest('.rezept-card');
    const rezeptPill = e.target.closest('.rezept-pill');
    
    if (rezeptCard) {
        // Rezept aus Grid
        const sourceCell = rezeptCard.closest('.grid-cell, .mobile-drop-zone');
        if (!sourceCell) return;
        
        touchStartElement = rezeptCard;
        touchDragData = {
            type: 'rezept',
            id: rezeptCard.dataset.rezeptId,
            name: rezeptCard.querySelector('.rezept-name').textContent,
            sourceTag: sourceCell.dataset.tag,
            sourceKategorie: sourceCell.dataset.kategorie
        };
        
        // Visuelles Feedback
        rezeptCard.style.opacity = '0.7';
        rezeptCard.style.transform = 'scale(0.95)';
        
    } else if (rezeptPill) {
        // Rezept aus Suche
        touchStartElement = rezeptPill;
        touchDragData = {
            type: 'rezept',
            id: rezeptPill.dataset.rezeptId,
            name: rezeptPill.dataset.rezeptName,
            sourceTag: null,
            sourceKategorie: null
        };
        
        // Visuelles Feedback
        rezeptPill.style.opacity = '0.7';
        rezeptPill.style.transform = 'scale(0.95)';
    }
    
    if (touchDragData) {
        setCurrentDragData(touchDragData);
        
        // Alle Drop-Zonen hervorheben
        document.querySelectorAll('.grid-cell, .mobile-drop-zone').forEach(zone => {
            zone.classList.add('touch-drop-zone-highlight');
        });
    }
}

function handleTouchMove(e) {
    if (!touchDragData) return;
    
    e.preventDefault(); // Verhindert Scrollen während Drag
    
    const touch = e.touches[0];
    const elementUnderFinger = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Prüfe ob unter dem Finger eine Drop-Zone ist
    const dropZone = elementUnderFinger?.closest('.grid-cell, .mobile-drop-zone');
    
    // Entferne vorherige Highlights
    document.querySelectorAll('.touch-drop-zone-active, .touch-drop-zone-invalid').forEach(zone => {
        zone.classList.remove('touch-drop-zone-active', 'touch-drop-zone-invalid');
    });
    
    if (dropZone && dropZone.dataset.tag && dropZone.dataset.kategorie) {
        const { currentPlan } = getState();
        const { tag, kategorie } = dropZone.dataset;
        
        // Validierung je nach Drag-Typ
        if (touchDragData.type === 'zone') {
            // Zone-Drag: Prüfe ob Ziel-Zone nicht die Quelle ist
            if (tag === touchDragData.sourceTag && kategorie === touchDragData.sourceKategorie) {
                dropZone.classList.add('touch-drop-zone-invalid');
            } else {
                dropZone.classList.add('touch-drop-zone-active');
                touchDropZoneElement = dropZone;
            }
        } else if (touchDragData.type === 'rezept') {
            // Rezept-Drag: Prüfe auf Duplikate
            const rezepteImSlot = currentPlan.days?.[tag]?.Mahlzeiten?.[kategorie] || [];
            const isDuplicate = rezepteImSlot.some(r => r.id === touchDragData.id);
            
            if (isDuplicate) {
                dropZone.classList.add('touch-drop-zone-invalid');
            } else {
                dropZone.classList.add('touch-drop-zone-active');
                touchDropZoneElement = dropZone;
            }
        }
    } else {
        touchDropZoneElement = null;
    }
}

function handleTouchEnd(e) {
    if (!touchDragData) return;
    
    // Visuelles Feedback zurücksetzen
    if (touchStartElement) {
        if (touchDragData.type === 'zone') {
            // Zone-Drag Feedback zurücksetzen
            touchStartElement.classList.remove('zone-dragging');
            const categoryRow = touchStartElement.closest('.mobile-category-row');
            if (categoryRow) {
                categoryRow.style.opacity = '';
                categoryRow.style.transform = '';
            }
        } else {
            // Rezept-Drag Feedback zurücksetzen
            touchStartElement.style.opacity = '';
            touchStartElement.style.transform = '';
        }
    }
    
    // Drop-Zone Highlights entfernen
    document.querySelectorAll('.touch-drop-zone-highlight, .touch-drop-zone-active, .touch-drop-zone-invalid').forEach(zone => {
        zone.classList.remove('touch-drop-zone-highlight', 'touch-drop-zone-active', 'touch-drop-zone-invalid');
    });
    
    // Prüfe ob ein gültiger Drop stattgefunden hat
    if (touchDropZoneElement) {
        const { tag, kategorie } = touchDropZoneElement.dataset;
        
        if (touchDragData.type === 'zone') {
            // Zone-Drag: Alle Rezepte verschieben
            const { sourceTag, sourceKategorie, recipes } = touchDragData;
            updatePlanWithDraggedZone(tag, kategorie, sourceTag, sourceKategorie);
            
            // Toast-Feedback (Daten vor Cleanup speichern)
            import('@shared/components/toast-notification/toast-notification.js').then(({ showToast }) => {
                const anzahlRezepte = recipes.length;
                showToast(`${anzahlRezepte} Rezept${anzahlRezepte > 1 ? 'e' : ''} verschoben`, 'success');
            });
        } else if (touchDragData.type === 'rezept') {
            // Rezept-Drag: Einzelnes Rezept verschieben
            const { id, name, sourceTag, sourceKategorie } = touchDragData;
            updatePlanWithDraggedRezept(tag, kategorie, id, name, sourceTag, sourceKategorie);
            
            // Toast-Feedback
            import('@shared/components/toast-notification/toast-notification.js').then(({ showToast }) => {
                showToast(`Rezept "${name}" hinzugefügt`, 'success');
            });
        }
    }
    
    // Cleanup
    touchDragData = null;
    touchStartElement = null;
    touchDropZoneElement = null;
    setCurrentDragData(null);
}

export function initDragAndDrop() {
    // Desktop Grid Container
    const gridContainer = document.querySelector('.menueplan-grid');
    if (gridContainer) {
        // Delegierter Listener für alle Drag-Starts im Grid
        gridContainer.addEventListener('dragstart', (e) => {
            if (e.target.closest('.rezept-drag-handle')) {
                handleRezeptDragStart(e);
            } else if (e.target.closest('.cell-drag-handle')) {
                handleCellDragStart(e);
            }
        });

        // Event-Listener für alle Drop-Zellen im Grid
        const dropCells = gridContainer.querySelectorAll('.grid-cell');
        dropCells.forEach(cell => {
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('dragleave', handleDragLeave);
            cell.addEventListener('drop', handleDrop);
        });
    }

    // Mobile Accordion Container
    const mobileContainer = document.querySelector('.mobile-accordion');
    if (mobileContainer) {
        // Delegierter Listener für Mobile Drag-Starts
        mobileContainer.addEventListener('dragstart', (e) => {
            if (e.target.closest('.rezept-drag-handle')) {
                handleRezeptDragStart(e);
            }
        });

        // Event-Listener für Mobile Drop-Zonen
        const mobileDropZones = mobileContainer.querySelectorAll('.mobile-drop-zone');
        mobileDropZones.forEach(zone => {
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);
        });

        // Touch-Events für Mobile (bessere Touch-Unterstützung)
        mobileContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        mobileContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        mobileContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Touch-Events auch für Desktop-Grid (falls nötig)
    if (gridContainer) {
        gridContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        gridContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        gridContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    // Drag-Listener für die Suchergebnisse (Pills)
    // Da die Suchergebnisse dynamisch sind, muss der Listener am Container sein.
    const searchResultsContainer = document.getElementById('menueplan-suche-ergebnisse');
    if(searchResultsContainer) {
        searchResultsContainer.addEventListener('dragstart', e => {
            const rezeptPill = e.target.closest('.rezept-pill');
            if(rezeptPill) {
                const rezept = {
                    id: rezeptPill.dataset.rezeptId,
                    name: rezeptPill.dataset.rezeptName
                };
                handleSearchDragStart(e, rezept);
            }
        });

        // Touch-Events für Suchergebnisse
        searchResultsContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
        searchResultsContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
        searchResultsContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    }
} 