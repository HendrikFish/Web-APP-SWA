// bestellungen-api.js - API-Kommunikation für Bestellungen
// Ersetzt LocalStorage-Funktionalität durch JSON-Dateien

import { apiClient } from '@shared/utils/api-client.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';

/**
 * Lädt Bestellungen für eine spezifische Kalenderwoche
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {Promise<object>} API-Antwort mit Bestellungen
 */
export async function loadBestellungen(year, week) {
    try {
        console.log(`📋 Lade Bestellungen für KW ${week}/${year}...`);
        
        const response = await apiClient.get(`/api/bestellungen/${year}/${week}`);
        
        if (response.success) {
            console.log('✅ Bestellungen erfolgreich geladen:', response.bestellungen);
            return {
                success: true,
                bestellungen: response.bestellungen,
                message: response.message
            };
        } else {
            console.error('❌ Fehler beim Laden der Bestellungen:', response.message);
            return {
                success: false,
                message: response.message || 'Fehler beim Laden der Bestellungen'
            };
        }
        
    } catch (error) {
        console.error('❌ API-Fehler beim Laden der Bestellungen:', error);
        
        // Fallback: Leere Bestellungsstruktur
        return {
            success: false,
            bestellungen: createEmptyBestellungsstruktur(year, week),
            message: 'Bestellungen konnten nicht geladen werden - verwende leere Vorlage',
            error: error.message
        };
    }
}

/**
 * Speichert Bestellungen für eine spezifische Kalenderwoche
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @param {string} einrichtungId - ID der Einrichtung
 * @param {object} bestellungen - Bestellungsdaten
 * @param {object} einrichtungInfo - Zusätzliche Einrichtungsinfos
 * @returns {Promise<object>} API-Antwort
 */
export async function saveBestellungen(year, week, einrichtungId, bestellungen, einrichtungInfo = {}) {
    try {
        console.log(`💾 Speichere Bestellungen für ${einrichtungId} in KW ${week}/${year}...`);
        
        const requestBody = {
            einrichtung_id: einrichtungId,
            bestellungen: bestellungen,
            einrichtung_name: einrichtungInfo.name || 'Unbekannte Einrichtung',
            einrichtung_typ: einrichtungInfo.typ || 'extern',
            gruppen: einrichtungInfo.gruppen || []
        };
        
        const response = await apiClient.post(`/api/bestellungen/${year}/${week}`, requestBody);
        
        if (response.success) {
            console.log('✅ Bestellungen erfolgreich gespeichert');
            showToast(response.message || `Bestellungen für KW ${week}/${year} gespeichert`, 'success');
            return {
                success: true,
                message: response.message,
                gespeichert_am: response.gespeichert_am
            };
        } else {
            console.error('❌ Fehler beim Speichern der Bestellungen:', response.message);
            showToast(`Fehler beim Speichern: ${response.message}`, 'error');
            return {
                success: false,
                message: response.message || 'Fehler beim Speichern der Bestellungen'
            };
        }
        
    } catch (error) {
        console.error('❌ API-Fehler beim Speichern der Bestellungen:', error);
        showToast('Netzwerkfehler beim Speichern der Bestellungen', 'error');
        return {
            success: false,
            message: 'Netzwerkfehler beim Speichern der Bestellungen',
            error: error.message
        };
    }
}

/**
 * Lädt Bestellungen für eine spezifische Einrichtung aus der Wochendatei
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @param {string} einrichtungId - ID der Einrichtung
 * @returns {Promise<object>} Bestellungen der Einrichtung
 */
export async function loadBestellungenForEinrichtung(year, week, einrichtungId) {
    try {
        const result = await loadBestellungen(year, week);
        
        if (result.success && result.bestellungen?.einrichtungen?.[einrichtungId]) {
            return {
                success: true,
                bestellungen: result.bestellungen.einrichtungen[einrichtungId].tage || {},
                einrichtungsInfo: result.bestellungen.einrichtungen[einrichtungId].info || {},
                wochenstatistik: result.bestellungen.einrichtungen[einrichtungId].wochenstatistik || {}
            };
        }
        
        // Keine Bestellungen für diese Einrichtung
        return {
            success: true,
            bestellungen: {},
            einrichtungsInfo: {},
            wochenstatistik: {},
            message: 'Keine Bestellungen für diese Einrichtung gefunden'
        };
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Einrichtungsbestellungen:', error);
        return {
            success: false,
            bestellungen: {},
            message: 'Fehler beim Laden der Bestellungen'
        };
    }
}

