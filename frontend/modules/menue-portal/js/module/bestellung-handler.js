// bestellung-handler.js - Bestellfunktionalität für externe Einrichtungen
// Verwendet JSON-API statt LocalStorage für Datenpersistierung

import { loadBestellungenForEinrichtung, saveBestellungen } from './bestellungen-api.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';

/**
 * Globaler Bestellungs-Zustand (Cache für UI-Performance)
 */
let bestellungenCache = {};
let currentWeek = null;
let currentYear = null;
let saveTimeout = null; // Debouncing für API-Aufrufe

/**
 * Behandelt Änderungen an Bestellfeldern
 * @param {HTMLInputElement} input - Das geänderte Input-Element
 */
export async function handleBestellungChange(input) {
    const day = input.dataset.day;
    const kategorie = input.dataset.kategorie;
    const gruppe = input.dataset.gruppe;
    const anzahl = parseInt(input.value) || 0;
    
    // Aktuelle Woche berechnen
    currentWeek = getCurrentWeek();
    currentYear = getCurrentYear();
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    
    // Bestellung in Cache speichern
    if (!bestellungenCache[wochenschluessel]) {
        bestellungenCache[wochenschluessel] = {};
    }
    if (!bestellungenCache[wochenschluessel][day]) {
        bestellungenCache[wochenschluessel][day] = {};
    }
    if (!bestellungenCache[wochenschluessel][day][kategorie]) {
        bestellungenCache[wochenschluessel][day][kategorie] = {};
    }
    
    bestellungenCache[wochenschluessel][day][kategorie][gruppe] = anzahl;
    
    // Automatische Berechnung für Suppen und Desserts
    berechneAutomatischeBestellungen(day, kategorie, gruppe, anzahl, wochenschluessel);
    
    // UI aktualisieren
    updateBestellungUI(day, kategorie, gruppe, anzahl);
    
    // Debounced API-Speicherung
    debouncedSaveToAPI(wochenschluessel);
    
    console.log('Bestellung aktualisiert:', { day, kategorie, gruppe, anzahl, wochenschluessel });
}

/**
 * Debounced Speicherung in die API (verhindert zu viele API-Aufrufe)
 * @param {string} wochenschluessel - Wochenschlüssel
 */
function debouncedSaveToAPI(wochenschluessel) {
    // Vorherigen Timeout löschen
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }
    
    // Neuen Timeout setzen
    saveTimeout = setTimeout(async () => {
        await saveBestellungenToAPI(wochenschluessel);
    }, 1000); // 1 Sekunde Debouncing
}

/**
 * Speichert Bestellungen über die API
 * @param {string} wochenschluessel - Wochenschlüssel
 */
