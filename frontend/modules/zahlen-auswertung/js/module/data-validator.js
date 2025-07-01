/**
 * Data Validation Module für Zahlen-Auswertung
 * Verhindert XSS-Attacken und stellt Datenintegrität sicher
 */

/**
 * Schema für Bestelldaten-Validation
 */
const BESTELLDATEN_SCHEMA = {
    year: { type: 'number', min: 2020, max: 2030 },
    week: { type: 'number', min: 1, max: 53 },
    einrichtungen: { type: 'object', required: true },
    metadaten: { type: 'object', optional: true }
};

const EINRICHTUNG_SCHEMA = {
    id: { type: 'string', required: true, maxLength: 100 },
    name: { type: 'string', required: true, maxLength: 200 },
    typ: { type: 'string', required: true, enum: ['intern', 'extern'] },
    info: { type: 'object', required: true },
    tage: { type: 'object', required: true }
};

const INFO_SCHEMA = {
    name: { type: 'string', required: true, maxLength: 200 },
    typ: { type: 'string', required: true, enum: ['intern', 'extern'] },
    gruppen: { type: 'array', optional: true },
    letzte_aktualisierung: { type: 'string', optional: true },
    read: { type: 'boolean', optional: true }
};

/**
 * Sanitisiert HTML-String und entfernt gefährliche Zeichen
 * @param {string} input - Zu sanitisierender String
 * @returns {string} Sanitisierter String
 */
export function sanitizeHTML(input) {
    if (typeof input !== 'string') return '';
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Validiert numerische Werte mit Bereichsprüfung
 * @param {any} value - Zu prüfender Wert
 * @param {number} min - Minimum
 * @param {number} max - Maximum
 * @returns {boolean} Ist gültig
 */
export function validateNumber(value, min = -Infinity, max = Infinity) {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) && num >= min && num <= max;
}

/**
 * Validiert String-Werte
 * @param {any} value - Zu prüfender Wert
 * @param {Object} rules - Validierungsregeln
 * @returns {Object} Validierungsergebnis
 */
export function validateString(value, rules = {}) {
    const result = { valid: true, errors: [] };
    
    if (typeof value !== 'string') {
        result.valid = false;
        result.errors.push('Wert muss ein String sein');
        return result;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
        result.valid = false;
        result.errors.push(`String zu lang (max: ${rules.maxLength})`);
    }
    
    if (rules.enum && !rules.enum.includes(value)) {
        result.valid = false;
        result.errors.push(`Ungültiger Wert. Erlaubt: ${rules.enum.join(', ')}`);
    }
    
    if (rules.pattern && !rules.pattern.test(value)) {
        result.valid = false;
        result.errors.push('String entspricht nicht dem erwarteten Format');
    }
    
    return result;
}

/**
 * Validiert Bestelldaten gegen Schema
 * @param {Object} data - Zu validierende Daten
 * @returns {Object} Validierungsergebnis
 */
export function validateBestelldaten(data) {
    const errors = [];
    
    try {
        // Basis-Strukturvalidierung
        if (!data || typeof data !== 'object') {
            throw new Error('Bestelldaten müssen ein Objekt sein');
        }
        
        // Jahr validieren
        if (!validateNumber(data.year, 2020, 2030)) {
            errors.push('Ungültiges Jahr (2020-2030 erlaubt)');
        }
        
        // Woche validieren
        if (!validateNumber(data.week, 1, 53)) {
            errors.push('Ungültige Kalenderwoche (1-53 erlaubt)');
        }
        
        // Einrichtungen validieren
        if (!data.einrichtungen || typeof data.einrichtungen !== 'object') {
            errors.push('Einrichtungen-Objekt fehlt oder ist ungültig');
        } else {
            // Jede Einrichtung validieren
            Object.entries(data.einrichtungen).forEach(([id, einrichtung]) => {
                const einrichtungErrors = validateEinrichtung(einrichtung, id);
                errors.push(...einrichtungErrors);
            });
        }
        
        return {
            valid: errors.length === 0,
            errors,
            sanitizedData: errors.length === 0 ? sanitizeBestelldaten(data) : null
        };
        
    } catch (error) {
        return {
            valid: false,
            errors: [error.message],
            sanitizedData: null
        };
    }
}

/**
 * Validiert eine einzelne Einrichtung
 * @param {Object} einrichtung - Einrichtungsdaten
 * @param {string} id - Einrichtungs-ID
 * @returns {Array} Array von Fehlern
 */
