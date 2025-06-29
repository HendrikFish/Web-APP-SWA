/**
 * Erweiterte Preisberechnung für Zutaten
 * Unterstützt flexible Umrechnung zwischen Einkaufs- und Verwendungseinheiten
 */

/**
 * Berechnet automatisch alle Preisgrundlagen aus der Einkaufsinformation
 * @param {Object} zutat - Das Zutat-Objekt mit Preisinformationen
 * @returns {Object} - Berechnungsgrundlagen für alle Einheiten
 */
export function berechnePreisgrundlagen(zutat) {
    if (!zutat.preis) return null;

    const einkaufspreis = zutat.preis.basis;
    const einkaufseinheit = zutat.preis.basiseinheit?.toLowerCase();
    
    // Gewicht pro Einheit (für Stück-Artikel)
    const gewichtProEinheit = zutat.gewicht_pro_einheit || 
                              zutat.durchschnittsgewicht || 
                              getDurchschnittsgewichtFürZutat(zutat);
    
    const berechnungsgrundlagen = {
        pro_gramm: 0,
        pro_milliliter: 0,
        pro_stueck: 0,
        einkaufspreis: einkaufspreis,
        einkaufseinheit: einkaufseinheit
    };

    // Berechnung basierend auf Einkaufseinheit
    switch (einkaufseinheit) {
        case 'kg':
            berechnungsgrundlagen.pro_gramm = einkaufspreis / 1000;
            // Wenn Stück-Gewicht bekannt, berechne Stückpreis
            if (gewichtProEinheit > 0) {
                berechnungsgrundlagen.pro_stueck = berechnungsgrundlagen.pro_gramm * gewichtProEinheit;
            }
            break;
            
        case 'g':
            berechnungsgrundlagen.pro_gramm = einkaufspreis;
            if (gewichtProEinheit > 0) {
                berechnungsgrundlagen.pro_stueck = berechnungsgrundlagen.pro_gramm * gewichtProEinheit;
            }
            break;
            
        case 'l':
            berechnungsgrundlagen.pro_milliliter = einkaufspreis / 1000;
            break;
            
        case 'ml':
            berechnungsgrundlagen.pro_milliliter = einkaufspreis;
            break;
            
        case 'stk.':
        case 'stk':
        case 'stück':
            berechnungsgrundlagen.pro_stueck = einkaufspreis;
            // Wenn Gewicht bekannt, berechne Gramm-Preis
            if (gewichtProEinheit > 0) {
                berechnungsgrundlagen.pro_gramm = einkaufspreis / gewichtProEinheit;
            }
            break;
            
        case 'pkg.':
        case 'packung':
            berechnungsgrundlagen.pro_stueck = einkaufspreis;
            if (gewichtProEinheit > 0) {
                berechnungsgrundlagen.pro_gramm = einkaufspreis / gewichtProEinheit;
            }
            break;
            
        default:
            console.warn(`Unbekannte Einkaufseinheit: ${einkaufseinheit}`);
            // Fallback: Verwende alte Logik
            if (zutat.preis.umrechnungsfaktor) {
                berechnungsgrundlagen.pro_gramm = einkaufspreis / zutat.preis.umrechnungsfaktor;
            }
    }

    return berechnungsgrundlagen;
}

/**
 * Berechnet den Preis für eine bestimmte Menge und Einheit
 * @param {Object} zutat - Das Zutat-Objekt
 * @param {number} menge - Die benötigte Menge
 * @param {string} einheit - Die Verwendungseinheit
 * @param {number} [benutzerDurchschnittsgewicht] - Benutzerdefiniertes Durchschnittsgewicht aus Rezept-UI
 * @returns {number} - Berechneter Preis
 */
