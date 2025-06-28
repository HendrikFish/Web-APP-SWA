// informationen-api.js - API-Client für das Informationssystem
// Verwaltet alle Informationen-bezogenen API-Aufrufe

import { apiClient } from '@shared/utils/api-client.js';

/**
 * Lädt Informationen für eine bestimmte Kalenderwoche
 * @param {number} jahr - Jahr
 * @param {number} kalenderwoche - Kalenderwoche
 * @param {string} einrichtung_id - ID der Einrichtung
 * @returns {Promise<object>} API-Response mit Informationen
 */
export async function getInformationen(jahr, kalenderwoche, einrichtung_id) {
    try {
        // Validierung der Parameter
        if (!jahr || !kalenderwoche || !einrichtung_id) {
            throw new Error(`Fehlende Parameter: jahr=${jahr}, kalenderwoche=${kalenderwoche}, einrichtung_id=${einrichtung_id}`);
        }
        
        console.log(`📋 API-Aufruf: Lade Informationen für KW ${kalenderwoche}/${jahr}, Einrichtung: ${einrichtung_id}`);
        
        const response = await apiClient.get('/api/informationen', {
            params: {
                jahr,
                kalenderwoche,
                einrichtung_id
            }
        });
        
        if (response.success) {
            console.log('✅ Informationen erfolgreich geladen:', Object.keys(response.informationen).length, 'Tage');
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Informationen:', error);
        throw error;
    }
}

/**
 * Erstellt eine neue Information
 * @param {object} informationData - Informationsdaten
 * @returns {Promise<object>} API-Response
 */
export async function createInformation(informationData) {
    try {
        console.log('📝 Erstelle neue Information:', informationData);
        
        const response = await apiClient.post('/api/informationen', informationData);
        
        if (response.success) {
            console.log('✅ Information erfolgreich erstellt:', response.information.id);
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Information:', error);
        throw error;
    }
}

/**
 * Bearbeitet eine existierende Information
 * @param {string} informationId - ID der Information
 * @param {object} updateData - Zu aktualisierende Daten
 * @returns {Promise<object>} API-Response
 */
export async function updateInformation(informationId, updateData) {
    try {
        console.log('📝 Aktualisiere Information:', informationId, updateData);
        
        const response = await apiClient.put(`/api/informationen/${informationId}`, updateData);
        
        if (response.success) {
            console.log('✅ Information erfolgreich aktualisiert');
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Aktualisieren der Information:', error);
        throw error;
    }
}

/**
 * Löscht eine Information (Soft Delete)
 * @param {string} informationId - ID der Information
 * @returns {Promise<object>} API-Response
 */
export async function deleteInformation(informationId) {
    try {
        console.log('🗑️ Lösche Information:', informationId);
        
        const response = await apiClient.delete(`/api/informationen/${informationId}`);
        
        if (response.success) {
            console.log('✅ Information erfolgreich gelöscht');
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Löschen der Information:', error);
        throw error;
    }
}

/**
 * Markiert eine Information als gelesen
 * @param {string} informationId - ID der Information
 * @returns {Promise<object>} API-Response
 */
export async function markInformationAsRead(informationId) {
    try {
        console.log('👁️ Markiere Information als gelesen:', informationId);
        
        const response = await apiClient.patch(`/api/informationen/${informationId}/read`);
        
        if (response.success) {
            console.log('✅ Information als gelesen markiert');
        }
        
        return response;
    } catch (error) {
        console.error('❌ Fehler beim Markieren der Information als gelesen:', error);
        throw error;
    }
}

/**
 * Hilfsfunktion: Berechnet ISO-Kalenderwoche aus Datum
 * @param {Date} date - Datum
 * @returns {number} ISO-Kalenderwoche
 */
export function getISOWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Hilfsfunktion: Formatiert Datum für die API
 * @param {Date} date - Datum
 * @returns {string} Formatiertes Datum (YYYY-MM-DD)
 */
export function formatDateForAPI(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Hilfsfunktion: Validiert Informationsdaten vor API-Aufruf
 * @param {object} informationData - Zu validierende Daten
 * @returns {object} Validierungsresultat
 */
export function validateInformationData(informationData) {
    const errors = [];
    
    // Pflichtfelder prüfen
    const requiredFields = [
        'jahr', 'kalenderwoche', 'tag', 'einrichtung_id', 
        'einrichtung_name', 'titel', 'inhalt'
    ];
    
    requiredFields.forEach(field => {
        if (!informationData[field]) {
            errors.push(`Feld '${field}' ist erforderlich`);
        }
    });
    
    // Titel-Länge prüfen
    if (informationData.titel && informationData.titel.trim().length < 3) {
        errors.push('Titel muss mindestens 3 Zeichen lang sein');
    }
    
    // Inhalt-Länge prüfen
    if (informationData.inhalt && informationData.inhalt.trim().length < 10) {
        errors.push('Inhalt muss mindestens 10 Zeichen lang sein');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
} 