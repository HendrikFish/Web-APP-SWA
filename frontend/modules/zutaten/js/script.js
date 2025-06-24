import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../css/style.css';

import { createZutat, getZutatenStammdaten, updateZutat } from './module/zutaten-api.js';
import { addZutatToList, initializeZutatenListe, initializeFilterControls, refreshZutatenListe } from './module/zutaten-liste-ui.js';
import { 
    getZutatFormularDaten, 
    initializeZutatenUI, 
    populateStammdaten, 
    resetForm,
    isFormValid,
    getCurrentlyEditingId
} from './module/zutaten-ui.js';

import { initializeHeader } from '@shared/components/header/header.js';
import { showToast } from '@shared/components/toast-notification/toast-notification.js';


async function initializeApp() {
    try {
        // Zuerst den Header laden
        await initializeHeader();

        // Dann die Stammdaten holen
        const stammdaten = await getZutatenStammdaten();
        
        // UI-Komponenten initialisieren und mit Daten füllen
        populateStammdaten(stammdaten);
        initializeFilterControls(stammdaten);
        initializeZutatenUI(); 
        initializeZutatenListe();

    } catch (error) {
        console.error('Fehler bei der Initialisierung der Seite:', error);
        showToast('Fehler beim Laden der Seitendaten.', 'error');
    }

    // Event-Listener für das Formular einrichten
    const zutatForm = document.getElementById('zutat-form');
    if (zutatForm) {
        zutatForm.addEventListener('submit', handleFormSubmit);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!isFormValid()) {
        showToast('Bitte füllen Sie alle Pflichtfelder aus (markiert mit *).', 'warning');
        return;
    }
    
    const zutatData = getZutatFormularDaten();
    const editingId = getCurrentlyEditingId();

    try {
        if (editingId) {
            // Modus: Bearbeiten
            await updateZutat({ ...zutatData, zutatennummer: editingId });
            showToast('Zutat erfolgreich aktualisiert!', 'success');
        } else {
            // Modus: Erstellen
            await createZutat(zutatData);
            showToast('Zutat erfolgreich gespeichert!', 'success');
        }
        
        // Formular zurücksetzen und Liste neu laden
        resetForm();
        await refreshZutatenListe();

    } catch (error) {
        console.error('Fehler beim Verarbeiten der Zutat:', error);
        showToast(error.message || 'Ein unbekannter Fehler ist aufgetreten.', 'error');
    }
}

// Startet die Anwendung, sobald das DOM vollständig geladen ist.
document.addEventListener('DOMContentLoaded', initializeApp);