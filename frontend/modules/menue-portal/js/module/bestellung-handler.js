// bestellung-handler.js - Bestellfunktionalität für externe Einrichtungen
// Verwaltet Bestellungen, automatische Berechnungen und Validierung

/**
 * Globaler Bestellungs-Zustand
 */
let bestellungen = {
    // Format: { "2025-01-13": { "montag": { "menu1": { "Gruppe A": 5 } } } }
};

/**
 * Behandelt Änderungen an Bestellfeldern
 * @param {HTMLInputElement} input - Das geänderte Input-Element
 */
export function handleBestellungChange(input) {
    const day = input.dataset.day;
    const kategorie = input.dataset.kategorie;
    const gruppe = input.dataset.gruppe;
    const anzahl = parseInt(input.value) || 0;
    
    // Aktuelle Woche berechnen
    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    
    // Bestellung speichern
    if (!bestellungen[wochenschluessel]) {
        bestellungen[wochenschluessel] = {};
    }
    if (!bestellungen[wochenschluessel][day]) {
        bestellungen[wochenschluessel][day] = {};
    }
    if (!bestellungen[wochenschluessel][day][kategorie]) {
        bestellungen[wochenschluessel][day][kategorie] = {};
    }
    
    bestellungen[wochenschluessel][day][kategorie][gruppe] = anzahl;
    
    // Automatische Berechnung für Suppen und Desserts
    berechneAutomatischeBestellungen(day, kategorie, gruppe, anzahl, wochenschluessel);
    
    // UI aktualisieren
    updateBestellungUI(day, kategorie, gruppe, anzahl);
    
    // In localStorage speichern
    saveBestellungenToStorage();
    
    console.log('Bestellung aktualisiert:', { day, kategorie, gruppe, anzahl, wochenschluessel });
}

/**
 * Berechnet automatisch Suppen und Desserts basierend auf Hauptspeisen-Bestellungen
 * @param {string} day - Wochentag
 * @param {string} kategorie - Kategorie der Bestellung
 * @param {string} gruppe - Gruppenname
 * @param {number} anzahl - Bestellte Anzahl
 * @param {string} wochenschluessel - Wochenschlüssel
 */
function berechneAutomatischeBestellungen(day, kategorie, gruppe, anzahl, wochenschluessel) {
    // Nur bei Hauptspeisen automatische Berechnung
    if (!['menu1', 'menu2', 'menu'].includes(kategorie)) {
        return;
    }
    
    const currentEinrichtung = window.currentEinrichtung;
    if (!currentEinrichtung || !currentEinrichtung.speiseplan || !currentEinrichtung.speiseplan[day]) {
        return;
    }
    
    const speiseplanTag = currentEinrichtung.speiseplan[day];
    
    // Automatische Suppen-Bestellung
    if (speiseplanTag.suppe) {
        if (!bestellungen[wochenschluessel][day]['suppe']) {
            bestellungen[wochenschluessel][day]['suppe'] = {};
        }
        bestellungen[wochenschluessel][day]['suppe'][gruppe] = anzahl;
        
        // UI-Feld aktualisieren falls vorhanden
        const suppenInput = document.querySelector(`input[data-day="${day}"][data-kategorie="suppe"][data-gruppe="${gruppe}"]`);
        if (suppenInput) {
            suppenInput.value = anzahl;
            suppenInput.style.backgroundColor = '#e3f2fd'; // Leicht blau für automatisch berechnet
        }
    }
    
    // Automatische Dessert-Bestellung
    if (speiseplanTag.dessert) {
        if (!bestellungen[wochenschluessel][day]['dessert']) {
            bestellungen[wochenschluessel][day]['dessert'] = {};
        }
        bestellungen[wochenschluessel][day]['dessert'][gruppe] = anzahl;
        
        // UI-Feld aktualisieren falls vorhanden
        const dessertInput = document.querySelector(`input[data-day="${day}"][data-kategorie="dessert"][data-gruppe="${gruppe}"]`);
        if (dessertInput) {
            dessertInput.value = anzahl;
            dessertInput.style.backgroundColor = '#e8f5e8'; // Leicht grün für automatisch berechnet
        }
    }
}

