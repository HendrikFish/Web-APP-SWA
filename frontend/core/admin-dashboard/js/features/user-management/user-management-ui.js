/*
 * Siehe _FUNKTIONSWEISE.md für weitere Informationen zu diesem Feature.
 *
 * Verantwortlich für die Darstellung der Benutzerverwaltung im DOM.
 */

import { Modal } from 'bootstrap';
import { renderDynamicFormFields, collectDynamicFieldValues } from '@shared/components/dynamic-form/form-builder.js';
import customFieldsConfig from '@shared/config/custom-fields.json';

/**
 * Erstellt eine einzelne Zeile für die Benutzertabelle.
 * @param {object} user - Das Benutzerobjekt.
 * @returns {HTMLTableRowElement} Die DOM-Element für die Tabellenzeile.
 */
function createUserRow(user) {
    const tr = document.createElement('tr');
    
    const statusBadge = user.isApproved 
        ? '<span class="badge bg-success">Genehmigt</span>'
        : '<span class="badge bg-warning">Ausstehend</span>';

    tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.firstName}</td>
        <td>${user.lastName}</td>
        <td>${user.email}</td>
        <td>${user.roles.join(', ')}</td>
        <td>${statusBadge}</td>
        <td>
            <button class="btn btn-light btn-sm border" title="Bearbeiten"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-light btn-sm border text-danger" title="Löschen"><i class="bi bi-trash"></i></button>
        </td>
    `;
    return tr;
}

/**
 * Rendert die vollständige Benutzertabelle in den angegebenen Container.
 * @param {HTMLElement} container - Das DOM-Element, in das die Tabelle gerendert werden soll.
 * @param {Array<object>} users - Ein Array von Benutzerobjekten.
 * @param {Function} onDelete - Callback-Funktion, die mit der User-ID aufgerufen wird, wenn ein Benutzer gelöscht werden soll.
 * @param {Function} onEdit - Callback-Funktion, die mit der User-ID aufgerufen wird, wenn ein Benutzer bearbeitet werden soll.
 */
export function renderUserTable(container, users, onDelete, onEdit) {
    if (!container) {
        console.error("Container für die Benutzertabelle nicht gefunden.");
        return;
    }

    // Leeren Container vorbereiten
    container.innerHTML = '';

    // Card-Struktur erstellen
    const card = document.createElement('div');
    // .rounded-0 für einen "schärferen" Look
    card.className = 'card shadow-sm rounded-0'; 

    const cardHeader = document.createElement('div');
    cardHeader.className = 'card-header d-flex justify-content-between align-items-center';
    cardHeader.innerHTML = `
        <h5 class="mb-0">Benutzerliste</h5>
        <button class="btn btn-primary btn-sm">
            <i class="bi bi-plus-lg me-1"></i> Neuen Benutzer anlegen
        </button>
    `;

    const cardBody = document.createElement('div');
    // Kein Padding am Card-Body, damit die Tabelle bündig abschließt
    cardBody.className = 'card-body p-0'; 

    // 1. Desktop-Ansicht (Tabelle) - sichtbar ab "md" Breakpoint
    const desktopView = document.createElement('div');
    desktopView.className = 'd-none d-md-block'; // WICHTIG: Auf kleinen Screens ausblenden
    
    const tableResponsive = document.createElement('div');
    tableResponsive.className = 'table-responsive';

    const table = document.createElement('table');
    table.className = 'table table-hover mb-0'; // mb-0, da der Abstand von der Card kommt
    
    // Testdaten aus dem Backend verwenden
    const userRows = users.map(user => `
        <tr>
            <td>${user._id.slice(-6)}</td>
            <td>${user.firstName} ${user.lastName}</td>
            <td><span class="badge bg-secondary">${Array.isArray(user.roles) ? user.roles.join(', ') : user.role}</span></td>
            <td class="text-end">
                <!-- Neutrale Buttons mit Rand für einen sauberen Look -->
                <button class="btn btn-light btn-sm border" title="Benutzer bearbeiten" data-user-id="${user._id}" data-action="edit">
                    <i class="bi bi-pencil" data-user-id="${user._id}" data-action="edit"></i>
                </button>
                <button class="btn btn-light btn-sm border text-danger" title="Benutzer löschen" data-user-id="${user._id}" data-action="delete">
                    <i class="bi bi-trash" data-user-id="${user._id}" data-action="delete"></i>
                </button>
            </td>
        </tr>
    `).join('');

    table.innerHTML = `
        <thead class="table-light">
            <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Rolle</th>
                <th scope="col" class="text-end">Aktionen</th>
            </tr>
        </thead>
        <tbody>
            ${userRows.length > 0 ? userRows : '<tr><td colspan="4" class="text-center p-4">Keine Benutzer gefunden.</td></tr>'}
        </tbody>
    `;

    tableResponsive.appendChild(table);
    desktopView.appendChild(tableResponsive);

    // 2. Mobile-Ansicht (Karten) - sichtbar nur unter "md" Breakpoint
    const mobileView = document.createElement('div');
    mobileView.className = 'd-md-none'; // WICHTIG: Auf großen Screens ausblenden
    
    const userListGroup = document.createElement('div');
    userListGroup.className = 'list-group list-group-flush';

    if (users.length > 0) {
        users.forEach(user => {
            const userCard = document.createElement('div');
            userCard.className = 'list-group-item';
            userCard.innerHTML = `
                <div class="d-flex w-100 justify-content-between">
                    <h6 class="mb-1">${user.firstName} ${user.lastName}</h6>
                    <small class="text-muted">ID: ${user._id.slice(-6)}</small>
                </div>
                <p class="mb-1">
                    <span class="badge bg-secondary">${Array.isArray(user.roles) ? user.roles.join(', ') : user.role}</span>
                </p>
                <div class="mt-2 text-end">
                    <button class="btn btn-light btn-sm border" title="Benutzer bearbeiten">
                        <i class="bi bi-pencil me-1"></i> Bearbeiten
                    </button>
                    <button class="btn btn-light btn-sm border text-danger" title="Benutzer löschen">
                        <i class="bi bi-trash me-1"></i> Löschen
                    </button>
                </div>
            `;
            userListGroup.appendChild(userCard);
        });
    } else {
         userListGroup.innerHTML = '<div class="list-group-item text-center p-4">Keine Benutzer gefunden.</div>';
    }

    mobileView.appendChild(userListGroup);

    cardBody.appendChild(desktopView);
    cardBody.appendChild(mobileView);
    
    card.appendChild(cardHeader);
    card.appendChild(cardBody);
    container.appendChild(card);

    // Edit Modal HTML
    const modalHtml = `
    <div class="modal fade" id="editUserModal" tabindex="-1" aria-labelledby="editUserModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="editUserModalLabel">Benutzer bearbeiten</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="editUserForm">
              <input type="hidden" id="edit-userId">
              <div class="mb-3">
                <label for="edit-firstName" class="form-label">Vorname</label>
                <input type="text" class="form-control" id="edit-firstName" required>
              </div>
              <div class="mb-3">
                <label for="edit-lastName" class="form-label">Nachname</label>
                <input type="text" class="form-control" id="edit-lastName" required>
              </div>
              <div class="mb-3">
                <label for="edit-email" class="form-label">E-Mail</label>
                <input type="email" class="form-control" id="edit-email" required>
              </div>
              <div id="dynamic-edit-fields">
                <!-- Dynamische Felder werden hier per JavaScript eingefügt -->
              </div>
              <div class="mb-3">
                <label for="edit-role" class="form-label">Rolle</label>
                <select class="form-select" id="edit-role" required>
                  <option value="admin">Admin</option>
                  <option value="co-admin">Co-Admin</option>
                  <option value="Koch">Koch</option>
                  <option value="Service">Service</option>
                  <option value="Stock">Stock</option>
                  <option value="Schule">Schule</option>
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="LH">LH</option>
                  <option value="TZ">TZ</option>
                  <option value="ER">ER</option>
                  <option value="extern">Extern</option>
                </select>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
            <button type="button" id="saveUserChangesBtn" class="btn btn-primary">Änderungen speichern</button>
          </div>
        </div>
      </div>
    </div>
    `;
    container.insertAdjacentHTML('beforeend', modalHtml);

    // Event-Listener
    container.addEventListener('click', (event) => {
        const target = event.target.closest('[data-user-id]');
        if (!target) return;

        const userId = target.dataset.userId;
        const action = target.dataset.action;
        const userToActOn = users.find(u => u._id === userId);

        if (!userToActOn) return;

        if (action === 'delete') {
            if (confirm(`Sind Sie sicher, dass Sie den Benutzer ${userToActOn.firstName} ${userToActOn.lastName} löschen möchten?`)) {
                onDelete(userId);
            }
        } else if (action === 'edit') {
            onEdit(userToActOn);
        }
    });
}

/**
 * Zeigt das Bearbeiten-Modal an und füllt es mit den Benutzerdaten.
 * @param {object} user - Das Benutzerobjekt, das bearbeitet werden soll.
 * @param {Function} onSave - Callback, der mit der User-ID und den neuen Daten aufgerufen wird.
 */
export function showEditModal(user, onSave) {
    const modalElement = document.getElementById('editUserModal');
    if (!modalElement || !user) {
        console.error("Modal oder Benutzer für Bearbeitung nicht gefunden.", { user });
        return;
    }

    // Statische Felder füllen
    modalElement.querySelector('#edit-userId').value = user._id;
    modalElement.querySelector('#edit-firstName').value = user.firstName;
    modalElement.querySelector('#edit-lastName').value = user.lastName;
    modalElement.querySelector('#edit-email').value = user.email;
    modalElement.querySelector('#edit-role').value = user.role;
    
    // Dynamische Felder rendern
    const dynamicFieldsContainer = modalElement.querySelector('#dynamic-edit-fields');
    renderDynamicFormFields(dynamicFieldsContainer, customFieldsConfig, user.customFields);

    // Modal-Instanz holen und anzeigen
    const modal = Modal.getOrCreateInstance(modalElement);
    modal.show();

    // Event-Listener für Speichern-Button (neu erstellen, um Duplikate zu vermeiden)
    const saveButton = document.getElementById('saveUserChangesBtn');
    const newSaveButton = saveButton.cloneNode(true);
    saveButton.parentNode.replaceChild(newSaveButton, saveButton);

    const saveHandler = () => {
        const form = document.getElementById('editUserForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const updatedData = {
            firstName: document.getElementById('edit-firstName').value,
            lastName: document.getElementById('edit-lastName').value,
            email: document.getElementById('edit-email').value,
            role: document.getElementById('edit-role').value,
            customFields: collectDynamicFieldValues(dynamicFieldsContainer, customFieldsConfig)
        };

        onSave(user._id, updatedData);
        modal.hide();
    };
    
    newSaveButton.addEventListener('click', saveHandler);
} 