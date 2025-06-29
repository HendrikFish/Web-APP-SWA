/**
 * API-Funktionen für Bestelldaten-Verwaltung
 * Lädt und verarbeitet Daten aus shared/data/portal/bestellungen
 */

import { apiClient } from '@shared/utils/api-client.js';

const API_BASE = '/api';

/**
 * Lädt verfügbare Kalenderwochen
 * @returns {Promise<Array>} Array von Wochen-Objekten
 */
export async function getVerfügbareWochen() {
    try {
        const bekannteWochen = {
            '2025': [25, 26, 27],
            '2026': []
        };
        
        const wochen = [];
        
        // Durchlaufe alle bekannten Jahre und Wochen
        for (const [year, weeks] of Object.entries(bekannteWochen)) {
            for (const week of weeks) {
                wochen.push({
                    year: parseInt(year),
                    week: week,
                    label: `KW ${week}/${year}`,
                    value: `${year}-${week}`
                });
            }
        }
        
        // Sortiere nach Jahr und Woche (neueste zuerst)
        return wochen.sort((a, b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.week - a.week;
        });
        
    } catch (error) {
        console.error('Fehler beim Laden der verfügbaren Wochen:', error);
        return [];
    }
}

/**
 * Lädt Bestelldaten für eine bestimmte Kalenderwoche
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Promise<Object>} Bestelldaten
 */
export async function getBestelldaten(year, week) {
    try {
        const response = await fetch(`/shared/data/portal/bestellungen/${year}/${week}.json`);
        
        if (!response.ok) {
            throw new Error(`Bestelldaten für KW ${week}/${year} nicht verfügbar`);
        }
        
        const data = await response.json();
        
        // Lade auch Informationen für die Woche
        const informationen = await getInformationenFürWoche(year, week);
        
        // Verarbeite und bereite Daten für die Anzeige vor
        return verarbeiteBestelldaten(data, informationen);
        
    } catch (error) {
        console.error(`Fehler beim Laden der Bestelldaten für KW ${week}/${year}:`, error);
        throw error;
    }
}

/**
 * Verarbeitet Roh-Bestelldaten für die Anzeige
 * @param {Object} rawData - Rohe Bestelldaten
 * @param {Object} informationen - Informationen-Daten
 * @returns {Object} Verarbeitete Daten
 */
function verarbeiteBestelldaten(rawData, informationen = {}) {
    const { einrichtungen, year, week, metadaten } = rawData;
    
    const verarbeitet = {
        year,
        week,
        metadaten,
        einrichtungen: [],
        tage: ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'],
        wochenstatistik: rawData.wochenstatistik || {},
        informationen // Füge Informationen zu den verarbeiteten Daten hinzu
    };
    
    // Verarbeite jede Einrichtung
    Object.entries(einrichtungen).forEach(([id, einrichtungData]) => {
        const { info, tage, wochenstatistik } = einrichtungData;
        
        const einrichtung = {
            id,
            name: info.name,
            typ: info.typ,
            gruppen: info.gruppen || [],
            letzte_aktualisierung: info.letzte_aktualisierung,
            read: info.read || false, // Lesebestätigung-Status für Bestelldaten
            tage_daten: {},
            wochenstatistik: wochenstatistik || {},
            gesamt_bestellungen: 0,
            // Informations-Status hinzufügen
            hatUngeleseneInfos: hatUngeleseneInformationen(informationen, id),
            anzahlUngeleseneInfos: getAnzahlUngeleseneInformationen(informationen, id),
            informationen: getInformationenFürEinrichtung(informationen, id)
        };
        
        // Verarbeite Tage-Daten
        let gesamtBestellungen = 0;
        verarbeitet.tage.forEach(tag => {
            const tagDaten = tage[tag] || {};
            const hauptspeise = tagDaten.hauptspeise || {};
            
            // Summiere alle Gruppen für diesen Tag
            const tagSumme = Object.values(hauptspeise).reduce((sum, anzahl) => sum + anzahl, 0);
            gesamtBestellungen += tagSumme;
            
            einrichtung.tage_daten[tag] = {
                hauptspeise,
                summe: tagSumme,
                gruppen_details: Object.entries(hauptspeise).map(([gruppe, anzahl]) => ({
                    gruppe,
                    anzahl
                }))
            };
        });
        
        einrichtung.gesamt_bestellungen = gesamtBestellungen;
        verarbeitet.einrichtungen.push(einrichtung);
    });
    
    // Sortiere Einrichtungen nach Gesamtbestellungen (höchste zuerst)
    verarbeitet.einrichtungen.sort((a, b) => b.gesamt_bestellungen - a.gesamt_bestellungen);
    
    return verarbeitet;
}

/**
 * Markiert eine Einrichtung als gelesen
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {Promise<boolean>} Erfolg
 */
