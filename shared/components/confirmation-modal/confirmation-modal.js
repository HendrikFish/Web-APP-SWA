import { Modal } from 'bootstrap';

let modalInstance = null;
let modalElement = null;

async function initModal() {
    if (document.getElementById('confirmationModal')) {
        // Wenn das Modal bereits im DOM ist, aber die Instanz verloren ging, erstelle sie neu.
        if (!modalInstance) {
            modalElement = document.getElementById('confirmationModal');
            modalInstance = new Modal(modalElement);
        }
        return; 
    }

    try {
        const response = await fetch('/shared/components/confirmation-modal/confirmation-modal.html');
        const html = await response.text();
        document.body.insertAdjacentHTML('beforeend', html);
        
        modalElement = document.getElementById('confirmationModal');
        modalInstance = new Modal(modalElement);

    } catch (error) {
        console.error('Fehler beim Initialisieren des Confirmation-Modals:', error);
    }
}

/**
 * Zeigt ein Bestätigungs-Modal an und gibt einen Promise zurück, der das Ergebnis der Benutzeraktion enthält.
 * @param {string} title - Der Titel des Modals.
 * @param {string} message - Die Nachricht oder Frage, die dem Benutzer angezeigt wird.
 * @returns {Promise<boolean>} - Resolves zu `true` bei Bestätigung, ansonsten `false`.
 */
export async function showConfirmationModal(title, message) {
    await initModal();
    
    if (!modalInstance) {
        console.error("Modal-Instanz konnte nicht erstellt werden.");
        return Promise.resolve(false); // Fallback, um Fehler zu vermeiden
    }

    // Titel und Nachricht setzen
    document.getElementById('confirmationModalLabel').textContent = title;
    document.getElementById('confirmationModalMessage').innerHTML = message;

    return new Promise((resolve) => {
        const confirmBtn = document.getElementById('confirmationModalConfirmBtn');
        const cancelBtn = document.getElementById('confirmationModalCancelBtn');

        const onConfirm = () => {
            cleanup();
            resolve(true);
        };

        const onCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const cleanup = () => {
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
            modalElement.removeEventListener('hidden.bs.modal', onCancel);
            // Verstecke die Modal-Instanz nur, wenn sie existiert
            if (modalInstance) {
                modalInstance.hide();
            }
        };

        confirmBtn.addEventListener('click', onConfirm, { once: true });
        cancelBtn.addEventListener('click', onCancel, { once: true });
        modalElement.addEventListener('hidden.bs.modal', onCancel, { once: true });

        modalInstance.show();
    });
} 