export function berechnePreisFürMenge(zutat, menge, einheit, benutzerDurchschnittsgewicht = null) {
    const berechnungsgrundlagen = berechnePreisgrundlagen(zutat);
    if (!berechnungsgrundlagen) return 0;

    const verwendungseinheit = einheit?.toLowerCase();
    
    switch (verwendungseinheit) {
        case 'g':
        case 'gramm':
            return menge * berechnungsgrundlagen.pro_gramm;
            
        case 'kg':
        case 'kilogramm':
            return menge * berechnungsgrundlagen.pro_gramm * 1000;
            
        case 'ml':
        case 'milliliter':
            return menge * berechnungsgrundlagen.pro_milliliter;
            
        case 'l':
        case 'liter':
            return menge * berechnungsgrundlagen.pro_milliliter * 1000;
            
        case 'stk.':
        case 'stk':
        case 'stück':
            // Prüfe ob benutzerdefiniertes Durchschnittsgewicht verwendet werden soll
            if (benutzerDurchschnittsgewicht && benutzerDurchschnittsgewicht > 0) {
                const standardGewicht = zutat.gewicht_pro_einheit || 
                                       zutat.durchschnittsgewicht || 
                                       getDurchschnittsgewichtFürZutat(zutat);
                
                if (standardGewicht > 0) {
                    // Preisanpassung basierend auf Gewichtsunterschied
                    const gewichtsFaktor = benutzerDurchschnittsgewicht / standardGewicht;
                    return menge * berechnungsgrundlagen.pro_stueck * gewichtsFaktor;
                }
            }
            return menge * berechnungsgrundlagen.pro_stueck;
            
        case 'pkg.':
        case 'packung':
            // Gleiche Logik für Packungen
            if (benutzerDurchschnittsgewicht && benutzerDurchschnittsgewicht > 0) {
                const standardGewicht = zutat.gewicht_pro_einheit || 
                                       zutat.durchschnittsgewicht || 
                                       getDurchschnittsgewichtFürZutat(zutat);
                
                if (standardGewicht > 0) {
                    const gewichtsFaktor = benutzerDurchschnittsgewicht / standardGewicht;
                    return menge * berechnungsgrundlagen.pro_stueck * gewichtsFaktor;
                }
            }
            return menge * berechnungsgrundlagen.pro_stueck;
            
        default:
            console.warn(`Unbekannte Verwendungseinheit: ${verwendungseinheit}`);
            return 0;
    }
}

/**
 * Erstellt eine detaillierte Preisaufschlüsselung für Debug-Zwecke
 * @param {Object} zutat - Das Zutat-Objekt
 * @param {number} menge - Die benötigte Menge
 * @param {string} einheit - Die Verwendungseinheit
 * @param {number} [benutzerDurchschnittsgewicht] - Benutzerdefiniertes Durchschnittsgewicht
 * @returns {Object} - Detaillierte Aufschlüsselung
 */
export function erstellePreisaufschlüsselung(zutat, menge, einheit, benutzerDurchschnittsgewicht = null) {
    const berechnungsgrundlagen = berechnePreisgrundlagen(zutat);
    if (!berechnungsgrundlagen) return null;

    const preis = berechnePreisFürMenge(zutat, menge, einheit, benutzerDurchschnittsgewicht);
    
    const ausgabe = {
        zutat_name: zutat.name,
        einkauf: {
            preis: berechnungsgrundlagen.einkaufspreis,
            einheit: berechnungsgrundlagen.einkaufseinheit
        },
        verwendung: {
            menge: menge,
            einheit: einheit,
            preis: preis
        },
        berechnungsgrundlagen: berechnungsgrundlagen,
        berechnung: `${menge} ${einheit} × ${getPreisProEinheit(berechnungsgrundlagen, einheit)}€ = ${preis.toFixed(4)}€`
    };
    
    // Bei Stück-Einheiten zusätzliche Gewichtsinformationen anzeigen
    if (benutzerDurchschnittsgewicht && (einheit?.toLowerCase() === 'stk.' || einheit?.toLowerCase() === 'stk' || einheit?.toLowerCase() === 'stück')) {
        const standardGewicht = zutat.gewicht_pro_einheit || zutat.durchschnittsgewicht || getDurchschnittsgewichtFürZutat(zutat);
        const gewichtsFaktor = benutzerDurchschnittsgewicht / standardGewicht;
        
        ausgabe.gewichtsanpassung = {
            standard_gewicht: standardGewicht,
            benutzer_gewicht: benutzerDurchschnittsgewicht,
            gewichts_faktor: gewichtsFaktor,
            standard_preis: berechnungsgrundlagen.pro_stueck,
            angepasster_preis: berechnungsgrundlagen.pro_stueck * gewichtsFaktor
        };
        
        ausgabe.berechnung = `${menge} ${einheit} × ${(berechnungsgrundlagen.pro_stueck * gewichtsFaktor).toFixed(4)}€ (${benutzerDurchschnittsgewicht}g statt ${standardGewicht}g) = ${preis.toFixed(4)}€`;
    }
    
    return ausgabe;
}