/**
 * Erstellt eine leere Bestellungsstruktur als Fallback
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @returns {object} Leere Bestellungsstruktur
 */
function createEmptyBestellungsstruktur(year, week) {
    return {
        year: parseInt(year),
        week: parseInt(week),
        erstellt_am: new Date().toISOString(),
        letzte_änderung: new Date().toISOString(),
        einrichtungen: {},
        wochenstatistik: {
            gesamt_einrichtungen: 0,
            gesamt_bestellungen: 0,
            durchschnitt_pro_einrichtung: 0,
            einrichtungstypen: {}
        },
        metadaten: {
            bestellfrist: null,
            lieferwoche: null,
            status: "offen",
            änderungen_erlaubt: true,
            export_historie: []
        }
    };
}

/**
 * Exportiert Bestellungen für eine Woche in verschiedenen Formaten
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @param {string} format - Exportformat ('json', 'csv', 'pdf')
 * @returns {Promise<object>} Export-Ergebnis
 */
export async function exportBestellungen(year, week, format = 'json') {
    try {
        const result = await loadBestellungen(year, week);
        
        if (!result.success) {
            return {
                success: false,
                message: 'Bestellungen konnten nicht geladen werden'
            };
        }
        
        switch (format.toLowerCase()) {
            case 'csv':
                return exportToCSV(result.bestellungen);
            case 'pdf':
                return exportToPDF(result.bestellungen);
            default:
                return {
                    success: true,
                    data: result.bestellungen,
                    format: 'json',
                    filename: `bestellungen_${year}_KW${week.toString().padStart(2, '0')}.json`
                };
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Exportieren der Bestellungen:', error);
        return {
            success: false,
            message: 'Fehler beim Exportieren der Bestellungen'
        };
    }
}

/**
 * Exportiert Bestellungen als CSV
 * @param {object} bestellungen - Bestellungsstruktur
 * @returns {object} CSV-Export-Ergebnis
 */
function exportToCSV(bestellungen) {
    try {
        const csvHeaders = ['Einrichtung', 'Tag', 'Kategorie', 'Gruppe', 'Anzahl'];
        const csvRows = [csvHeaders.join(',')];
        
        Object.entries(bestellungen.einrichtungen || {}).forEach(([einrichtungId, einrichtungData]) => {
            const einrichtungName = einrichtungData.info?.name || einrichtungId;
            
            Object.entries(einrichtungData.tage || {}).forEach(([tag, tagData]) => {
                Object.entries(tagData).forEach(([kategorie, kategorieData]) => {
                    Object.entries(kategorieData).forEach(([gruppe, anzahl]) => {
                        if (anzahl > 0) {
                            csvRows.push([
                                einrichtungName,
                                tag,
                                kategorie,
                                gruppe,
                                anzahl
                            ].join(','));
                        }
                    });
                });
            });
        });
        
        return {
            success: true,
            data: csvRows.join('\n'),
            format: 'csv',
            filename: `bestellungen_${bestellungen.year}_KW${bestellungen.week.toString().padStart(2, '0')}.csv`
        };
        
    } catch (error) {
        console.error('❌ Fehler beim CSV-Export:', error);
        return {
            success: false,
            message: 'Fehler beim CSV-Export'
        };
    }
}

/**
 * Exportiert Bestellungen als PDF (Placeholder)
 * @param {object} bestellungen - Bestellungsstruktur
 * @returns {object} PDF-Export-Ergebnis
 */
function exportToPDF(bestellungen) {
    // TODO: PDF-Export implementieren
    return {
        success: false,
        message: 'PDF-Export noch nicht implementiert'
    };
}

// Globale Verfügbarkeit für Legacy-Code
window.bestellungenAPI = {
    loadBestellungen,
    saveBestellungen,
    loadBestellungenForEinrichtung,
    exportBestellungen
}; 