import { Modal } from 'bootstrap';

// Rollen-Liste für das Formular
const ROLES = ['admin', 'co-admin', 'Koch', 'Service', 'Stock', 'Schule', 'Kindergarten', 'LH', 'TZ', 'ER', 'extern'];

function getStatusBadge(status) {
    switch (status) {
        case 'Aktiv':
            return '<span class="badge bg-success">Aktiv</span>';
        case 'Inaktiv':
            return '<span class="badge bg-danger">Inaktiv</span>';
        case 'Empfangen':
            return '<span class="badge bg-info text-dark">Empfangen</span>';
        default:
            return `<span class="badge bg-secondary">${status}</span>`;
    }
}

function getTriggerText(trigger) {
    switch (trigger) {
        case 'once':
            return 'Einmalig';
        case 'onLogin':
            return 'Bei Login';
        case 'interval':
            return 'Tag-basiert';
        default:
            return trigger;
    }
}

function createNotificationRow(notification, callbacks) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>${notification.title}</td>
        <td><span class="badge bg-secondary">${getTriggerText(notification.trigger)}</span></td>
        <td><small>${notification.targetRoles.join(', ')}</small></td>
        <td>
            ${getStatusBadge(notification.status)}
        </td>
        <td class="text-end">
            <button class="btn btn-light btn-sm border" data-action="edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-light btn-sm border text-danger" data-action="delete"><i class="bi bi-trash"></i></button>
        </td>
    `;
    tr.querySelector('[data-action="edit"]').addEventListener('click', () => callbacks.onEdit(notification));
    tr.querySelector('[data-action="delete"]').addEventListener('click', () => callbacks.onDelete(notification.id));
    return tr;
}

export function showNotificationModal(notification, onSave) {
    const modalElement = document.getElementById('notificationModal');
    const modal = new Modal(modalElement);
    const form = document.getElementById('notificationForm');

    // Formular zurücksetzen
    form.reset();
    document.getElementById('notification-id').value = '';
    ROLES.forEach(role => {
        document.getElementById(`role-${role}`).checked = false;
    });

    if (notification) {
        // Bearbeiten-Modus: Formular füllen
        document.getElementById('notification-id').value = notification.id;
        document.getElementById('notification-title').value = notification.title;
        document.getElementById('notification-message').value = notification.message;
        document.getElementById('notification-trigger').value = notification.trigger;
        document.getElementById('notification-triggerValue').value = notification.triggerValue || '';
        document.getElementById('notification-active').checked = notification.active;
        notification.targetRoles.forEach(role => {
            const checkbox = document.getElementById(`role-${role}`);
            if (checkbox) checkbox.checked = true;
        });
    } else {
        // Hinzufügen-Modus: Standardwerte setzen
        document.getElementById('notification-active').checked = true;
    }

    const saveButton = document.getElementById('saveNotificationBtn');
    
    const saveHandler = () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const selectedRoles = ROLES.filter(role => document.getElementById(`role-${role}`).checked);

        const data = {
            id: document.getElementById('notification-id').value || undefined,
            title: document.getElementById('notification-title').value,
            message: document.getElementById('notification-message').value,
            trigger: document.getElementById('notification-trigger').value,
            triggerValue: document.getElementById('notification-triggerValue').value || null,
            targetRoles: selectedRoles,
            active: document.getElementById('notification-active').checked
        };
        
        onSave(data);
        modal.hide();
    };
    
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);
    newSaveButton.addEventListener('click', saveHandler);
    
    modal.show();
}

/**
 * Rendert die UI zur Verwaltung von Benachrichtigungen.
 * @param {HTMLElement} container - Der Container, in den die UI gerendert wird.
 * @param {Array<object>} notifications - Die Liste der Benachrichtigungen.
 * @param {object} callbacks - Die Callback-Funktionen { onAdd, onEdit, onDelete }.
 */
export function renderNotificationsUI(container, notifications, callbacks) {
    container.innerHTML = `
        <div class="card shadow-sm rounded-0">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Gespeicherte Benachrichtigungen</h5>
                <button class="btn btn-primary btn-sm" id="addNotificationBtn">
                    <i class="bi bi-plus-lg me-1"></i> Neue Benachrichtigung
                </button>
            </div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Titel</th>
                                <th>Typ</th>
                                <th>Zielgruppe</th>
                                <th>Status</th>
                                <th class="text-end">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody id="notifications-list-container"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="modal fade" id="notificationModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Benachrichtigung bearbeiten</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="notificationForm">
                            <input type="hidden" id="notification-id">
                            <div class="mb-3">
                                <label for="notification-title" class="form-label">Titel</label>
                                <input type="text" class="form-control" id="notification-title" required>
                            </div>
                            <div class="mb-3">
                                <label for="notification-message" class="form-label">Nachricht</label>
                                <textarea class="form-control" id="notification-message" rows="3" required></textarea>
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="notification-trigger" class="form-label">Auslöser (Trigger)</label>
                                    <select class="form-select" id="notification-trigger">
                                        <option value="onLogin">Bei jedem Login</option>
                                        <option value="interval">An einem bestimmten Tag</option>
                                        <option value="once">Einmalig (nach Erstellung)</option>
                                    </select>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="notification-triggerValue" class="form-label">Wert für Trigger (optional)</label>
                                    <input type="text" class="form-control" id="notification-triggerValue" placeholder="z.B. 26 für den 26. des Monats">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Ziel-Rollen</label>
                                <div class="p-2 border rounded" style="max-height: 150px; overflow-y: auto;">
                                    ${ROLES.map(role => `
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" value="${role}" id="role-${role}">
                                            <label class="form-check-label" for="role-${role}">${role}</label>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                             <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" role="switch" id="notification-active" checked>
                                <label class="form-check-label" for="notification-active">Benachrichtigung ist aktiv</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
                        <button type="button" class="btn btn-primary" id="saveNotificationBtn">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const listContainer = container.querySelector('#notifications-list-container');
    listContainer.innerHTML = '';
    if (notifications.length > 0) {
        notifications.forEach(n => listContainer.appendChild(createNotificationRow(n, callbacks)));
    } else {
        listContainer.innerHTML = '<tr><td colspan="5" class="text-center p-4">Keine Benachrichtigungen gefunden.</td></tr>';
    }

    container.querySelector('#addNotificationBtn').addEventListener('click', () => {
        callbacks.onAdd();
    });
} 