// informationen-modal-ui.js - UI-Management für Informations-Modal
// Verwaltet Modal-DOM, Anzeige-Modi und UI-Utilities

import { createLogger } from './debug-logger.js';

// Debug-Logger für dieses Modul
const logger = createLogger('info-modal-ui');

/**
 * Erstellt das Modal-HTML falls nicht vorhanden
 */
export function createModalHTML() {
    if (document.getElementById('information-modal')) {
        logger.info('Modal-HTML bereits vorhanden');
        return;
    }
    
    logger.info('Erstelle Modal-HTML');
    
    const modalHTML = `
        <div id="information-modal" class="information-modal">
            <div class="information-modal-overlay" onclick="closeInformationModal()"></div>
            <div class="information-modal-content">
                <div class="information-modal-header">
                    <h3 id="information-modal-title">Information erstellen</h3>
                    <button type="button" class="information-modal-close" onclick="closeInformationModal()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="information-modal-body">
                    <div class="information-info">
                        <div class="information-tag-datum">
                            <strong>Tag:</strong>
                            <span id="information-tag-datum">Tag, Datum</span>
                        </div>
                    </div>
                    
                    <!-- Übersichts-Sektion für bestehende Informationen -->
                    <div id="information-overview" class="information-overview" style="display: none;">
                        <div class="information-overview-header">
                            <h4>
                                <i class="bi bi-info-circle-fill text-primary"></i>
                                Bestehende Informationen
                            </h4>
                            <button type="button" class="btn btn-primary btn-sm" onclick="switchToNewForm()">
                                <i class="bi bi-plus-lg"></i> Neue Information
                            </button>
                        </div>
                        <div id="information-list" class="information-list">
                            <!-- Informationen werden hier geladen -->
                        </div>
                    </div>
                    
                    <!-- Formular-Sektion -->
                    <div id="information-form-section" class="information-form-section">
                        <form id="information-form" class="information-form">
                            <!-- Titel -->
                            <div class="information-field">
                                <label for="information-titel">
                                    <i class="bi bi-card-heading text-primary"></i>
                                    Titel <span class="required">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="information-titel" 
                                    name="titel"
                                    class="form-control"
                                    placeholder="Kurzer, aussagekräftiger Titel"
                                    required
                                    minlength="3"
                                    maxlength="100">
                            </div>
                            
                            <!-- Priorität -->
                            <div class="information-field">
                                <label for="information-prioritaet">
                                    <i class="bi bi-exclamation-triangle text-warning"></i>
                                    Priorität
                                </label>
                                <select id="information-prioritaet" name="prioritaet" class="form-control">
                                    <option value="niedrig">Niedrig</option>
                                    <option value="normal" selected>Normal</option>
                                    <option value="hoch">Hoch</option>
                                    <option value="kritisch">Kritisch</option>
                                </select>
                            </div>
                            
                            <!-- Inhalt -->
                            <div class="information-field">
                                <label for="information-inhalt">
                                    <i class="bi bi-card-text text-success"></i>
                                    Inhalt <span class="required">*</span>
                                </label>
                                <textarea 
                                    id="information-inhalt" 
                                    name="inhalt"
                                    rows="6"
                                    class="form-control"
                                    placeholder="Detaillierte Beschreibung..."
                                    required
                                    minlength="10"
                                    maxlength="2000"></textarea>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="information-modal-footer">
                    <div id="overview-footer" class="overview-footer" style="display: none;">
                        <button type="button" class="btn btn-secondary" onclick="closeInformationModal()">
                            <i class="bi bi-x-lg"></i> Schließen
                        </button>
                    </div>
                    <div id="form-footer" class="form-footer">
                        <button type="button" class="btn btn-secondary" onclick="backToOverview()">
                            <i class="bi bi-arrow-left"></i> Zurück
                        </button>
                        <button type="button" class="btn btn-primary" id="information-submit-btn" onclick="submitInformation()">
                            <i class="bi bi-plus-lg"></i>
                            Information erstellen
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    logger.success('Modal-HTML erfolgreich erstellt');
}

/**
 * Zeigt das Modal an
 */
export function showModal() {
    const modal = document.getElementById('information-modal');
    if (!modal) {
        logger.error('Modal-Element nicht gefunden');
        return;
    }
    
    logger.info('Zeige Modal an');
    modal.style.display = 'flex';
    
    // Mobile: Body-Overflow nur auf Desktop blockieren
    if (window.innerWidth > 768) {
        document.body.style.overflow = 'hidden';
    } else {
        // Mobile: Body-Scrolling erlauben für bessere Touch-Erfahrung
        document.body.style.overflow = 'auto';
        // Prevent scroll-behind für Hintergrund-Content
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.top = `-${window.scrollY}px`;
        // Scroll-Position für später speichern
        modal.setAttribute('data-scroll-y', window.scrollY.toString());
    }
    
    // Focus auf erstes Input
    setTimeout(() => {
        const titelField = document.getElementById('information-titel');
        if (titelField) {
            titelField.focus();
        }
    }, 100);
}

/**
 * Versteckt das Modal
 */
export function hideModal() {
    const modal = document.getElementById('information-modal');
    if (!modal) {
        return;
    }
    
    logger.info('Verstecke Modal');
    modal.style.display = 'none';
    
    // Mobile: Body-Position und Scroll wiederherstellen
    if (window.innerWidth <= 768) {
        const scrollY = modal.getAttribute('data-scroll-y') || '0';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        document.body.style.overflow = 'auto';
        window.scrollTo(0, parseInt(scrollY));
    } else {
        document.body.style.overflow = 'auto';
    }
}

/**
 * Wechselt zum Übersichts-Modus
 */
export function showOverviewMode() {
    logger.info('Wechsle zu Übersichts-Modus');
    
    // Übersicht anzeigen, Formular verstecken
    const overview = document.getElementById('information-overview');
    const formSection = document.getElementById('information-form-section');
    const overviewFooter = document.getElementById('overview-footer');
    const formFooter = document.getElementById('form-footer');
    
    if (overview) overview.style.display = 'block';
    if (formSection) formSection.style.display = 'none';
    if (overviewFooter) overviewFooter.style.display = 'block';
    if (formFooter) formFooter.style.display = 'none';
}

/**
 * Wechselt zum Formular-Modus
 */
export function showFormMode() {
    logger.info('Wechsle zu Formular-Modus');
    
    // Formular anzeigen, Übersicht verstecken
    const overview = document.getElementById('information-overview');
    const formSection = document.getElementById('information-form-section');
    const overviewFooter = document.getElementById('overview-footer');
    const formFooter = document.getElementById('form-footer');
    
    if (overview) overview.style.display = 'none';
    if (formSection) formSection.style.display = 'block';
    if (overviewFooter) overviewFooter.style.display = 'none';
    if (formFooter) formFooter.style.display = 'block';
}

/**
 * Setzt das Modal-Formular zurück
 */
export function resetModalForm() {
    logger.info('Setze Modal-Formular zurück');
    
    const titelField = document.getElementById('information-titel');
    const inhaltField = document.getElementById('information-inhalt');
    const prioritaetField = document.getElementById('information-prioritaet');
    const submitBtn = document.getElementById('information-submit-btn');
    
    if (titelField) titelField.value = '';
    if (inhaltField) inhaltField.value = '';
    if (prioritaetField) prioritaetField.value = 'normal';
    if (submitBtn) submitBtn.disabled = false;
}

/**
 * Füllt das Formular mit bestehenden Daten
 * @param {object} information - Information-Objekt
 */
export function fillFormWithData(information) {
    logger.info('Fülle Formular mit Daten', { id: information.id, titel: information.titel });
    
    const titelField = document.getElementById('information-titel');
    const inhaltField = document.getElementById('information-inhalt');
    const prioritaetField = document.getElementById('information-prioritaet');
    
    if (titelField) titelField.value = information.titel || '';
    if (inhaltField) inhaltField.value = information.inhalt || '';
    if (prioritaetField) prioritaetField.value = information.prioritaet || 'normal';
}

/**
 * Setzt Modal-Titel und Submit-Button
 * @param {string} title - Modal-Titel
 * @param {string} buttonText - Submit-Button-Text
 * @param {string} buttonIcon - Submit-Button-Icon
 */
export function setModalLabels(title, buttonText, buttonIcon = 'plus-lg') {
    const modalTitle = document.getElementById('information-modal-title');
    const submitBtn = document.getElementById('information-submit-btn');
    
    if (modalTitle) modalTitle.textContent = title;
    if (submitBtn) {
        submitBtn.innerHTML = `<i class="bi bi-${buttonIcon}"></i> ${buttonText}`;
    }
}

/**
 * Setzt die Tag-Datum-Anzeige
 * @param {string} tagText - Text für Tag und Datum
 */
export function setTagDatum(tagText) {
    const tagDatumElement = document.getElementById('information-tag-datum');
    if (tagDatumElement) {
        tagDatumElement.textContent = tagText;
    }
}

/**
 * Hilfsfunktion: Ermittelt den Tag-Key aus einem DOM-Element
 * @param {HTMLElement} element - DOM-Element
 * @returns {string|null} Tag-Key
 */
export function getDayFromElement(element) {
    // Verschiedene Wege versuchen, den Tag zu finden
    let dayKey = element.getAttribute('data-day');
    if (dayKey) return dayKey;
    
    // Falls in Accordion-Structure
    const accordionItem = element.closest('.accordion-item');
    if (accordionItem) {
        dayKey = accordionItem.getAttribute('data-day');
        if (dayKey) return dayKey;
    }
    
    // Falls in Desktop-Grid
    const dayCard = element.closest('.day-card');
    if (dayCard) {
        dayKey = dayCard.getAttribute('data-day');
        if (dayKey) return dayKey;
    }
    
    return null;
}

/**
 * Hilfsfunktion: Ermittelt den Kategorie-Key aus einem DOM-Element
 * @param {HTMLElement} element - DOM-Element
 * @returns {string|null} Kategorie-Key
 */
export function getCategoryFromElement(element) {
    // Verschiedene Wege versuchen, die Kategorie zu finden
    let categoryKey = element.getAttribute('data-category');
    if (categoryKey) return categoryKey;
    
    // Falls in Category-Section
    const categorySection = element.closest('.category-section');
    if (categorySection) {
        categoryKey = categorySection.getAttribute('data-category');
        if (categoryKey) return categoryKey;
    }
    
    return null;
}

/**
 * Formatiert einen Tag-Key zu einem lesbaren Namen
 * @param {string} tagKey - Tag-Key (montag, dienstag, ...)
 * @returns {string} Lesbarer Tag-Name
 */
export function getTagName(tagKey) {
    const tagNamen = {
        'montag': 'Montag',
        'dienstag': 'Dienstag',
        'mittwoch': 'Mittwoch',
        'donnerstag': 'Donnerstag',
        'freitag': 'Freitag',
        'samstag': 'Samstag',
        'sonntag': 'Sonntag'
    };
    
    return tagNamen[tagKey] || tagKey;
}

/**
 * Formatiert ein Datum für die Anzeige
 * @param {Date} date - Datum
 * @returns {string} Formatiertes Datum
 */
export function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
} 