// bewertung-api.js - API-Client für das Bewertungssystem
// Verwaltet alle Bewertungs-bezogenen API-Aufrufe

import { apiClient } from '@shared/utils/api-client.js';

/**
 * Erstellt eine neue Bewertung
 * @param {object} bewertungData - Bewertungsdaten
 * @returns {Promise<object>} API-Response
 */
export async function createBewertung(bewertungData) {
    try {
        console.log('📝 Erstelle neue Bewertung:', bewertungData);
        
        const response = await apiClient.post('/api/bewertungen', bewertungData);
        
        if (response.success) {
            console.log('✅ Bewertung erfolgreich erstellt:', response.bewertung.id);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Bewertung:', error);
        throw error;
    }
}

/**
 * Ruft Bewertungen für eine Kalenderwoche ab
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Promise<object>} API-Response mit Bewertungen
 */
export async function getBewertungen(year, week) {
    try {
        console.log(`📊 Lade Bewertungen für KW ${week}/${year}`);
        
        const response = await apiClient.get(`/api/bewertungen/${year}/${week}`);
        
        console.log(`✅ ${response.statistiken?.gesamtBewertungen || 0} Bewertungen geladen`);
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Bewertungen:', error);
        throw error;
    }
}

/**
 * Ruft das verfügbare Zeitfenster für Bewertungen ab
 * @returns {Promise<object>} API-Response mit Zeitfenster
 */
export async function getZeitfenster() {
    try {
        console.log('📅 Lade Bewertungs-Zeitfenster');
        
        const response = await apiClient.get('/api/bewertungen/zeitfenster');
        
        if (response.success) {
            console.log(`✅ Zeitfenster: ${response.zeitfenster.von} bis ${response.zeitfenster.bis}`);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Laden des Zeitfensters:', error);
        throw error;
    }
}

/**
 * Löscht eine eigene Bewertung
 * @param {string} bewertungId - ID der zu löschenden Bewertung
 * @returns {Promise<object>} API-Response
 */
export async function deleteBewertung(bewertungId) {
    try {
        console.log('🗑️ Lösche Bewertung:', bewertungId);
        
        const response = await apiClient.delete(`/api/bewertungen/${bewertungId}`);
        
        if (response.success) {
            console.log('✅ Bewertung erfolgreich gelöscht');
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Bewertung:', error);
        throw error;
    }
}

/**
 * Hilfsfunktion: Prüft ob ein Datum im bewertbaren Zeitfenster liegt
 * @param {string|Date} datum - Zu prüfendes Datum
 * @returns {boolean} True wenn bewertbar
 */
export function istDatumBewertbar(datum) {
    const heute = new Date();
    const pruefDatum = new Date(datum);
    const zehnTageZurueck = new Date();
    zehnTageZurueck.setDate(heute.getDate() - 10);
    
    return pruefDatum >= zehnTageZurueck && pruefDatum <= heute;
}

/**
 * Hilfsfunktion: Berechnet Kalenderwoche aus Datum
 * @param {Date} datum - Datum
 * @returns {number} Kalenderwoche
 */
export function getKalenderwoche(datum) {
    const firstJan = new Date(datum.getFullYear(), 0, 1);
    const pastDaysOfYear = (datum - firstJan) / 86400000;
    return Math.ceil((pastDaysOfYear + firstJan.getDay() + 1) / 7);
}

/**
 * Hilfsfunktion: Formatiert Datum für API
 * @param {Date} datum - Datum
 * @returns {string} Formatiertes Datum (YYYY-MM-DD)
 */
export function formatDateForAPI(datum) {
    return datum.toISOString().split('T')[0];
}

/**
 * Hilfsfunktion: Validiert Bewertungsdaten vor API-Aufruf
 * @param {object} bewertungData - Zu validierende Daten
 * @returns {object} Validierungsresultat
 */
export function validateBewertungData(bewertungData) {
    const errors = [];
    
    // Pflichtfelder prüfen
    const requiredFields = [
        'kalenderwoche', 'jahr', 'tag', 'kategorie', 'rezepte',
        'geschmack', 'optik', 'verbesserungsvorschlag', 'menueplan_datum',
        'einrichtung_id', 'einrichtung_name'
    ];
    
    requiredFields.forEach(field => {
        if (!bewertungData[field]) {
            errors.push(`Feld '${field}' ist erforderlich`);
        }
    });
    
    // Bewertungswerte prüfen
    if (bewertungData.geschmack < 1 || bewertungData.geschmack > 5) {
        errors.push('Geschmacksbewertung muss zwischen 1 und 5 liegen');
    }
    
    if (bewertungData.optik < 1 || bewertungData.optik > 5) {
        errors.push('Optikbewertung muss zwischen 1 und 5 liegen');
    }
    
    // Verbesserungsvorschlag-Länge prüfen
    if (bewertungData.verbesserungsvorschlag.length < 10) {
        errors.push('Verbesserungsvorschlag muss mindestens 10 Zeichen lang sein');
    }
    
    // Zeitfenster prüfen
    if (!istDatumBewertbar(bewertungData.menueplan_datum)) {
        errors.push('Datum liegt außerhalb des bewertbaren Zeitfensters (letzte 10 Tage)');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
} 