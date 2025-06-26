// script.js - Menü-Portal Hauptsteuerung
// Koordiniert alle Sub-Module und initialisiert das Menü-Portal

// WICHTIG: Bootstrap und Icons MÜSSEN hier importiert werden
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Globale und Modul-spezifische Styles
import '@shared/styles/layout.css';
import '../css/style.css';

// Module imports
import { initializeHeader } from '@shared/components/header/header.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { initMenuePortalAPI } from './module/menue-portal-api.js';
import { initMenuePortalUI } from './module/menue-portal-ui.js';
import { initMenuePortalAuth } from './module/menue-portal-auth.js';

// Bewertungsmodule
import './module/bewertung-api.js';
import './module/bewertung-modal.js';

// Bestellungs- und Handler-Module importieren um globale Funktionen verfügbar zu machen
import './module/bestellung-handler.js';
import './module/mobile-accordion-handler.js';
import './module/desktop-calendar-handler.js';

/**
 * Hauptinitialisierung des Menü-Portals
 */
async function initMenuePortal() {
    try {
        console.log('🚀 Menü-Portal wird initialisiert...');
        
        // Bewertungs-Buttons sind jetzt standardmäßig sichtbar
        
        // 1. Header zuerst initialisieren und auf Promise warten
        const user = await initializeHeader();
        
        // 2. Authentifizierung prüfen und Einrichtungen laden
        const authResult = await initMenuePortalAuth();
        if (!authResult.success) {
            showError(authResult.message);
            return;
        }
        
        // 3. API-Module initialisieren
        initMenuePortalAPI();
        
        // 4. UI-Module initialisieren mit dem User vom Header
        await initMenuePortalUI(user, authResult.einrichtungen);
        
        console.log('✅ Menü-Portal erfolgreich initialisiert');
        
    } catch (error) {
        console.error('❌ Fehler bei der Initialisierung des Menü-Portals:', error);
        showError('Fehler beim Laden des Menü-Portals. Bitte Seite neu laden.');
    }
}

/**
 * Zeigt eine Fehlermeldung an
 * @param {string} message - Die Fehlermeldung
 */
function showError(message) {
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (errorMessage && errorText) {
        errorText.textContent = message;
        errorMessage.style.display = 'block';
    }
    
    // Toast-Benachrichtigung
    showToast(message, 'error');
}

/**
 * Event-Listener für globale Ereignisse
 */
function setupGlobalEventListeners() {
    // Resize-Handler für responsive Layout
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Trigger UI Update für Layout-Wechsel
            window.dispatchEvent(new CustomEvent('menue-portal:layout-change'));
        }, 250);
    });

    // Unhandled Promise Rejections abfangen
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled Promise Rejection:', event.reason);
        showToast('Ein unerwarteter Fehler ist aufgetreten.', 'error');
    });

    // Fehlerbehandlung für uncaught exceptions
    window.addEventListener('error', (event) => {
        console.error('JavaScript Error:', event.error);
        showToast('Ein Anwendungsfehler ist aufgetreten.', 'error');
    });
}

/**
 * Service Worker Registration (falls vorhanden)
 */
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            // Service Worker könnte für Offline-Funktionalität implementiert werden
            console.log('Service Worker Support verfügbar');
        } catch (error) {
            console.log('Service Worker Registration fehlgeschlagen:', error);
        }
    }
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 Menü-Portal DOM geladen');
    
    // Globale Event-Listener setup
    setupGlobalEventListeners();
    
    // Service Worker (optional)
    registerServiceWorker();
    
    // Hauptinitialisierung
    initMenuePortal();
});

// Debug-Modus für Development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.menuePortalDebug = {
        reloadModules: () => {
            location.reload();
        },
        showToast: (message, type = 'info') => {
            showToast(message, type);
        },
        getState: () => {
            return {
                user: window.currentUser,
                einrichtungen: window.currentEinrichtungen,
                menuPlan: window.currentMenuPlan
            };
        }
    };
    console.log('🔧 Debug-Modus aktiviert. Verwende window.menuePortalDebug');
}

// Export für Test-Zwecke
export { initMenuePortal, showError }; 