/**
 * Aktualisiert die Bestellungs-UI
 * @param {string} day - Wochentag
 * @param {string} kategorie - Kategorie
 * @param {string} gruppe - Gruppenname
 * @param {number} anzahl - Anzahl
 */
function updateBestellungUI(day, kategorie, gruppe, anzahl) {
    // Toast-Benachrichtigung anzeigen
    if (window.showToast) {
        const kategorieNames = {
            'menu1': 'Menü 1',
            'menu2': 'Menü 2', 
            'menu': 'Hauptmenü',
            'suppe': 'Suppe',
            'dessert': 'Dessert'
        };
        
        const message = anzahl > 0 
            ? `${kategorieNames[kategorie]} für ${gruppe}: ${anzahl} bestellt`
            : `Bestellung für ${kategorieNames[kategorie]} (${gruppe}) entfernt`;
            
        window.showToast(message, 'success');
    }
    
    // Tagesinformation aktualisieren
    updateDayOrderSummary(day);
}

/**
 * Aktualisiert die Bestellungs-Zusammenfassung für einen Tag
 * @param {string} day - Wochentag
 */
function updateDayOrderSummary(day) {
    const currentWeek = getCurrentWeek();
    const currentYear = getCurrentYear();
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    
    if (!bestellungen[wochenschluessel] || !bestellungen[wochenschluessel][day]) {
        return;
    }
    
    const dayData = bestellungen[wochenschluessel][day];
    let totalBestellungen = 0;
    
    // Gesamtanzahl berechnen
    Object.values(dayData).forEach(kategorieData => {
        Object.values(kategorieData).forEach(anzahl => {
            totalBestellungen += anzahl;
        });
    });
    
    // Badge in Accordion-Header aktualisieren (falls mobile)
    const accordionHeader = document.querySelector(`#heading-${day} .recipe-count`);
    if (accordionHeader && totalBestellungen > 0) {
        accordionHeader.textContent = `${accordionHeader.textContent.split('•')[0].trim()} • ${totalBestellungen} bestellt`;
    }
    
    // Badge in Desktop-Karte aktualisieren
    const desktopCard = document.querySelector(`[data-day="${day}"] .day-header`);
    if (desktopCard && totalBestellungen > 0) {
        let orderBadge = desktopCard.querySelector('.order-badge');
        if (!orderBadge) {
            orderBadge = document.createElement('small');
            orderBadge.className = 'order-badge badge bg-success';
            desktopCard.appendChild(orderBadge);
        }
        orderBadge.textContent = `${totalBestellungen} bestellt`;
    }
}

/**
 * Lädt gespeicherte Bestellungen aus localStorage
 */