function validateEinrichtung(einrichtung, id) {
    const errors = [];
    
    if (!einrichtung || typeof einrichtung !== 'object') {
        errors.push(`Einrichtung ${id}: Daten fehlen oder sind ungültig`);
        return errors;
    }
    
    // Info-Objekt validieren
    if (!einrichtung.info || typeof einrichtung.info !== 'object') {
        errors.push(`Einrichtung ${id}: Info-Objekt fehlt`);
    } else {
        // Name validieren
        const nameResult = validateString(einrichtung.info.name, { maxLength: 200 });
        if (!nameResult.valid) {
            errors.push(`Einrichtung ${id}: ${nameResult.errors.join(', ')}`);
        }
        
        // Typ validieren
        const typResult = validateString(einrichtung.info.typ, { enum: ['intern', 'extern'] });
        if (!typResult.valid) {
            errors.push(`Einrichtung ${id}: ${typResult.errors.join(', ')}`);
        }
    }
    
    // Tage-Objekt validieren
    if (!einrichtung.tage || typeof einrichtung.tage !== 'object') {
        errors.push(`Einrichtung ${id}: Tage-Objekt fehlt`);
    } else {
        // Jeder Tag sollte numerische Werte haben
        Object.entries(einrichtung.tage).forEach(([tag, tagDaten]) => {
            if (tagDaten && tagDaten.hauptspeise) {
                Object.entries(tagDaten.hauptspeise).forEach(([gruppe, anzahl]) => {
                    if (!validateNumber(anzahl, 0, 1000)) {
                        errors.push(`Einrichtung ${id}, Tag ${tag}: Ungültige Anzahl für ${gruppe}`);
                    }
                });
            }
        });
    }
    
    return errors;
}

/**
 * Sanitisiert Bestelldaten und entfernt gefährliche Inhalte
 * @param {Object} data - Zu sanitisierende Daten
 * @returns {Object} Sanitisierte Daten
 */
function sanitizeBestelldaten(data) {
    const sanitized = {
        year: Number(data.year),
        week: Number(data.week),
        einrichtungen: {},
        metadaten: data.metadaten || {}
    };
    
    // Einrichtungen sanitisieren
    Object.entries(data.einrichtungen).forEach(([id, einrichtung]) => {
        sanitized.einrichtungen[sanitizeHTML(id)] = {
            info: {
                name: sanitizeHTML(einrichtung.info.name),
                typ: sanitizeHTML(einrichtung.info.typ),
                gruppen: Array.isArray(einrichtung.info.gruppen) 
                    ? einrichtung.info.gruppen.map(sanitizeHTML)
                    : [],
                letzte_aktualisierung: einrichtung.info.letzte_aktualisierung,
                read: Boolean(einrichtung.info.read)
            },
            tage: einrichtung.tage,
            wochenstatistik: einrichtung.wochenstatistik || {}
        };
    });
    
    return sanitized;
}

/**
 * Validiert Informationen-Daten
 * @param {Object} informationen - Informationen-Objekt
 * @returns {Object} Validierungsergebnis
 */
export function validateInformationen(informationen) {
    const errors = [];
    
    if (!informationen || typeof informationen !== 'object') {
        return { valid: true, errors: [], sanitizedData: {} }; // Informationen sind optional
    }
    
    Object.entries(informationen).forEach(([einrichtungId, infos]) => {
        if (!Array.isArray(infos)) {
            errors.push(`Informationen für ${einrichtungId}: Muss ein Array sein`);
            return;
        }
        
        infos.forEach((info, index) => {
            if (!info.id || typeof info.id !== 'string') {
                errors.push(`Information ${index} für ${einrichtungId}: ID fehlt`);
            }
            
            if (!info.titel || typeof info.titel !== 'string') {
                errors.push(`Information ${index} für ${einrichtungId}: Titel fehlt`);
            }
            
            if (info.titel && info.titel.length > 500) {
                errors.push(`Information ${index} für ${einrichtungId}: Titel zu lang`);
            }
        });
    });
    
    return {
        valid: errors.length === 0,
        errors,
        sanitizedData: errors.length === 0 ? sanitizeInformationen(informationen) : null
    };
}

/**
 * Sanitisiert Informationen-Daten
 * @param {Object} informationen - Zu sanitisierende Informationen
 * @returns {Object} Sanitisierte Informationen
 */
function sanitizeInformationen(informationen) {
    const sanitized = {};
    
    Object.entries(informationen).forEach(([einrichtungId, infos]) => {
        sanitized[sanitizeHTML(einrichtungId)] = infos.map(info => ({
            id: sanitizeHTML(info.id),
            titel: sanitizeHTML(info.titel),
            inhalt: sanitizeHTML(info.inhalt || ''),
            datum: info.datum,
            gelesen: Boolean(info.gelesen),
            wichtigkeit: sanitizeHTML(info.wichtigkeit || 'normal')
        }));
    });
    
    return sanitized;
}

/**
 * Rate-Limiting für API-Calls (verhindert DoS)
 */
const rateLimitStore = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitStore.has(identifier)) {
        rateLimitStore.set(identifier, []);
    }
    
    const requests = rateLimitStore.get(identifier);
    
    // Entferne alte Requests außerhalb des Zeitfensters
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    
    if (recentRequests.length >= maxRequests) {
        return {
            allowed: false,
            resetTime: Math.min(...recentRequests) + windowMs
        };
    }
    
    recentRequests.push(now);
    rateLimitStore.set(identifier, recentRequests);
    
    return {
        allowed: true,
        remaining: maxRequests - recentRequests.length
    };
} 