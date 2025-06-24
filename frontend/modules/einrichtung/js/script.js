import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@shared/styles/layout.css';
import '../css/style.css';

import { initializeHeader } from '@shared/components/header/header.js';

// Importiere die Sub-Module
import { initEinrichtungForm } from './module/einrichtung-form-ui.js';
import { initEinrichtungListe } from './module/einrichtung-liste-ui.js';

// Initialisiert den Header sofort, damit er sichtbar ist, während der Rest lädt.
initializeHeader();

/**
 * Initialisiert die Modul-spezifischen Funktionen, sobald das DOM vollständig geladen ist.
 */
document.addEventListener('DOMContentLoaded', () => {
    initEinrichtungForm();
    initEinrichtungListe();
}); 