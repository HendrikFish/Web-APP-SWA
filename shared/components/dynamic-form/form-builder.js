/**
 * @module form-builder
 * @description Stellt Funktionen zur dynamischen Erstellung von HTML-Formularen basierend auf einer Konfiguration bereit.
 */

/**
 * Erstellt und rendert dynamische Formularfelder in einen gegebenen Container.
 * @param {HTMLElement} container - Das DOM-Element, in das die Felder eingefügt werden sollen.
 * @param {Array<object>} config - Die Konfiguration der zu erstellenden Felder (z.B. aus custom-fields.json).
 * @param {object} [data={}] - Ein optionales Objekt mit bereits vorhandenen Daten, um die Felder vorab auszufüllen.
 */
export function renderDynamicFormFields(container, config, data = {}) {
    if (!container || !config) return;

    container.innerHTML = ''; // Vorherige Felder leeren

    config.forEach(field => {
        const fieldGroup = document.createElement('div');
        fieldGroup.className = 'mb-3';

        const label = document.createElement('label');
        label.htmlFor = `dynamic-${field.id}`;
        label.className = 'form-label';
        label.textContent = field.label;

        if (field.required) {
            const requiredSpan = document.createElement('span');
            requiredSpan.className = 'text-danger';
            requiredSpan.textContent = ' *';
            label.appendChild(requiredSpan);
        }

        const input = document.createElement('input');
        input.type = field.type;
        input.className = 'form-control';
        input.id = `dynamic-${field.id}`;
        input.dataset.fieldId = field.id;
        input.value = data[field.id] || '';
        input.placeholder = field.placeholder || '';
        
        if (field.required) {
            input.required = true;
        }
        
        fieldGroup.appendChild(label);
        fieldGroup.appendChild(input);
        container.appendChild(fieldGroup);
    });
}

/**
 * Sammelt die Werte aus den dynamisch erstellten Formularfeldern.
 * @param {HTMLElement} container - Der Container, der die dynamischen Felder umschließt.
 * @returns {object} Ein Objekt, das die Feld-IDs auf ihre Werte abbildet.
 */
export function collectDynamicFieldValues(container) {
    const values = {};
    if (!container) return values;

    container.querySelectorAll('input[data-field-id]').forEach(input => {
        values[input.dataset.fieldId] = input.value;
    });

    return values;
} 