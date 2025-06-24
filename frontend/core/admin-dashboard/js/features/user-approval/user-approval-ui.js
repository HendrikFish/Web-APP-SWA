/*
 * Siehe _FUNKTIONSWEISE.md für weitere Informationen zu diesem Feature.
 */
import customFieldsConfig from '@shared/config/custom-fields.json';

/**
 * Rendert die UI zur Genehmigung von Benutzern.
 * @param {HTMLElement} container - Das DOM-Element, in das die UI gerendert wird.
 * @param {Array<object>} pendingUsers - Eine Liste von Benutzerobjekten, die auf Genehmigung warten.
 * @param {object} callbacks - Ein Objekt mit den Callbacks { onApprove, onDelete }.
 */
export function renderApprovalUI(container, pendingUsers, callbacks) {
    if (!container) {
        console.error("Container für die Benutzergenehmigung nicht gefunden.");
        return;
    }

    container.innerHTML = ''; 

    if (pendingUsers.length === 0) {
        container.innerHTML = '<div class="alert alert-success">Aktuell gibt es keine neuen Anfragen.</div>';
        return;
    }

    const listGroup = document.createElement('div');
    listGroup.className = 'list-group';

    pendingUsers.forEach(user => {
        const item = document.createElement('div');
        item.className = 'list-group-item d-flex justify-content-between align-items-center';

        // Details des Benutzers zusammenstellen
        let userDetailsHTML = `
            <h5 class="mb-1">${user.firstName} ${user.lastName}</h5>
            <p class="mb-1"><small>${user.email}</small></p>
        `;

        // Dynamische Felder hinzufügen, falls vorhanden
        if (user.customFields && Object.keys(user.customFields).length > 0) {
            userDetailsHTML += '<ul class="list-unstyled mb-0 mt-2 small">';
            for (const [key, value] of Object.entries(user.customFields)) {
                // Finde das passende Label aus der globalen Konfiguration
                const fieldConfig = customFieldsConfig.find(field => field.id === key);
                const label = fieldConfig ? fieldConfig.label : key;
                userDetailsHTML += `<li><strong>${label}:</strong> ${value}</li>`;
            }
            userDetailsHTML += '</ul>';
        }

        item.innerHTML = `
            <div>
                ${userDetailsHTML}
            </div>
            <div>
                <button class="btn btn-success btn-sm me-2" data-user-id="${user._id}" data-action="approve">
                    <i class="bi bi-check-lg me-1"></i> Genehmigen
                </button>
                <button class="btn btn-danger btn-sm" data-user-id="${user._id}" data-action="delete">
                    <i class="bi bi-x-lg me-1"></i> Löschen
                </button>
            </div>
        `;
        listGroup.appendChild(item);
    });

    container.appendChild(listGroup);

    // Event-Listener für die Buttons
    listGroup.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-user-id]');
        if (!button) return;

        const userId = button.dataset.userId;
        const action = button.dataset.action;

        if (action === 'approve') {
            callbacks.onApprove(userId);
        } else if (action === 'delete') {
            callbacks.onDelete(userId);
        }
    });
}

// Diese Datei wird später die UI-Logik enthalten.
console.log("User Approval UI Modul geladen."); 