// menue-portal-ui-utils.js - UI-Utility-Funktionen für das Menü-Portal
// Extrahiert aus menue-portal-ui.js für bessere Modularität

import { showToast } from '@shared/components/toast-notification/toast-notification.js';

/**
 * Erkennt ob Mobile- oder Desktop-Layout verwendet werden soll
 * @returns {boolean} true wenn mobile Ansicht
 */
export function isMobileView() {
    return window.innerWidth < 768;
}

/**
 * Aktualisiert die Mobile/Desktop-Erkennung und schaltet Container um
 * @param {boolean} isMobile - Aktueller Mobile-Status
 * @param {Function} renderCallback - Callback zum Neurendern falls nötig
 */
export function updateMobileDetection(isMobile, renderCallback = null) {
    // Container sichtbarkeit umschalten
    const mobileContainer = document.getElementById('mobile-accordion');
    const desktopContainer = document.getElementById('desktop-calendar');
    
    if (mobileContainer) mobileContainer.style.display = isMobile ? 'block' : 'none';
    if (desktopContainer) desktopContainer.style.display = isMobile ? 'none' : 'block';
    
    // Optional: Callback für Neurendering
    if (renderCallback && typeof renderCallback === 'function') {
        renderCallback();
    }
}

/**
 * Aktualisiert die Wochenanzeige im UI
 * @param {number} currentWeek - Aktuelle Kalenderwoche
 * @param {number} currentYear - Aktuelles Jahr
 * @param {Function} getMondayOfWeek - Funktion zur Montag-Berechnung
 * @param {Function} formatDate - Funktion zur Datumsformatierung
 */
export function updateWeekDisplay(currentWeek, currentYear, getMondayOfWeek, formatDate) {
    const weekDisplay = document.getElementById('week-display');
    if (weekDisplay) {
        const monday = getMondayOfWeek(currentYear, currentWeek);
        const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);
        
        weekDisplay.textContent = `KW ${currentWeek}/${currentYear} (${formatDate(monday)} - ${formatDate(sunday)})`;
    }
}

/**
 * Zeigt den Loading-Indikator an
 */
export function showLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'block';
}

/**
 * Versteckt den Loading-Indikator
 */
export function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) loader.style.display = 'none';
}

/**
 * Zeigt eine Fehlermeldung an
 * @param {string} message - Die Fehlermeldung
 */
export function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <i class="bi bi-exclamation-triangle me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        errorContainer.style.display = 'block';
    } else {
        showToast(message, 'error');
    }
}

/**
 * Druckt den Menüplan (erzwingt Desktop-Layout)
 * @param {boolean} originalIsMobile - Original Mobile-Status
 * @param {Function} renderCallback - Funktion zum Neurendern
 * @param {Function} updateMobileCallback - Funktion zur Mobile-Detection-Update
 */
export function printMenuplan(originalIsMobile, renderCallback, updateMobileCallback) {
    try {
        // Aktuelle Layout-Einstellungen speichern
        const mobileContainer = document.getElementById('mobile-accordion');
        const desktopContainer = document.getElementById('desktop-calendar');
        
        // Temporär Desktop-Layout erzwingen
        const tempIsMobile = false;
        
        // Desktop-Kalender sichtbar machen und Mobile verstecken
        if (mobileContainer) {
            mobileContainer.style.display = 'none';
        }
        if (desktopContainer) {
            desktopContainer.style.display = 'block';
            desktopContainer.classList.remove('d-none');
        }
        
        // Desktop-Menü rendern - DAS WAR DER FEHLENDE SCHRITT!
        if (renderCallback) renderCallback();
        
        // Kurz warten, damit Layout vollständig gerendert wird
        setTimeout(() => {
            // Drucken
            window.print();
            
            // Nach dem Drucken (oder wenn Druckdialog geschlossen wird) Original-Layout wiederherstellen
            setTimeout(() => {
                if (updateMobileCallback) updateMobileCallback();
                // Original-Layout auch neu rendern
                if (renderCallback) renderCallback();
            }, 1000);
        }, 200);
        
    } catch (error) {
        console.error('Fehler beim Drucken:', error);
        showToast('Fehler beim Drucken', 'error');
        
        // Bei Fehler sicherstellen, dass Layout wiederhergestellt wird
        if (updateMobileCallback) updateMobileCallback();
        if (renderCallback) renderCallback();
    }
}

/**
 * Exportiert den Menüplan als PDF
 * @param {number} currentWeek - Aktuelle Kalenderwoche
 * @param {number} currentYear - Aktuelles Jahr
 * @param {object} currentEinrichtung - Aktuelle Einrichtung
 * @param {boolean} originalIsMobile - Original Mobile-Status
 * @param {Function} renderCallback - Funktion zum Neurendern
 * @param {Function} updateMobileCallback - Funktion zur Mobile-Detection-Update
 */
