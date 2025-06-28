// menue-portal-auth.js - Authentifizierung und Einrichtungszuordnung
// Prüft Benutzeranmeldung und lädt zugewiesene Einrichtungen

/**
 * Initialisiert die Authentifizierung für das Menü-Portal
 * @returns {Promise<{success: boolean, user?: object, einrichtungen?: array, message?: string}>}
 */
export async function initMenuePortalAuth() {
    try {
        console.log('🔐 Authentifizierung wird geprüft...');
        
        // 1. Aktuellen Benutzer laden
        const userResult = await getCurrentUser();
        if (!userResult.success) {
            return {
                success: false,
                message: 'Bitte melden Sie sich an, um das Menü-Portal zu nutzen.'
            };
        }
        
        const user = userResult.user;
        console.log('👤 Benutzer:', user.firstName, user.lastName, '(', user.email, ')');
        
        // 2. Einrichtungszuordnungen prüfen
        if (!user.einrichtungen || user.einrichtungen.length === 0) {
            return {
                success: false,
                message: 'Ihrem Benutzer sind keine Einrichtungen zugeordnet. Kontaktieren Sie einen Administrator.'
            };
        }
        
        // 3. Detaillierte Einrichtungsdaten laden
        const einrichtungen = await loadEinrichtungenDetails(user.einrichtungen);
        if (einrichtungen.length === 0) {
            return {
                success: false,
                message: 'Keine gültigen Einrichtungen gefunden. Kontaktieren Sie einen Administrator.'
            };
        }
        
        console.log(`🏢 ${einrichtungen.length} Einrichtung(en) geladen:`, einrichtungen.map(e => e.name));
        
        // 4. Globale Variablen setzen für andere Module
        window.currentUser = user;
        window.currentEinrichtungen = einrichtungen;
        
        return {
            success: true,
            user: user,
            einrichtungen: einrichtungen
        };
        
    } catch (error) {
        console.error('❌ Fehler bei der Authentifizierung:', error);
        return {
            success: false,
            message: 'Fehler beim Laden der Benutzerdaten. Bitte versuchen Sie es erneut.'
        };
    }
}

/**
 * Lädt den aktuellen Benutzer
 * @returns {Promise<{success: boolean, user?: object, message?: string}>}
 */
async function getCurrentUser() {
    try {
        const response = await fetch('/api/user/current', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token ungültig - redirect zum Login
                localStorage.removeItem('token');
                window.location.href = '/frontend/core/login/';
                return { success: false, message: 'Sitzung abgelaufen' };
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const user = await response.json();
        return {
            success: true,
            user: user
        };
        
    } catch (error) {
        console.error('Fehler beim Laden des Benutzers:', error);
        
        // Bei Netzwerkfehlern zum Login weiterleiten
        if (!localStorage.getItem('token')) {
            window.location.href = '/frontend/core/login/';
        }
        
        return {
            success: false,
            message: 'Fehler beim Laden der Benutzerdaten'
        };
    }
}

/**
 * Lädt detaillierte Informationen zu den zugewiesenen Einrichtungen
 * @param {string[]} einrichtungIds - Array von Einrichtungs-IDs
 * @returns {Promise<object[]>} Array von Einrichtungsobjekten
 */
async function loadEinrichtungenDetails(einrichtungIds) {
    try {
        console.log('🏢 Lade Details für Einrichtungen:', einrichtungIds);
        
        const einrichtungen = [];
        
        // Alle Einrichtungen laden (parallel)
        const requests = einrichtungIds.map(async (id) => {
            try {
                const url = `/api/einrichtungen/${id}`;
                console.log('🔗 Lade Einrichtung von URL:', url);
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                if (response.ok) {
                    const einrichtung = await response.json();
                    return einrichtung;
                } else {
                    console.warn(`Einrichtung ${id} konnte nicht geladen werden:`, response.status);
                    return null;
                }
            } catch (error) {
                console.warn(`Fehler beim Laden der Einrichtung ${id}:`, error);
                return null;
            }
        });
        
        const results = await Promise.all(requests);
        
        // Nur gültige Einrichtungen filtern
        results.forEach(einrichtung => {
            if (einrichtung && einrichtung.id) {
                einrichtungen.push(einrichtung);
            }
        });
        
        return einrichtungen;
        
    } catch (error) {
        console.error('Fehler beim Laden der Einrichtungsdetails:', error);
        return [];
    }
}

/**
 * Prüft, ob der Benutzer Zugriff auf eine bestimmte Einrichtung hat
 * @param {string} einrichtungId - Die zu prüfende Einrichtungs-ID
 * @returns {boolean} true wenn Zugriff gewährt
 */
export function hasAccessToEinrichtung(einrichtungId) {
    const einrichtungen = window.currentEinrichtungen || [];
    return einrichtungen.some(e => e.id === einrichtungId);
}

/**
 * Gibt die erste verfügbare Einrichtung zurück (für Standard-Auswahl)
 * Versucht zuerst die zuletzt gewählte Einrichtung zu laden
 * @returns {object|null} Erste Einrichtung oder null
 */
export function getDefaultEinrichtung() {
    const einrichtungen = window.currentEinrichtungen || [];
    if (einrichtungen.length === 0) return null;
    
    // Versuche zuletzt gewählte Einrichtung aus LocalStorage zu laden
    const lastEinrichtungId = localStorage.getItem('menue-portal-last-einrichtung');
    if (lastEinrichtungId) {
        const lastEinrichtung = einrichtungen.find(e => e.id === lastEinrichtungId);
        if (lastEinrichtung) {
            console.log('🔄 Zuletzt gewählte Einrichtung wiederhergestellt:', lastEinrichtung.name);
            return lastEinrichtung;
        }
    }
    
    // Fallback: Erste Einrichtung
    console.log('🏢 Standard-Einrichtung gewählt:', einrichtungen[0].name);
    return einrichtungen[0];
}

/**
 * Gibt alle verfügbaren Einrichtungen zurück
 * @returns {object[]} Array aller Einrichtungen
 */
export function getAllEinrichtungen() {
    return window.currentEinrichtungen || [];
}

/**
 * Findet eine Einrichtung anhand der ID
 * @param {string} einrichtungId - Die gesuchte Einrichtungs-ID
 * @returns {object|null} Einrichtung oder null
 */
export function findEinrichtungById(einrichtungId) {
    const einrichtungen = window.currentEinrichtungen || [];
    return einrichtungen.find(e => e.id === einrichtungId) || null;
}

/**
 * Logout-Funktion
 */
export function logout() {
    localStorage.removeItem('token');
    window.currentUser = null;
    window.currentEinrichtungen = null;
    window.location.href = '/frontend/core/login/';
} 