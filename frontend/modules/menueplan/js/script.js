// Haupt-Integrationsdatei für das Menüplan-Modul
// Verantwortlich für die Initialisierung und Koordination der Sub-Module.

// WICHTIG: Bootstrap und Icons MÜSSEN hier importiert werden
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

// Globale und Modul-spezifische Styles (Blueprint-konform)
import '@shared/styles/layout.css';
import '../css/style.css';

// Importiert die notwendige Polyfill-Bibliothek für Drag & Drop auf Touch-Geräten
import 'drag-drop-touch';

import { initializeHeader } from '@shared/components/header/header.js';
import { initMenueplanUI } from './module/menueplan-ui.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';

// Korrekter Blueprint-Lebenszyklus
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Header zuerst initialisieren und auf Promise warten
        const user = await initializeHeader();
        
        // 2. Erst nach erfolgreichem Header-Load das Modul initialisieren
        console.log('Header geladen, Menüplan-UI wird initialisiert...');
        await initMenueplanUI(user);
        
        // 3. Erfolgs-Feedback
        showToast('Menüplan erfolgreich geladen!', 'success');
        
    } catch (error) {
        console.error('Fehler bei der Initialisierung des Menüplan-Moduls:', error);
        showToast('Fehler beim Laden des Menüplan-Moduls.', 'error');
        
        // Fallback-UI bei kritischen Fehlern
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.innerHTML = `
                <div class="alert alert-danger mt-4" role="alert">
                    <h4 class="alert-heading">Fehler beim Laden</h4>
                    <p>Das Menüplan-Modul konnte nicht geladen werden.</p>
                    <hr>
                    <p class="mb-0">Bitte laden Sie die Seite neu oder kontaktieren Sie den Administrator.</p>
                </div>
            `;
        }
    }
}); 