export async function markiereAlsGelesen(year, week, einrichtungId) {
    try {
        // Lade aktuelle Daten
        const response = await fetch(`/shared/data/portal/bestellungen/${year}/${week}.json`);
        if (!response.ok) {
            throw new Error('Bestelldaten nicht gefunden');
        }
        
        const data = await response.json();
        
        // Markiere als gelesen
        if (data.einrichtungen[einrichtungId]) {
            data.einrichtungen[einrichtungId].info.read = true;
            data.einrichtungen[einrichtungId].info.gelesen_am = new Date().toISOString();
            data.letzte_änderung = new Date().toISOString();
            
            // Speichere Änderungen
            const saveResponse = await fetch(`/shared/data/portal/bestellungen/${year}/${week}.json`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (!saveResponse.ok) {
                throw new Error('Fehler beim Speichern der Lesebestätigung');
            }
            
            return true;
        }
        
        return false;
        
    } catch (error) {
        console.error('Fehler beim Markieren als gelesen:', error);
        throw error;
    }
}

/**
 * Berechnet Zahlen-Klassifizierung (niedrig/mittel/hoch)
 * @param {number} anzahl - Anzahl Bestellungen
 * @returns {string} Klassifizierung
 */
export function klassifiziereAnzahl(anzahl) {
    if (anzahl === 0) return 'null';
    if (anzahl <= 5) return 'niedrig';
    if (anzahl <= 15) return 'mittel';
    return 'hoch';
}

/**
 * Formatiert Datum für Anzeige
 * @param {string} isoString - ISO-Datum
 * @returns {string} Formatiertes Datum
 */
export function formatiereZeitpunkt(isoString) {
    if (!isoString) return 'Unbekannt';
    
    try {
        const date = new Date(isoString);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Ungültiges Datum';
    }
}

/**
 * Exportiert Bestelldaten als CSV
 * @param {Object} bestelldaten - Verarbeitete Bestelldaten
 * @returns {string} CSV-Inhalt
 */
export function exportiereAlsCSV(bestelldaten) {
    const { einrichtungen, tage, year, week } = bestelldaten;
    
    let csv = 'Einrichtung;Typ;Montag;Dienstag;Mittwoch;Donnerstag;Freitag;Samstag;Sonntag;Gesamt\n';
    
    einrichtungen.forEach(einrichtung => {
        const zeile = [
            einrichtung.name,
            einrichtung.typ,
            ...tage.map(tag => einrichtung.tage_daten[tag]?.summe || 0),
            einrichtung.gesamt_bestellungen
        ];
        csv += zeile.join(';') + '\n';
    });
    
    return csv;
}

/**
 * Lädt aktuellste verfügbare Woche
 * @returns {Promise<Object|null>} Aktuellste Woche oder null
 */
export async function getAktuellsteWoche() {
    try {
        const wochen = await getVerfügbareWochen();
        return wochen.length > 0 ? wochen[0] : null;
    } catch (error) {
        console.error('Fehler beim Ermitteln der aktuellsten Woche:', error);
        return null;
    }
}

/**
 * Berechnet die aktuelle Kalenderwoche (ISO 8601-konform)
 * @returns {Object} Jahr und Woche
 */
export function getAktuelleKalenderwoche() {
    const heute = new Date();
    return getISOWeek(heute);
}

/**
 * Berechnet die ISO 8601-konforme Kalenderwoche für ein Datum
 * @param {Date} date - Das Datum
 * @returns {object} Objekt mit { year, week } für korrektes Jahr/Woche-Mapping
 */
function getISOWeek(date) {
    const d = new Date(date.getTime());
    d.setHours(0, 0, 0, 0);
    
    // Donnerstag der gleichen Woche finden (ISO 8601: Woche gehört zum Jahr des Donnerstags)
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    
    // 1. Januar im Jahr des Donnerstags
    const week1 = new Date(d.getFullYear(), 0, 1);
    
    // Berechne die Wochennummer
    const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    
    return {
        year: d.getFullYear(),
        week: weekNumber
    };
}

/**
 * Berechnet die Anzahl der Wochen in einem Jahr (ISO 8601)
 * @param {number} year - Jahr
 * @returns {number} Anzahl der Wochen
 */
function getWeeksInYear(year) {
    const dec28 = new Date(year, 11, 28);
    const isoWeek = getISOWeek(dec28);
    return isoWeek.year === year ? isoWeek.week : 52;
}

/**
 * Navigiert zu vorheriger Woche (ISO 8601-konform)
 * @param {number} currentYear - Aktuelles Jahr
 * @param {number} currentWeek - Aktuelle Woche
 * @returns {Object} Vorherige Woche
 */
export function getPreviousWeek(currentYear, currentWeek) {
    let newWeek = currentWeek - 1;
    let newYear = currentYear;
    
    if (newWeek < 1) {
        newYear = currentYear - 1;
        newWeek = getWeeksInYear(newYear);
    }
    
    return { year: newYear, week: newWeek };
}

/**
 * Navigiert zu nächster Woche (ISO 8601-konform)
 * @param {number} currentYear - Aktuelles Jahr
 * @param {number} currentWeek - Aktuelle Woche
 * @returns {Object} Nächste Woche
 */
export function getNextWeek(currentYear, currentWeek) {
    let newWeek = currentWeek + 1;
    let newYear = currentYear;
    
    const maxWeeks = getWeeksInYear(currentYear);
    
    if (newWeek > maxWeeks) {
        newWeek = 1;
        newYear = currentYear + 1;
    }
    
    return { year: newYear, week: newWeek };
}

/**
 * Formatiert Woche für Anzeige
 * @param {number} year - Jahr
 * @param {number} week - Woche
 * @returns {string} Formatierte Woche
 */
export function formatWeekDisplay(year, week) {
    // Berechne Datum des Montags
    const mondayOfWeek = getMondayOfWeek(year, week);
    const mondayFormatted = mondayOfWeek.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit'
    });
    
    // Berechne Datum des Sonntags
    const sundayOfWeek = new Date(mondayOfWeek);
    sundayOfWeek.setDate(mondayOfWeek.getDate() + 6);
    const sundayFormatted = sundayOfWeek.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit'
    });
    
    return `KW ${week}/${year} (${mondayFormatted} - ${sundayFormatted})`;
}

