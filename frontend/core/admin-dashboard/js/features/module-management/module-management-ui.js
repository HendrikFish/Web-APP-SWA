/**
 * @module module-management-ui
 * @description Enthält die UI-Logik für die Verwaltung von Modulberechtigungen.
 */

/**
 * Rendert die Benutzeroberfläche zur Verwaltung der Modulberechtigungen.
 * @param {HTMLElement} container - Das DOM-Element, in das die UI gerendert wird.
 * @param {Array<object>} modules - Die Liste der verfügbaren Module aus der Konfigurationsdatei.
 * @param {Array<string>} roles - Die Liste aller verfügbaren Benutzerrollen.
 * @param {object} callbacks - Ein Objekt mit Callbacks, z.B. { onSave }.
 */
export function renderModuleManagementUI(container, modules, roles, callbacks) {
    if (!container) return;

    let modulesHTML = modules.map(module => `
        <div class="card mb-3">
            <div class="card-header">
                <h5 class="mb-0">
                    <i class="bi ${module.icon} me-2"></i>
                    ${module.name}
                </h5>
            </div>
            <div class="card-body">
                <p class="card-text">${module.description}</p>
                <div class="form-group" data-module-id="${module.id}">
                    <label class="form-label">Sichtbar für folgende Rollen:</label>
                    <div class="d-flex flex-wrap gap-3 mt-2">
                        ${roles.map(role => `
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" value="${role}" id="role-${module.id}-${role}"
                                    ${module.roles.includes(role) ? 'checked' : ''}>
                                <label class="form-check-label" for="role-${module.id}-${role}">
                                    ${role}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div id="module-management-container">
            ${modulesHTML}
        </div>
        <div class="mt-4">
            <button id="save-module-roles-btn" class="btn btn-primary">
                <i class="bi bi-save me-2"></i>
                Berechtigungen speichern
            </button>
        </div>
    `;

    // Event-Listener für den Speichern-Button
    const saveButton = document.getElementById('save-module-roles-btn');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const updatedModules = modules.map(module => {
                const roleCheckboxes = container.querySelectorAll(`[data-module-id="${module.id}"] .form-check-input`);
                const selectedRoles = Array.from(roleCheckboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.value);
                return { ...module, roles: selectedRoles };
            });
            callbacks.onSave(updatedModules);
        });
    }
} 