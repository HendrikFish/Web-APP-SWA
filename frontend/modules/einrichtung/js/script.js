import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@shared/styles/layout.css';
import '../css/style.css';

import { initializeBreadcrumbNavbar } from '@shared/components/breadcrumb-navbar/breadcrumb-navbar.js';

// Importiere die Sub-Module
import { initEinrichtungForm } from './module/einrichtung-form-ui.js';
import { initEinrichtungListe } from './module/einrichtung-liste-ui.js';

/**
 * Initialisiert die Modul-spezifischen Funktionen, sobald das DOM vollständig geladen ist.
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Breadcrumb-Navbar initialisieren (enthält bereits User-Management)
        const user = await initializeBreadcrumbNavbar();
        
        // Module initialisieren
        initEinrichtungForm();
        initEinrichtungListe();
    } catch (error) {
        console.error('Fehler bei der Initialisierung:', error);
    }
}); 