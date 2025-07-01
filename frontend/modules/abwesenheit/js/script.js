/**
 * Abwesenheiten Hauptscript V2.0
 * Jahresbasierte Ferienverwaltung und Kinderverteilung
 */

import { initAbwesenheitAPI, isInitialized, hasLoadingErrors, cleanupOldYears } from './module/abwesenheit-api.js';
import { initAbwesenheitUI, hideInitialLoadingSpinner, showErrorFallbackUI } from './module/abwesenheit-ui.js';

/**
 * Hauptinitialisierung des Abwesenheiten-Moduls
 */
async function initApp() {
    try {
        console.log('🚀 Starte Abwesenheiten-Modul V2.0...');
        
        // Breadcrumb Navigation laden
        const breadcrumbContainer = document.getElementById('breadcrumb-navbar-container');
        if (breadcrumbContainer) {
            breadcrumbContainer.innerHTML = `
                <nav aria-label="breadcrumb" class="bg-light p-3 rounded mb-4">
                    <ol class="breadcrumb mb-0">
                        <li class="breadcrumb-item">
                            <a href="/frontend/core/dashboard/index.html" class="text-decoration-none">
                                <i class="bi bi-house-door me-1"></i>Dashboard
                            </a>
                        </li>
                        <li class="breadcrumb-item active" aria-current="page">
                            <i class="bi bi-calendar-x me-1"></i>Abwesenheiten & Kinderverteilung
                        </li>
                    </ol>
                </nav>
            `;
        }
        
        // Bereinige alte Jahres-Daten beim Start
        cleanupOldYears();
        
        // 1. API initialisieren und Basisdaten laden
        console.log('⏳ Initialisiere API...');
        const apiData = await initAbwesenheitAPI();
        
        if (!isInitialized()) {
            throw new Error('API-Initialisierung fehlgeschlagen');
        }
        
        if (hasLoadingErrors()) {
            console.warn('⚠️ Einige Daten konnten nicht geladen werden - verwende Fallback-Daten');
        }
        
        // 2. UI initialisieren basierend auf API-Daten
        console.log('🎨 Initialisiere UI...');
        await initAbwesenheitUI(apiData);
        
        // 3. Finale Kontrolle: Spinner sicher verstecken
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