import { Modal } from 'bootstrap';

/**
 * Erstellt eine Zeile für die Feld-Liste.
 * @param {object} field - Das Feld-Objekt.
 * @returns {string} - Der HTML-String für die Zeile.
 */
function createFieldRow(field) {
    return `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            <div>
                <strong class="me-2">${field.label}</strong>
                <span class="badge bg-secondary me-2">${field.type}</span>
                ${field.required ? '<span class="badge bg-info">Pflichtfeld</span>' : ''}
            </div>
            <div>
                <button class="btn btn-light btn-sm border me-2" data-action="edit" data-field-id="${field.id}"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-light btn-sm border text-danger" data-action="delete" data-field-id="${field.id}"><i class="bi bi-trash"></i></button>
            </div>
        </li>
    `;
}

/**
 * Rendert nur die Liste der Felder neu.
 * @param {HTMLElement} listContainer - Der `<ul>`-Container.
 * @param {Array<object>} fields - Die aktuelle Liste der Felder.
 */
export function renderFieldList(listContainer, fields) {
    if (!listContainer) return;

    // Alte Knoten sicher entfernen
    while (listContainer.firstChild) {
        listContainer.removeChild(listContainer.firstChild);
    }

    if (fields.length === 0) {
        const emptyItem = document.createElement('li');
        emptyItem.className = 'list-group-item text-center text-muted';
        emptyItem.textContent = 'Keine Felder konfiguriert.';
        listContainer.appendChild(emptyItem);
        return;
    }

    // Neue Knoten erstellen und hinzufügen
    fields.forEach(field => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = createFieldRow(field).trim();
        listContainer.appendChild(tempDiv.firstChild);
    });
}

function setupAndShowModal(modalElement, field, onSave) {
    const form = modalElement.querySelector('#fieldConfigForm');
    const saveButton = modalElement.querySelector('#saveFieldBtn');
    const modalTitle = modalElement.querySelector('.modal-title');
    const modal = new Modal(modalElement);
    
    // Reset form for new display
    form.reset();
    modalTitle.textContent = field ? 'Feld bearbeiten' : 'Neues Feld erstellen';
    
    if (field) {
        form.querySelector('#field-id').value = field.id;
        form.querySelector('#field-label').value = field.label;
        form.querySelector('#field-type').value = field.type;
        form.querySelector('#field-required').checked = field.required;
        form.querySelector('#field-id').disabled = true; 
    } else {
        form.querySelector('#field-id').disabled = false;
    }

    const saveHandler = () => {
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const fieldData = {
            id: form.querySelector('#field-id').value,
            label: form.querySelector('#field-label').value,
            type: form.querySelector('#field-type').value,
            required: form.querySelector('#field-required').checked
        };
        
        onSave(fieldData, field ? field.id : null);
        modal.hide();
    };

    saveButton.addEventListener('click', saveHandler, { once: true });

    modal.show();
}

/**
 * Rendert die komplette UI für die Feld-Konfiguration beim ersten Laden.
 * Hängt Event-Listener an, die nur einmal benötigt werden.
 * @param {HTMLElement} container - Der Container, in den die UI gerendert wird.
 * @param {Array<object>} initialFields - Die anfängliche Liste der Felder.
 * @param {object} callbacks - Ein Objekt mit den Callbacks { onAdd, onEdit, onDelete }.
 */
export function renderFieldConfigurator(container, initialFields, callbacks) {
    container.innerHTML = `
        <div class="card shadow-sm rounded-0">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Konfigurierte Felder</h5>
                <button class="btn btn-primary btn-sm" id="addFieldBtn"><i class="bi bi-plus-lg me-1"></i> Feld hinzufügen</button>
            </div>
            <div class="card-body">
                <ul class="list-group" id="field-list-container"></ul>
            </div>
        </div>

        <div class="modal fade" id="fieldConfigModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Feld</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="fieldConfigForm">
                            <div class="mb-3">
                                <label for="field-id" class="form-label">Feld-ID (eindeutig)</label>
                                <input type="text" class="form-control" id="field-id" required pattern="[a-zA-Z0-9_]+">
                            </div>
                            <div class="mb-3">
                                <label for="field-label" class="form-label">Anzeigetext (Label)</label>
                                <input type="text" class="form-control" id="field-label" required>
                            </div>
                            <div class="mb-3">
                                <label for="field-type" class="form-label">Feld-Typ</label>
                                <select class="form-select" id="field-type">
                                    <option value="text">Text</option>
                                    <option value="email">E-Mail</option>
                                    <option value="tel">Telefon</option>
                                    <option value="number">Zahl</option>
                                    <option value="date">Datum</option>
                                </select>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="checkbox" id="field-required">
                                <label class="form-check-label" for="field-required">Pflichtfeld</label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Abbrechen</button>
                        <button type="button" id="saveFieldBtn" class="btn btn-primary">Speichern</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    const listContainer = container.querySelector('#field-list-container');
    const modalElement = container.querySelector('#fieldConfigModal');

    container.querySelector('#addFieldBtn').addEventListener('click', () => {
        setupAndShowModal(modalElement, null, callbacks.onSave);
    });

    listContainer.addEventListener('click', (event) => {
        const button = event.target.closest('button[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const fieldId = button.dataset.fieldId;
        const field = callbacks.getFields().find(f => f.id === fieldId);

        if (!field) return;

        if (action === 'edit') {
            setupAndShowModal(modalElement, field, callbacks.onSave);
        } else if (action === 'delete') {
            if (confirm(`Sind Sie sicher, dass Sie das Feld "${field.label}" löschen möchten?`)) {
                callbacks.onDelete(fieldId);
            }
        }
    });

    renderFieldList(listContainer, initialFields);
} 