export function loadBestellungenFromStorage() {
    try {
        const stored = localStorage.getItem('menue-portal-bestellungen');
        if (stored) {
            bestellungen = JSON.parse(stored);
            console.log('Bestellungen aus localStorage geladen:', bestellungen);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Bestellungen:', error);
        bestellungen = {};
    }
}

/**
 * Speichert Bestellungen in localStorage
 */
function saveBestellungenToStorage() {
    try {
        localStorage.setItem('menue-portal-bestellungen', JSON.stringify(bestellungen));
        console.log('Bestellungen in localStorage gespeichert');
    } catch (error) {
        console.error('Fehler beim Speichern der Bestellungen:', error);
    }
}

/**
 * Lädt gespeicherte Bestellungen in die UI
 * @param {string} wochenschluessel - Wochenschlüssel
 */
export function loadBestellungenIntoUI(wochenschluessel) {
    if (!bestellungen[wochenschluessel]) {
        return;
    }
    
    const wochenData = bestellungen[wochenschluessel];
    
    Object.entries(wochenData).forEach(([day, dayData]) => {
        Object.entries(dayData).forEach(([kategorie, kategorieData]) => {
            Object.entries(kategorieData).forEach(([gruppe, anzahl]) => {
                const input = document.querySelector(`input[data-day="${day}"][data-kategorie="${kategorie}"][data-gruppe="${gruppe}"]`);
                if (input) {
                    input.value = anzahl;
                    
                    // Automatisch berechnete Felder markieren
                    if (['suppe', 'dessert'].includes(kategorie)) {
                        input.style.backgroundColor = kategorie === 'suppe' ? '#e3f2fd' : '#e8f5e8';
                        input.readOnly = true;
                        input.title = 'Automatisch berechnet basierend auf Hauptspeise';
                    }
                }
            });
        });
        
        // Tages-Zusammenfassung aktualisieren
        updateDayOrderSummary(day);
    });
}

/**
 * Exportiert alle Bestellungen für eine Woche
 * @param {string} wochenschluessel - Wochenschlüssel
 * @returns {object} Bestellungs-Export
 */
export function exportBestellungen(wochenschluessel) {
    const currentEinrichtung = window.currentEinrichtung;
    if (!currentEinrichtung) {
        console.error('Keine Einrichtung ausgewählt');
        return null;
    }
    
    const wochenData = bestellungen[wochenschluessel] || {};
    
    return {
        einrichtung: {
            id: currentEinrichtung.id,
            name: currentEinrichtung.name,
            typ: currentEinrichtung.typ
        },
        woche: wochenschluessel,
        exportDatum: new Date().toISOString(),
        bestellungen: wochenData,
        gruppen: currentEinrichtung.gruppen || [],
        speiseplan: currentEinrichtung.speiseplan || {}
    };
}

/**
 * Löscht alle Bestellungen für eine Woche
 * @param {string} wochenschluessel - Wochenschlüssel
 */
export function clearBestellungen(wochenschluessel) {
    if (bestellungen[wochenschluessel]) {
        delete bestellungen[wochenschluessel];
        saveBestellungenToStorage();
        
        // UI zurücksetzen
        document.querySelectorAll('.bestellung-input, .bestellung-input-desktop').forEach(input => {
            input.value = '';
            input.style.backgroundColor = '';
            input.readOnly = false;
        });
        
        if (window.showToast) {
            window.showToast('Alle Bestellungen für diese Woche gelöscht', 'info');
        }
    }
}

/**
 * Hilfsfunktionen für Woche/Jahr
 */
function getCurrentWeek() {
    return window.currentWeek || new Date().getWeek();
}

function getCurrentYear() {
    return window.currentYear || new Date().getFullYear();
}

/**
 * Gibt den aktuellen Bestellungs-Zustand zurück
 * @returns {object} Aktueller Bestellungs-Zustand
 */
export function getBestellungen() {
    return bestellungen;
}

/**
 * Validiert Bestellungen vor dem Versenden
 * @param {string} wochenschluessel - Wochenschlüssel
 * @returns {object} Validierungs-Ergebnis
 */
export function validateBestellungen(wochenschluessel) {
    const wochenData = bestellungen[wochenschluessel] || {};
    const errors = [];
    const warnings = [];
    
    const currentEinrichtung = window.currentEinrichtung;
    if (!currentEinrichtung) {
        errors.push('Keine Einrichtung ausgewählt');
        return { valid: false, errors, warnings };
    }
    
    // Prüfe jede Gruppe gegen maximale Anzahl
    Object.entries(wochenData).forEach(([day, dayData]) => {
        Object.entries(dayData).forEach(([kategorie, kategorieData]) => {
            Object.entries(kategorieData).forEach(([gruppe, anzahl]) => {
                const gruppeConfig = currentEinrichtung.gruppen?.find(g => g.name === gruppe);
                if (gruppeConfig && anzahl > gruppeConfig.anzahl) {
                    errors.push(`${day} ${kategorie} ${gruppe}: ${anzahl} > max ${gruppeConfig.anzahl}`);
                }
            });
        });
    });
    
    // Warnungen für leere Bestellungen
    if (Object.keys(wochenData).length === 0) {
        warnings.push('Keine Bestellungen erfasst');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

// Global verfügbar machen
window.handleBestellungChange = handleBestellungChange; 