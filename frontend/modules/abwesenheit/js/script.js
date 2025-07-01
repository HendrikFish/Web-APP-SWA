/**
 * Abwesenheiten Hauptscript V2.0
 * Jahresbasierte Ferienverwaltung und Kinderverteilung
 */

import { initAbwesenheitAPI, isInitialized, hasLoadingErrors, cleanupOldYears } from './module/abwesenheit-api.js';
import { initAbwesenheitUI, hideInitialLoadingSpinner, showErrorFallbackUI } from './module/abwesenheit-ui.js';
import { initializeBreadcrumbNavbar } from '@shared/components/breadcrumb-navbar/breadcrumb-navbar.js';

/**
 * Hauptinitialisierung des Abwesenheiten-Moduls
 */
async function initApp() {
    try {
        console.log('🚀 Starte Abwesenheiten-Modul V2.0...');
        
        // 1. Breadcrumb-Navbar initialisieren (enthält Benutzeranzeige und Abmelden)
        console.log('⏳ Lade Breadcrumb-Navigation...');
        const user = await initializeBreadcrumbNavbar();
        
        // Bereinige alte Jahres-Daten beim Start
        cleanupOldYears();
        
        // 2. API initialisieren und Basisdaten laden
        console.log('⏳ Initialisiere API...');
        const apiData = await initAbwesenheitAPI();
        
        if (!isInitialized()) {
            throw new Error('API-Initialisierung fehlgeschlagen');
        }
        
        if (hasLoadingErrors()) {
            console.warn('⚠️ Einige Daten konnten nicht geladen werden - verwende Fallback-Daten');
        }
        
        // 3. UI initialisieren basierend auf API-Daten und User
        console.log('🎨 Initialisiere UI...');
        await initAbwesenheitUI(apiData, user);
        
        // 4. Finale Kontrolle: Spinner sicher verstecken
        hideInitialLoadingSpinner();
        
        console.log('🎉 Abwesenheiten-Modul V2.0 erfolgreich geladen!');
        
        // Debug-Informationen in die Konsole
        console.log('📊 Modul-Status:', {
            currentUser: apiData.currentUser,
            isAdmin: apiData.isAdmin,
            availableYears: apiData.availableYears,
            statusDefinitionen: Object.keys(apiData.statusDefinitionen),
            hasErrors: hasLoadingErrors()
        });
        
    } catch (error) {
        console.error('❌ Kritischer Fehler beim Laden des Abwesenheiten-Moduls:', error);
        
        // Zeige Fallback-UI bei kritischen Fehlern
        showErrorFallbackUI(error);
        
        // Verstecke Loading-Spinner auch bei Fehlern
        hideInitialLoadingSpinner();
    }
}

/**
 * Error-Boundary für unbehandelte Fehler
 */
window.addEventListener('error', (event) => {
    console.error('💥 Unbehandelter Fehler im Abwesenheiten-Modul:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 Unbehandelte Promise-Ablehnung im Abwesenheiten-Modul:', event.reason);
});

// Starte die App sobald DOM bereit ist
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    // DOM ist bereits geladen
    initApp();
} 