export function exportToPDF(currentWeek, currentYear, currentEinrichtung, originalIsMobile, renderCallback, updateMobileCallback) {
    try {
        // Aktuelle Layout-Einstellungen speichern
        const mobileContainer = document.getElementById('mobile-accordion');
        const desktopContainer = document.getElementById('desktop-calendar');
        
        // Desktop-Layout temporär erzwingen
        if (mobileContainer) mobileContainer.style.display = 'none';
        if (desktopContainer) {
            desktopContainer.style.display = 'block';
            desktopContainer.classList.remove('d-none');
        }
        
        // Desktop-Menü rendern
        if (renderCallback) renderCallback();
        
        // Kurz warten für vollständiges Rendering
        setTimeout(() => {
            // CSS-Styles sammeln
            let allCSS = '';
            
            // Bootstrap und andere externe CSS über Links sammeln
            const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
            const linkPromises = Array.from(linkElements).map(link => {
                return fetch(link.href)
                    .then(response => response.text())
                    .catch(() => '');
            });
            
            Promise.all(linkPromises).then(cssTexts => {
                allCSS = cssTexts.join('\n');
                
                // Lokale Stylesheets hinzufügen
                Array.from(document.styleSheets).forEach(sheet => {
                    try {
                        if (sheet.cssRules) {
                            allCSS += Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                        }
                    } catch (e) {
                        console.warn('Stylesheet nicht zugänglich:', e);
                    }
                });
                
                // HTML-Inhalt für PDF vorbereiten
                const printHTML = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Menüplan KW ${currentWeek}/${currentYear} - ${currentEinrichtung?.name || 'Einrichtung'}</title>
    <style>
        ${allCSS}
        
        /* PDF-spezifische Optimierungen */
        @media print {
            body { margin: 0; padding: 20px; }
            * { 
                -webkit-print-color-adjust: exact !important; 
                color-adjust: exact !important; 
                print-color-adjust: exact !important;
            }
        }
        
        /* Inline-Styles für bessere Kompatibilität */
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .navbar { display: none !important; }
        #mobile-accordion { display: none !important; }
        #desktop-calendar { display: block !important; }
    </style>
</head>
<body>
    ${document.body.innerHTML}
    <script>
        // Direkt drucken wenn Seite geladen
        window.onload = function() {
            setTimeout(() => {
                window.print();
                // Fenster nach Druck schließen
                window.onafterprint = function() {
                    window.close();
                };
            }, 500);
        };
    </script>
</body>
</html>`;
                
                // Blob-URL erstellen (moderner Ansatz ohne document.write)
                const blob = new Blob([printHTML], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                
                // Neues Fenster mit Blob-URL öffnen
                const printWindow = window.open(url, '_blank');
                
                if (!printWindow) {
                    showToast('Pop-up wurde blockiert. Bitte erlauben Sie Pop-ups für PDF-Export.', 'warning');
                    URL.revokeObjectURL(url);
                } else {
                    showToast('PDF-Export wird vorbereitet...', 'info');
                    
                    // URL nach 30 Sekunden freigeben
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 30000);
                }
                
            }).catch(error => {
                console.error('Fehler beim Laden der CSS-Dateien:', error);
                showToast('Fallback: Verwenden Sie den Drucken-Button.', 'warning');
            });
            
            // Original-Layout nach PDF-Export wiederherstellen
            setTimeout(() => {
                if (updateMobileCallback) updateMobileCallback();
                if (renderCallback) renderCallback();
            }, 1000);
            
        }, 200);
        
    } catch (error) {
        console.error('Fehler beim PDF-Export:', error);
        showToast('Fehler beim PDF-Export. Verwenden Sie den Drucken-Button.', 'error');
        
        // Bei Fehler sicherstellen, dass Layout wiederhergestellt wird
        if (updateMobileCallback) updateMobileCallback();
        if (renderCallback) renderCallback();
    }
}

/**
 * Berechnet die ISO 8601-konforme Kalenderwoche für ein Datum
 * @param {Date} date - Das Datum
 * @returns {object} Objekt mit { year, week } für korrektes Jahr/Woche-Mapping
 */
export function getISOWeek(date) {
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
 * Legacy-Funktion für Kompatibilität - gibt nur die Wochennummer zurück
 * @param {Date} date - Das Datum
 * @returns {number} Die Kalenderwoche (1-53)
 */
export function getWeekNumber(date) {
    return getISOWeek(date).week;
}

/**
 * Berechnet die Anzahl der Wochen in einem Jahr nach ISO 8601
 * @param {number} year - Das Jahr
 * @returns {number} Die Anzahl der Wochen (52 oder 53)
 */
export function getWeeksInYear(year) {
    // Der 4. Januar liegt immer in der ersten Woche des Jahres (ISO 8601)
    const jan4 = new Date(year, 0, 4);
    
    // Der 28. Dezember liegt immer in der letzten Woche des Jahres
    const dec28 = new Date(year, 11, 28);
    
    // Berechne die Woche des 28. Dezember
    const lastWeek = getISOWeek(dec28);
    
    // Wenn das berechnete Jahr des 28.12. dem gewünschten Jahr entspricht,
    // dann ist das die Anzahl der Wochen
    if (lastWeek.year === year) {
        return lastWeek.week;
    }
    
    // Fallback: 52 Wochen (Standard)
    return 52;
} 