/**
 * Berechnet Montag einer Kalenderwoche (ISO 8601-konform)
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Date} Montag der Woche
 */
function getMondayOfWeek(year, week) {
    // 4. Januar ist immer in KW 1 (ISO 8601)
    const jan4 = new Date(year, 0, 4);
    const daysToMonday = 1 - jan4.getDay() || -6; // Montag = 1
    const firstMonday = new Date(jan4.getTime() + daysToMonday * 24 * 60 * 60 * 1000);
    
    // Gewünschte KW berechnen
    const targetMonday = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
    
    return targetMonday;
}

/**
 * Lädt Informationen für eine Woche
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Promise<Object>} Informationen-Daten
 */
export async function getInformationenFürWoche(year, week) {
    try {
        const response = await fetch(`/shared/data/portal/informationen/${year}/${week}.json`);
        
        if (!response.ok) {
            if (response.status === 404) {
                return {}; // Keine Informationen für diese Woche
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const informationen = await response.json();
        return informationen || {};
        
    } catch (error) {
        console.warn(`Keine Informationen für KW ${week}/${year} gefunden:`, error.message);
        return {};
    }
}

/**
 * Markiert eine Information als gelesen
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @param {string} informationId - ID der Information
 * @returns {Promise<boolean>} Erfolg
 */
export async function markiereInformationAlsGelesen(year, week, informationId) {
    try {
        const response = await fetch(`/api/informationen/${informationId}/read`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        return result.success;
        
    } catch (error) {
        console.error('Fehler beim Markieren der Information als gelesen:', error);
        throw error;
    }
}

/**
 * Prüft ob eine Einrichtung ungelesene Informationen hat
 * @param {Object} informationen - Informationen-Daten
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {boolean} Hat ungelesene Informationen
 */
export function hatUngeleseneInformationen(informationen, einrichtungId) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    
    for (const tag of wochentage) {
        const tagDaten = informationen[tag];
        if (tagDaten && tagDaten[einrichtungId]) {
            const einrichtungInfos = tagDaten[einrichtungId];
            if (einrichtungInfos.some(info => !info.read && !info.soft_deleted)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Ermittelt Anzahl ungelesener Informationen für eine Einrichtung
 * @param {Object} informationen - Informationen-Daten
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {number} Anzahl ungelesener Informationen
 */
export function getAnzahlUngeleseneInformationen(informationen, einrichtungId) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    let anzahl = 0;
    
    for (const tag of wochentage) {
        const tagDaten = informationen[tag];
        if (tagDaten && tagDaten[einrichtungId]) {
            const einrichtungInfos = tagDaten[einrichtungId];
            anzahl += einrichtungInfos.filter(info => !info.read && !info.soft_deleted).length;
        }
    }
    
    return anzahl;
}

/**
 * Ermittelt Informationen einer Einrichtung für alle Tage
 * @param {Object} informationen - Informationen-Daten
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {Object} Informationen nach Tagen gruppiert
 */
export function getInformationenFürEinrichtung(informationen, einrichtungId) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const einrichtungInfos = {};
    
    for (const tag of wochentage) {
        const tagDaten = informationen[tag];
        if (tagDaten && tagDaten[einrichtungId]) {
            const infos = tagDaten[einrichtungId].filter(info => !info.soft_deleted);
            if (infos.length > 0) {
                einrichtungInfos[tag] = infos;
            }
        }
    }
    
    return einrichtungInfos;
} 