async function saveBestellungenToAPI(wochenschluessel) {
    try {
        const currentEinrichtung = window.currentEinrichtung;
        if (!currentEinrichtung) {
            console.error('Keine Einrichtung ausgewählt');
            return;
        }

        const bestellungsData = bestellungenCache[wochenschluessel] || {};
        
        const result = await saveBestellungen(
            currentYear,
            currentWeek,
            currentEinrichtung.id,
            bestellungsData,
            {
                name: currentEinrichtung.name,
                typ: currentEinrichtung.typ || 'extern',
                gruppen: currentEinrichtung.gruppen || []
            }
        );

        if (result.success) {
            console.log('✅ Bestellungen erfolgreich in JSON gespeichert');
        } else {
            console.error('❌ Fehler beim Speichern in JSON:', result.message);
            showToast(`Fehler beim Speichern: ${result.message}`, 'error');
        }

    } catch (error) {
        console.error('❌ Fehler beim Speichern der Bestellungen:', error);
        showToast('Fehler beim Speichern der Bestellungen', 'error');
    }
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
        if (!bestellungenCache[wochenschluessel][day]['suppe']) {
            bestellungenCache[wochenschluessel][day]['suppe'] = {};
        }
        bestellungenCache[wochenschluessel][day]['suppe'][gruppe] = anzahl;
        
        // UI-Feld aktualisieren falls vorhanden
        const suppenInput = document.querySelector(`input[data-day="${day}"][data-kategorie="suppe"][data-gruppe="${gruppe}"]`);
        if (suppenInput) {
            suppenInput.value = anzahl;
            suppenInput.style.backgroundColor = '#e3f2fd'; // Leicht blau für automatisch berechnet
        }
    }
    
    // Automatische Dessert-Bestellung
    if (speiseplanTag.dessert) {
        if (!bestellungenCache[wochenschluessel][day]['dessert']) {
            bestellungenCache[wochenschluessel][day]['dessert'] = {};
        }
        bestellungenCache[wochenschluessel][day]['dessert'][gruppe] = anzahl;
        
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
    const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
    
    if (!bestellungenCache[wochenschluessel] || !bestellungenCache[wochenschluessel][day]) {
        return;
    }
    
    const dayData = bestellungenCache[wochenschluessel][day];
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
 * Lädt gespeicherte Bestellungen aus der JSON-API
 */
export async function loadBestellungenFromAPI() {
    try {
        const currentEinrichtung = window.currentEinrichtung;
        if (!currentEinrichtung) {
            console.warn('Keine Einrichtung ausgewählt - kann Bestellungen nicht laden');
            return;
        }

        currentWeek = getCurrentWeek();
        currentYear = getCurrentYear();
        
        console.log(`📋 Lade Bestellungen für ${currentEinrichtung.name} aus JSON-API...`);
        
        const result = await loadBestellungenForEinrichtung(currentYear, currentWeek, currentEinrichtung.id);
        
        if (result.success) {
            const wochenschluessel = `${currentYear}-${currentWeek.toString().padStart(2, '0')}`;
            bestellungenCache[wochenschluessel] = result.bestellungen;
            
            console.log('✅ Bestellungen aus JSON-API geladen:', result.bestellungen);
            
            // UI aktualisieren falls bereits geladen
            setTimeout(() => {
                loadBestellungenIntoUI(wochenschluessel);
            }, 500);
            
        } else {
            console.warn('⚠️ Keine Bestellungen gefunden:', result.message);
            bestellungenCache = {};
        }

    } catch (error) {
        console.error('❌ Fehler beim Laden der Bestellungen aus JSON-API:', error);
        bestellungenCache = {};
    }
}

/**
 * Legacy-Funktion: Lädt aus LocalStorage (für Rückwärtskompatibilität)
 * @deprecated Verwende loadBestellungenFromAPI() stattdessen
 */
export function loadBestellungenFromStorage() {
    console.warn('⚠️ loadBestellungenFromStorage() ist deprecated - verwende loadBestellungenFromAPI()');
    // Migration: Falls LocalStorage-Daten vorhanden, diese zur API migrieren
    migrateLocalStorageToAPI();
}

/**
 * Migriert bestehende LocalStorage-Daten zur JSON-API
 */
async function migrateLocalStorageToAPI() {
    try {
        const stored = localStorage.getItem('menue-portal-bestellungen');
        if (stored) {
            const localStorageData = JSON.parse(stored);
            console.log('🔄 Migriere LocalStorage-Daten zur JSON-API...', localStorageData);
            
            // Daten in Cache übernehmen
            bestellungenCache = localStorageData;
            
            // Daten zur API hochladen
            const currentEinrichtung = window.currentEinrichtung;
            if (currentEinrichtung) {
                for (const [wochenschluessel, wochenData] of Object.entries(localStorageData)) {
                    const [year, week] = wochenschluessel.split('-');
                    await saveBestellungen(
                        parseInt(year),
                        parseInt(week),
                        currentEinrichtung.id,
                        wochenData,
                        {
                            name: currentEinrichtung.name,
                            typ: currentEinrichtung.typ || 'extern',
                            gruppen: currentEinrichtung.gruppen || []
                        }
                    );
                }
                
                // LocalStorage nach erfolgreicher Migration löschen
                localStorage.removeItem('menue-portal-bestellungen');
                console.log('✅ Migration abgeschlossen - LocalStorage-Daten gelöscht');
                showToast('Bestellungen erfolgreich zur JSON-API migriert', 'success');
            }
        }
    } catch (error) {
        console.error('❌ Fehler bei der Migration:', error);
        showToast('Fehler bei der Datenmigration', 'error');
    }
}

/**
 * Lädt Bestellungen in die UI
 * @param {string} wochenschluessel - Wochenschlüssel
 */
export function loadBestellungenIntoUI(wochenschluessel) {
    if (!bestellungenCache[wochenschluessel]) {
        console.log('Keine Bestellungen für', wochenschluessel);
        return;
    }
    
    const wochenData = bestellungenCache[wochenschluessel];
    
    // Alle Bestellungsfelder füllen
    Object.entries(wochenData).forEach(([day, dayData]) => {
        Object.entries(dayData).forEach(([kategorie, kategorieData]) => {
            Object.entries(kategorieData).forEach(([gruppe, anzahl]) => {
                const input = document.querySelector(`input[data-day="${day}"][data-kategorie="${kategorie}"][data-gruppe="${gruppe}"]`);
                if (input) {
                    input.value = anzahl;
                    
                    // Visuelle Kennzeichnung für automatisch berechnete Werte
                    if (['suppe', 'dessert'].includes(kategorie)) {
                        input.style.backgroundColor = kategorie === 'suppe' ? '#e3f2fd' : '#e8f5e8';
                    }
                }
            });
        });
        
        // Tagesinformation aktualisieren
        updateDayOrderSummary(day);
    });
    
    console.log('UI mit Bestellungen gefüllt für', wochenschluessel);
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
    
    const wochenData = bestellungenCache[wochenschluessel] || {};
    
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
export async function clearBestellungen(wochenschluessel) {
    try {
        // Cache leeren
        if (bestellungenCache[wochenschluessel]) {
            delete bestellungenCache[wochenschluessel];
        }
        
        // API-Speicherung mit leeren Daten
        await saveBestellungenToAPI(wochenschluessel);
        
        // UI-Felder leeren
        document.querySelectorAll('.bestellung-input').forEach(input => {
            input.value = '';
            input.style.backgroundColor = '';
        });
        
        // Tagesanzeigen aktualisieren
        ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'].forEach(day => {
            updateDayOrderSummary(day);
        });
        
        console.log('Bestellungen gelöscht für', wochenschluessel);
        showToast('Alle Bestellungen gelöscht', 'success');
        
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Bestellungen:', error);
        showToast('Fehler beim Löschen der Bestellungen', 'error');
    }
}

/**
 * Hilfsfunktionen
 */
function getCurrentWeek() {
    return window.currentWeek || getWeekNumber(new Date());
}

function getCurrentYear() {
    return window.currentYear || new Date().getFullYear();
}

/**
 * Gibt den aktuellen Bestellungs-Zustand zurück
 * @returns {object} Aktueller Bestellungs-Zustand
 */
export function getBestellungen() {
    return bestellungenCache;
}

/**
 * Validiert Bestellungen vor dem Versenden
 * @param {string} wochenschluessel - Wochenschlüssel
 * @returns {object} Validierungs-Ergebnis
 */
export function validateBestellungen(wochenschluessel) {
    const wochenData = bestellungenCache[wochenschluessel] || {};
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

/**
 * Hilfsfunktion: Wochennummer berechnen
 */
function getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Global verfügbar machen
window.handleBestellungChange = handleBestellungChange; 