/**
 * Gibt den Preis pro Einheit für eine bestimmte Verwendungseinheit zurück
 * @param {Object} berechnungsgrundlagen - Die Berechnungsgrundlagen
 * @param {string} einheit - Die Verwendungseinheit
 * @returns {number} - Preis pro Einheit
 */
function getPreisProEinheit(berechnungsgrundlagen, einheit) {
    const verwendungseinheit = einheit?.toLowerCase();
    
    switch (verwendungseinheit) {
        case 'g':
        case 'gramm':
            return berechnungsgrundlagen.pro_gramm;
        case 'kg':
        case 'kilogramm':
            return berechnungsgrundlagen.pro_gramm * 1000;
        case 'ml':
        case 'milliliter':
            return berechnungsgrundlagen.pro_milliliter;
        case 'l':
        case 'liter':
            return berechnungsgrundlagen.pro_milliliter * 1000;
        case 'stk.':
        case 'stk':
        case 'stück':
        case 'pkg.':
        case 'packung':
            return berechnungsgrundlagen.pro_stueck;
        default:
            return 0;
    }
}

/**
 * Schätzt das Durchschnittsgewicht für gängige Stück-Zutaten
 * @param {Object} zutat - Das Zutat-Objekt
 * @returns {number} - Durchschnittsgewicht in Gramm
 */
function getDurchschnittsgewichtFürZutat(zutat) {
    const name = zutat.name?.toLowerCase() || '';
    
    // Häufige Zutatenschätzungen (in Gramm)
    const schätzungen = {
        'ei': 60,
        'eier': 60,
        'zwiebel': 150,
        'tomate': 120,
        'kartoffel': 150,
        'apfel': 180,
        'zitrone': 100,
        'packung': 250,  // Durchschnittliche Packung
        'dose': 400,     // Durchschnittliche Dose
        'scheibe': 25,   // Brotscheibe, Käsescheibe
        'putenschnitzel': 100,
        'fleischbällchen': 15,
        'bällchen': 15,
    };
    
    // Einfache Wort-Suche in Zutatennamen
    for (const [schlüssel, gewicht] of Object.entries(schätzungen)) {
        if (name.includes(schlüssel)) {
            return gewicht;
        }
    }
    
    // Standard-Fallback: 100g pro Stück
    return 100;
}

/**
 * Validiert, ob eine Zutat korrekte Preisinformationen hat
 * @param {Object} zutat - Das Zutat-Objekt
 * @returns {boolean} - true wenn gültig
 */
export function validatePreisstruktur(zutat) {
    if (!zutat.preis) return false;
    if (!zutat.preis.basis || zutat.preis.basis <= 0) return false;
    if (!zutat.preis.basiseinheit) return false;
    
    return true;
}

/**
 * Konvertiert alte Preisstruktur in neue Preisstruktur
 * @param {Object} zutat - Zutat mit alter Preisstruktur
 * @returns {Object} - Zutat mit erweiterten Preisberechnungen
 */
export function konvertiereAltePreisstruktur(zutat) {
    if (!zutat.preis) return zutat;
    
    // Wenn bereits neue Struktur, keine Konvertierung nötig
    if (zutat.preis_v2) return zutat;
    
    const berechnungsgrundlagen = berechnePreisgrundlagen(zutat);
    
    return {
        ...zutat,
        preis_v2: {
            einkauf: {
                basis: zutat.preis.basis,
                einheit: zutat.preis.basiseinheit
            },
            gewicht_pro_einheit: zutat.durchschnittsgewicht || getDurchschnittsgewichtFürZutat(zutat),
            berechnungsgrundlagen: berechnungsgrundlagen
        }
    };
} 