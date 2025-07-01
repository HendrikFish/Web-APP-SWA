/**
 * Abwesenheiten API-Modul V2.0
 * Jahresbasierte Ferienverwaltung und Kinderverteilung
 */

// Module-State für Caching
let moduleData = {
    currentYear: 2025,
    availableYears: [2025, 2024, 2023],
    jahresDaten: new Map(), // Jahr -> Daten
    einrichtungen: [],
    statusDefinitionen: {},
    currentUser: null,
    isAdmin: false,
    isInitialized: false,
    hasErrors: false
};

// Fallback-Daten für den Fall, dass das Laden fehlschlägt
const fallbackData = {
    statusDefinitionen: {
        "normal": { "label": "Normal", "farbe": "#28a745", "icon": "🟩", "essen": true },
        "ferien": { "label": "Ferien", "farbe": "#dc3545", "icon": "🟥", "essen": false },
        "sonderbetrieb": { "label": "Sonderbetrieb (ohne Essen)", "farbe": "#ffc107", "icon": "🟨", "essen": false },
        "ausflug": { "label": "Ausflug (ohne Essen)", "farbe": "#17a2b8", "icon": "🟦", "essen": false }
    }
};

/**
 * Initialisiert die API und lädt Basisdaten
 */
export async function initAbwesenheitAPI() {
    try {
        console.log('🔄 Lade Abwesenheits-API V2.0...');
        
        // Paralleles Laden der Grunddaten mit individueller Fehlerbehandlung
        const results = await Promise.allSettled([
            loadEinrichtungen(),
            loadJahresDaten(moduleData.currentYear),
            loadUserData()
        ]);
        
        // Prüfe welche Datenquellen erfolgreich geladen wurden
        let successCount = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
            } else {
                const dataTypes = ['Einrichtungen', 'Jahres-Daten', 'User-Daten'];
                console.warn(`⚠️ ${dataTypes[index]} konnten nicht geladen werden:`, result.reason);
            }
        });
        
        moduleData.isInitialized = true;
        moduleData.hasErrors = successCount < 3;
        
        if (successCount === 0) {
            console.warn('⚠️ Keine Daten geladen - verwende Fallback-Daten');
            useFallbackData();
        }
        
        console.log(`✅ Abwesenheits-API V2.0 initialisiert (${successCount}/3 Datenquellen erfolgreich)`);
        
        return {
            currentUser: moduleData.currentUser,
            isAdmin: moduleData.isAdmin,
            availableYears: moduleData.availableYears,
            statusDefinitionen: moduleData.statusDefinitionen
        };
        
    } catch (error) {
        console.error('❌ Kritischer Fehler beim Initialisieren der Abwesenheits-API:', error);
        moduleData.hasErrors = true;
        moduleData.isInitialized = true;
        useFallbackData();
        throw error;
    }
}

/**
 * Aktiviert Fallback-Daten wenn echte Daten nicht geladen werden können
 */
function useFallbackData() {
    moduleData.statusDefinitionen = { ...fallbackData.statusDefinitionen };
    moduleData.currentUser = { kuerzel: 'DEMO', name: 'Demo User', isAdmin: false };
    moduleData.isAdmin = false;
    console.log('📋 Fallback-Daten aktiviert');
}

/**
 * Lädt User-Daten und bestimmt Berechtigungen
 */
export async function loadUserData() {
    try {
        console.log('👤 Lade User-Daten...');
        
        // TODO: Echte User-API implementieren
        // Für jetzt simulierte Daten
        moduleData.currentUser = {
            kuerzel: 'ER',
            name: 'Hendrik Fischer',
            einrichtung: 'ER',
            isAdmin: false
        };
        
        moduleData.isAdmin = moduleData.currentUser.isAdmin;
        
        console.log(`👤 User geladen: ${moduleData.currentUser.name} (Admin: ${moduleData.isAdmin})`);
        return moduleData.currentUser;
        
    } catch (error) {
        console.warn('⚠️ Fehler beim Laden der User-Daten:', error.message);
        moduleData.currentUser = { kuerzel: 'DEMO', name: 'Demo User', isAdmin: false };
        moduleData.isAdmin = false;
        throw error;
    }
}

/**
 * Lädt alle Einrichtungen (aus bestehender Datei)
 */
export async function loadEinrichtungen() {
    try {
        console.log('📋 Lade Einrichtungen...');
        
        const response = await fetch('../../../shared/data/einrichtungen/einrichtungen.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('Einrichtungen-Daten haben ungültiges Format (kein Array)');
        }
        
        moduleData.einrichtungen = data;
        console.log(`📋 ${data.length} Einrichtungen erfolgreich geladen`);
        return data;
        
    } catch (error) {
        console.warn('⚠️ Fehler beim Laden der Einrichtungen:', error.message);
        moduleData.einrichtungen = [];
        throw error;
    }
}

/**
 * Lädt Jahres-Daten für ein bestimmtes Jahr
 */
export async function loadJahresDaten(jahr) {
    try {
        console.log(`📅 Lade Jahres-Daten für ${jahr}...`);
        
        const response = await fetch(`../../../shared/data/abwesenheit/abwesenheiten-${jahr}.json`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // Jahr existiert noch nicht, erstelle leere Struktur
                console.log(`📅 Jahr ${jahr} noch nicht vorhanden, erstelle neue Struktur`);
                const neueJahresDaten = createEmptyYearData(jahr);
                moduleData.jahresDaten.set(jahr, neueJahresDaten);
                return neueJahresDaten;
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Status-Definitionen extrahieren
        if (data.status_definitionen) {
            moduleData.statusDefinitionen = data.status_definitionen;
        }
        
        moduleData.jahresDaten.set(jahr, data);
        console.log(`📅 Jahres-Daten für ${jahr} erfolgreich geladen`);
        return data;
        
    } catch (error) {
        console.warn(`⚠️ Fehler beim Laden der Jahres-Daten für ${jahr}:`, error.message);
        
        // Erstelle leere Jahres-Struktur als Fallback
        const fallbackJahr = createEmptyYearData(jahr);
        moduleData.jahresDaten.set(jahr, fallbackJahr);
        
        if (!moduleData.statusDefinitionen || Object.keys(moduleData.statusDefinitionen).length === 0) {
            moduleData.statusDefinitionen = { ...fallbackData.statusDefinitionen };
        }
        
        throw error;
    }
}

/**
 * Erstellt eine leere Jahres-Datenstruktur
 */
function createEmptyYearData(jahr) {
    return {
        jahr: jahr,
        erstellt: new Date().toISOString(),
        aktualisiert: new Date().toISOString(),
        einrichtungen: {},
        kinderverteilung: {},
        status_definitionen: { ...fallbackData.statusDefinitionen }
    };
}

/**
 * Gibt die Jahres-Daten für ein bestimmtes Jahr zurück
 */
export function getJahresDaten(jahr = null) {
    const targetJahr = jahr || moduleData.currentYear;
    return moduleData.jahresDaten.get(targetJahr) || createEmptyYearData(targetJahr);
}

/**
 * Gibt alle verfügbaren Einrichtungen zurück
 */
export function getEinrichtungen() {
    return [...moduleData.einrichtungen];
}

/**
 * Gibt die Status-Definitionen zurück
 */
export function getStatusDefinitionen() {
    return { ...moduleData.statusDefinitionen };
}

/**
 * Gibt die User-Daten zurück
 */
export function getCurrentUser() {
    return moduleData.currentUser;
}

/**
 * Prüft ob der aktuelle User Admin ist
 */
export function isUserAdmin() {
    return moduleData.isAdmin;
}

/**
 * Setzt das aktuelle Jahr
 */
export async function setCurrentYear(jahr) {
    if (moduleData.currentYear !== jahr) {
        moduleData.currentYear = jahr;
        
        // Lade Daten für das neue Jahr falls noch nicht geladen
        if (!moduleData.jahresDaten.has(jahr)) {
            await loadJahresDaten(jahr);
        }
    }
}

/**
 * Gibt das aktuelle Jahr zurück
 */
export function getCurrentYear() {
    return moduleData.currentYear;
}

/**
 * Speichert oder aktualisiert den Status eines Tages
 */
export async function saveDayStatus(einrichtungKuerzel, datum, status, grund = '') {
    try {
        const jahr = new Date(datum).getFullYear();
        const jahresDaten = getJahresDaten(jahr);
        
        // Stelle sicher dass die Einrichtung existiert
        if (!jahresDaten.einrichtungen[einrichtungKuerzel]) {
            jahresDaten.einrichtungen[einrichtungKuerzel] = {
                name: getEinrichtungName(einrichtungKuerzel),
                kuerzel: einrichtungKuerzel,
                tage: {}
            };
        }
        
        // Bestimme die Kalenderwoche
        const kw = getCalendarWeek(new Date(datum));
        
        // Speichere den Tag-Status
        if (status === 'normal') {
            // Entferne den Eintrag wenn er auf "normal" gesetzt wird
            delete jahresDaten.einrichtungen[einrichtungKuerzel].tage[datum];
        } else {
            jahresDaten.einrichtungen[einrichtungKuerzel].tage[datum] = {
                status: status,
                grund: grund,
                kw: kw
            };
        }
        
        // Aktualisiere Timestamp
        jahresDaten.aktualisiert = new Date().toISOString();
        
        // TODO: Hier würde der API-Call zum Backend stehen
        console.log(`💾 Tag-Status für ${einrichtungKuerzel} am ${datum} gespeichert: ${status}`);
        
        // Simulierter Delay für realistisches Verhalten
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return { einrichtungKuerzel, datum, status, grund, kw };
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern des Tag-Status:', error);
        throw new Error(`Tag-Status konnte nicht gespeichert werden: ${error.message}`);
    }
}

/**
 * Gibt den Status eines bestimmten Tages zurück
 */
export function getDayStatus(einrichtungKuerzel, datum, jahr = null) {
    const jahresDaten = getJahresDaten(jahr);
    
    if (!jahresDaten.einrichtungen[einrichtungKuerzel]) {
        return { status: 'normal', grund: '' };
    }
    
    const tagData = jahresDaten.einrichtungen[einrichtungKuerzel].tage[datum];
    return tagData || { status: 'normal', grund: '' };
}

/**
 * Hilfsfunktion: Gibt den Namen einer Einrichtung zurück
 */
function getEinrichtungName(kuerzel) {
    const einrichtung = moduleData.einrichtungen.find(e => e.kuerzel === kuerzel);
    return einrichtung ? einrichtung.name : kuerzel;
}

/**
 * Hilfsfunktion: Berechnet die Kalenderwoche für ein Datum
 */
function getCalendarWeek(date) {
    const tempDate = new Date(date);
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Gibt alle verfügbaren Jahre zurück
 */
export function getAvailableYears() {
    return [...moduleData.availableYears];
}

/**
 * Bereinigt alte Jahres-Daten (hält nur die letzten 3 Jahre)
 */
export function cleanupOldYears() {
    const currentYear = new Date().getFullYear();
    const keepYears = [currentYear, currentYear - 1, currentYear - 2];
    
    console.log(`🧹 Bereinige Jahres-Daten, behalte: ${keepYears.join(', ')}`);
    
    // Aktualisiere verfügbare Jahre
    moduleData.availableYears = keepYears;
    
    // Entferne alte Daten aus dem Cache
    for (const [jahr] of moduleData.jahresDaten.entries()) {
        if (!keepYears.includes(jahr)) {
            moduleData.jahresDaten.delete(jahr);
            console.log(`🗑️ Jahr ${jahr} aus Cache entfernt`);
        }
    }
}

/**
 * Prüft ob die API initialisiert wurde
 */
export function isInitialized() {
    return moduleData.isInitialized;
}

/**
 * Prüft ob Fehler beim Laden aufgetreten sind
 */
export function hasLoadingErrors() {
    return moduleData.hasErrors;
} 