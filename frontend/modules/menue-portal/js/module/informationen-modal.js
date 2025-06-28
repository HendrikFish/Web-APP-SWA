// informationen-modal.js - Modal für Informations-Management
// Verwaltet das Modal für das Erstellen, Bearbeiten und Anzeigen von Informationen

import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { 
    createInformation, 
    updateInformation, 
    deleteInformation,
    validateInformationData,
    formatDateForAPI,
    getISOWeek
} from './informationen-api.js';

// Modal-State
let currentInformationData = null;
let isEditMode = false;
let currentUser = null;
let currentEinrichtung = null;

/**
 * Initialisiert das Informations-Modal System
 * @param {object} user - Aktueller Benutzer
 * @param {object} einrichtung - Aktuelle Einrichtung
 */
export function initInformationModal(user, einrichtung) {
    currentUser = user;
    currentEinrichtung = einrichtung;
    
    console.log('📋 Informations-Modal initialisiert für:', user.name, '-', einrichtung.name);
    
    // Modal-HTML erstellen falls nicht vorhanden
    createModalHTML();
    
    // Event-Listener setup
    setupModalEventListeners();
}

/**
 * Öffnet das Modal zur Verwaltung von Informationen für einen Tag
 * @param {string} tag - Wochentag (montag, dienstag, ...)
 * @param {Date} datum - Datum des Tages
 */
export function openInformationManagementModal(tag, datum) {
    isEditMode = false;
    currentInformationData = null;
    
    // Tag-Datum setzen
    document.getElementById('information-tag-datum').textContent = `${getTagName(tag)}, ${formatDate(datum)}`;
    
    // Informationen für diesen Tag laden und anzeigen
    loadAndDisplayInformationen(tag);
    
    // Übersichts-Modus aktivieren
    showOverviewMode();
    
    // Modal anzeigen
    showModal();
}

/**
 * Öffnet das Modal zum Erstellen einer neuen Information
 * @param {string} tag - Wochentag (montag, dienstag, ...)
 * @param {Date} datum - Datum des Tages
 */
export function openNewInformationModal(tag, datum) {
    isEditMode = false;
    currentInformationData = null;
    
    const modalTitle = document.getElementById('information-modal-title');
    const submitBtn = document.getElementById('information-submit-btn');
    
    modalTitle.textContent = 'Neue Information erstellen';
    submitBtn.innerHTML = '<i class="bi bi-plus-lg"></i> Information erstellen';
    
    // Form-Daten setzen
    document.getElementById('information-tag-datum').textContent = `${getTagName(tag)}, ${formatDate(datum)}`;
    
    // Form zurücksetzen
    resetModalForm();
    
    // Formular-Modus aktivieren
    showFormMode();
    
    // Modal anzeigen
    showModal();
}

/**
 * Öffnet das Modal zum Bearbeiten einer existierenden Information
 * @param {object} information - Information-Objekt
 * @param {string} tag - Wochentag
 * @param {Date} datum - Datum
 */
export function openEditInformationModal(information, tag, datum) {
    isEditMode = true;
    currentInformationData = information;
    
    const modalTitle = document.getElementById('information-modal-title');
    const submitBtn = document.getElementById('information-submit-btn');
    
    modalTitle.textContent = 'Information bearbeiten';
    submitBtn.innerHTML = '<i class="bi bi-pencil-square"></i> Information aktualisieren';
    
    // Form-Daten setzen
    document.getElementById('information-tag-datum').textContent = `${getTagName(tag)}, ${formatDate(datum)}`;
    
    // Form mit bestehenden Daten füllen
    fillFormWithData(information);
    
    // Formular-Modus aktivieren
    showFormMode();
    
    // Modal anzeigen
    showModal();
}

/**
 * Schließt das Informations-Modal
 */
export function closeInformationModal() {
    const modal = document.getElementById('information-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // State zurücksetzen
    currentInformationData = null;
    isEditMode = false;
    resetModalForm();
    
    // Button-Zustände zurücksetzen
    resetInformationButtonStates();
}

/**
 * Setzt alle Informations-Button-Zustände zurück
 */
function resetInformationButtonStates() {
    // Alle hervorgehobenen Informations-Buttons zurücksetzen
    const highlightedButtons = document.querySelectorAll('.information-btn.has-info, .information-btn-desktop.has-info');
    highlightedButtons.forEach(button => {
        // Prüfe ob der Button wirklich Informationen hat, indem wir die aktuellen Daten prüfen
        const categoryElement = button.closest('.category-section, .grid-content-cell');
        if (categoryElement) {
            const dayKey = categoryElement.getAttribute('data-day') || getDayFromElement(categoryElement);
            const categoryKey = categoryElement.getAttribute('data-category') || getCategoryFromElement(categoryElement);
            
            if (dayKey && categoryKey) {
                // Prüfe ob wirklich Informationen vorhanden sind
                const informationenData = window.currentInformationenData || {};
                const tagInformationen = informationenData[dayKey] || [];
                const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
                
                if (activeInformationen.length === 0) {
                    button.classList.remove('has-info');
                }
            }
        }
    });
    
    // Eventuelle Fokus-Hervorhebungen entfernen
    const focusedElements = document.querySelectorAll('.information-focus, .information-highlight');
    focusedElements.forEach(element => {
        element.classList.remove('information-focus', 'information-highlight');
    });
}

/**
 * Hilfsfunktion: Ermittelt den Tag-Key aus einem DOM-Element
 */
function getDayFromElement(element) {
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
 */
function getCategoryFromElement(element) {
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
 * Erstellt das Modal-HTML falls nicht vorhanden
 */
function createModalHTML() {
    if (document.getElementById('information-modal')) {
        return;
    }
    
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
}

/**
 * Setzt Event-Listener für das Modal auf
 */
function setupModalEventListeners() {
    // Globale Funktionen für onclick-Handler verfügbar machen
    window.closeInformationModal = closeInformationModal;
    window.submitInformation = submitInformation;
    window.switchToNewForm = switchToNewForm;
    window.backToOverview = backToOverview;
    window.editInformation = editInformation;
    window.deleteInformation = deleteInformationConfirm;
}

/**
 * Zeigt das Modal an
 */
function showModal() {
    const modal = document.getElementById('information-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus auf erstes Input
        setTimeout(() => {
            document.getElementById('information-titel').focus();
        }, 100);
    }
}

/**
 * Setzt das Modal-Formular zurück
 */
function resetModalForm() {
    document.getElementById('information-titel').value = '';
    document.getElementById('information-inhalt').value = '';
    document.getElementById('information-prioritaet').value = 'normal';
    
    // Submit-Button aktivieren
    document.getElementById('information-submit-btn').disabled = false;
}

/**
 * Sammelt die Formular-Daten und sendet die Information
 */
window.submitInformation = async function() {
    const submitBtn = document.getElementById('information-submit-btn');
    submitBtn.disabled = true;
    
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Wird gespeichert...';
    
    try {
        // Formular-Daten sammeln
        const titel = document.getElementById('information-titel').value.trim();
        const inhalt = document.getElementById('information-inhalt').value.trim();
        const prioritaet = document.getElementById('information-prioritaet').value;
        
        // Tag und Datum aus Modal extrahieren
        const tagDatumText = document.getElementById('information-tag-datum').textContent;
        const [tagName, datumStr] = tagDatumText.split(', ');
        
        // Tag-Name zu Tag-Key konvertieren
        const tagMap = {
            'Montag': 'montag',
            'Dienstag': 'dienstag', 
            'Mittwoch': 'mittwoch',
            'Donnerstag': 'donnerstag',
            'Freitag': 'freitag',
            'Samstag': 'samstag',
            'Sonntag': 'sonntag'
        };
        
        const tag = tagMap[tagName];
        
        // Datum parsen (DD.MM.YYYY)
        const [dayPart, monthPart, yearPart] = datumStr.split('.');
        const datum = new Date(parseInt(yearPart), parseInt(monthPart) - 1, parseInt(dayPart));
        
        const informationData = {
            jahr: datum.getFullYear(),
            kalenderwoche: getISOWeek(datum),
            tag: tag,
            einrichtung_id: currentEinrichtung.id,
            einrichtung_name: currentEinrichtung.name,
            titel,
            inhalt,
            prioritaet
        };
        
        const validation = validateInformationData(informationData);
        if (!validation.isValid) {
            showToast(`Validierungsfehler: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        // Edit- oder Create-Modus
        if (isEditMode && currentInformationData) {
            informationData.id = currentInformationData.id;
            const response = await updateInformation(informationData.id, informationData);
            
            if (response.success) {
                showToast('Information erfolgreich aktualisiert!', 'success');
                
                // Zurück zur Übersicht nach erfolgreicher Bearbeitung
                await loadAndDisplayInformationen(tag);
                showOverviewMode();
                
                // Event emittieren für UI-Update
                window.dispatchEvent(new CustomEvent('informationUpdated', {
                    detail: { 
                        information: response.information,
                        tag: tag,
                        datum: datum
                    }
                }));
            } else {
                showToast(response.message || 'Fehler beim Aktualisieren der Information', 'error');
            }
        } else {
            const response = await createInformation(informationData);
            
            if (response.success) {
                showToast('Information erfolgreich erstellt!', 'success');
                
                // Zurück zur Übersicht nach erfolgreicher Erstellung
                await loadAndDisplayInformationen(tag);
                showOverviewMode();
                
                // Event emittieren für UI-Update
                window.dispatchEvent(new CustomEvent('informationCreated', {
                    detail: { 
                        information: response.information,
                        tag: tag,
                        datum: datum
                    }
                }));
            } else {
                showToast(response.message || 'Fehler beim Erstellen der Information', 'error');
            }
        }
        
    } catch (error) {
        console.error('Fehler beim Speichern der Information:', error);
        showToast('Netzwerkfehler beim Speichern der Information', 'error');
    } finally {
        // Submit-Button wieder aktivieren
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

/**
 * Hilfsfunktion: Konvertiert Tag-Key zu deutschem Namen
 */
function getTagName(tagKey) {
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
 * Hilfsfunktion: Formatiert Datum für Anzeige
 */
function formatDate(date) {
    return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// ===== NEUE FUNKTIONEN FÜR INFORMATIONS-VERWALTUNG =====

/**
 * Lädt und zeigt alle Informationen für einen bestimmten Tag an
 * @param {string} tag - Wochentag (montag, dienstag, ...)
 */
async function loadAndDisplayInformationen(tag) {
    const informationList = document.getElementById('information-list');
    
    try {
        // Globale Informationen-Daten verwenden
        const informationenData = window.currentInformationenData || {};
        const tagInformationen = informationenData[tag] || [];
        
        // Nur aktive (nicht gelöschte) Informationen anzeigen
        const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
        
        if (activeInformationen.length === 0) {
            informationList.innerHTML = `
                <div class="no-informationen">
                    <div class="text-center text-muted p-4">
                        <i class="bi bi-info-circle" style="font-size: 2rem;"></i>
                        <p class="mt-2 mb-0">Keine Informationen für diesen Tag vorhanden.</p>
                        <small>Klicken Sie auf "Neue Information", um eine zu erstellen.</small>
                    </div>
                </div>
            `;
            return;
        }
        
        // Informationen nach Priorität sortieren
        const priorityOrder = { 'kritisch': 4, 'hoch': 3, 'normal': 2, 'niedrig': 1 };
        activeInformationen.sort((a, b) => priorityOrder[b.prioritaet] - priorityOrder[a.prioritaet]);
        
        // HTML für jede Information erstellen
        const informationenHTML = activeInformationen.map(info => `
            <div class="information-item" data-id="${info.id}">
                <div class="information-header">
                    <div class="information-priority priority-${info.prioritaet}">
                        ${getPriorityIcon(info.prioritaet)} ${info.prioritaet.charAt(0).toUpperCase() + info.prioritaet.slice(1)}
                    </div>
                    <div class="information-actions">
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="editInformation('${info.id}')">
                            <i class="bi bi-pencil-square"></i> Bearbeiten
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteInformation('${info.id}')">
                            <i class="bi bi-trash"></i> Löschen
                        </button>
                    </div>
                </div>
                <div class="information-content">
                    <h5 class="information-title">${info.titel}</h5>
                    <p class="information-text">${info.inhalt}</p>
                    <div class="information-meta">
                        <small class="text-muted">
                            <i class="bi bi-person"></i> Erstellt von: ${info.ersteller_name || 'Unbekannt'} |
                            <i class="bi bi-clock"></i> ${new Date(info.erstellt_am).toLocaleString('de-DE')}
                            ${info.aktualisiert_am && info.aktualisiert_am !== info.erstellt_am ? 
                                `| <i class="bi bi-pencil"></i> Bearbeitet: ${new Date(info.aktualisiert_am).toLocaleString('de-DE')}` : ''}
                        </small>
                    </div>
                </div>
            </div>
        `).join('');
        
        informationList.innerHTML = informationenHTML;
        
    } catch (error) {
        console.error('Fehler beim Laden der Informationen:', error);
        informationList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Fehler beim Laden der Informationen: ${error.message}
            </div>
        `;
    }
}

/**
 * Zeigt die Übersichts-Sektion an
 */
function showOverviewMode() {
    document.getElementById('information-overview').style.display = 'block';
    document.getElementById('information-form-section').style.display = 'none';
    document.getElementById('overview-footer').style.display = 'block';
    document.getElementById('form-footer').style.display = 'none';
    
    // Modal-Titel anpassen
    document.getElementById('information-modal-title').textContent = 'Informationen verwalten';
}

/**
 * Zeigt die Formular-Sektion an
 */
function showFormMode() {
    document.getElementById('information-overview').style.display = 'none';
    document.getElementById('information-form-section').style.display = 'block';
    document.getElementById('overview-footer').style.display = 'none';
    document.getElementById('form-footer').style.display = 'block';
}

/**
 * Wechselt zur neuen Information erstellen
 */
window.switchToNewForm = function() {
    isEditMode = false;
    currentInformationData = null;
    
    // Titel und Button anpassen
    document.getElementById('information-modal-title').textContent = 'Neue Information erstellen';
    document.getElementById('information-submit-btn').innerHTML = '<i class="bi bi-plus-lg"></i> Information erstellen';
    
    resetModalForm();
    showFormMode();
    
    // Focus auf erstes Input
    setTimeout(() => {
        document.getElementById('information-titel').focus();
    }, 100);
};

/**
 * Geht zurück zur Übersicht
 */
window.backToOverview = async function() {
    // Tag aus dem Modal extrahieren
    const tagDatumText = document.getElementById('information-tag-datum').textContent;
    const [tagName] = tagDatumText.split(', ');
    
    const tagMap = {
        'Montag': 'montag',
        'Dienstag': 'dienstag', 
        'Mittwoch': 'mittwoch',
        'Donnerstag': 'donnerstag',
        'Freitag': 'freitag',
        'Samstag': 'samstag',
        'Sonntag': 'sonntag'
    };
    
    const tag = tagMap[tagName];
    
    // Informationen neu laden und Übersicht anzeigen
    await loadAndDisplayInformationen(tag);
    showOverviewMode();
};

/**
 * Bearbeitet eine bestehende Information
 * @param {string} informationId - ID der zu bearbeitenden Information
 */
window.editInformation = function(informationId) {
    // Information aus globalen Daten finden
    const informationenData = window.currentInformationenData || {};
    let foundInformation = null;
    
    // Alle Tage durchsuchen
    Object.keys(informationenData).forEach(tag => {
        const tagInformationen = informationenData[tag] || [];
        const gefunden = tagInformationen.find(info => info.id === informationId && !info.soft_deleted);
        if (gefunden) {
            foundInformation = gefunden;
        }
    });
    
    if (!foundInformation) {
        showToast('Information nicht gefunden', 'error');
        return;
    }
    
    // Edit-Modus aktivieren
    isEditMode = true;
    currentInformationData = foundInformation;
    
    // Titel und Button anpassen
    document.getElementById('information-modal-title').textContent = 'Information bearbeiten';
    document.getElementById('information-submit-btn').innerHTML = '<i class="bi bi-pencil-square"></i> Information aktualisieren';
    
    // Formular mit Daten füllen
    fillFormWithData(foundInformation);
    
    // Zur Formular-Ansicht wechseln
    showFormMode();
    
    // Focus auf erstes Input
    setTimeout(() => {
        document.getElementById('information-titel').focus();
    }, 100);
};

/**
 * Füllt das Formular mit bestehenden Daten
 * @param {object} information - Information-Objekt
 */
function fillFormWithData(information) {
    document.getElementById('information-titel').value = information.titel || '';
    document.getElementById('information-inhalt').value = information.inhalt || '';
    document.getElementById('information-prioritaet').value = information.prioritaet || 'normal';
}

/**
 * Löscht eine Information nach Bestätigung
 * @param {string} informationId - ID der zu löschenden Information
 */
window.deleteInformationConfirm = async function(informationId) {
    // Information aus globalen Daten finden
    const informationenData = window.currentInformationenData || {};
    let foundInformation = null;
    let foundTag = null;
    
    Object.keys(informationenData).forEach(tag => {
        const tagInformationen = informationenData[tag] || [];
        const gefunden = tagInformationen.find(info => info.id === informationId && !info.soft_deleted);
        if (gefunden) {
            foundInformation = gefunden;
            foundTag = tag;
        }
    });
    
    if (!foundInformation) {
        showToast('Information nicht gefunden', 'error');
        return;
    }
    
    // Bestätigung anfordern
    const confirmed = confirm(`Möchten Sie die Information "${foundInformation.titel}" wirklich löschen?`);
    if (!confirmed) return;
    
    try {
        const response = await deleteInformation(informationId);
        
        if (response.success) {
            showToast('Information erfolgreich gelöscht', 'success');
            
            // Informationen neu laden
            await loadAndDisplayInformationen(foundTag);
            
            // Event emittieren für UI-Update
            window.dispatchEvent(new CustomEvent('informationDeleted', {
                detail: { 
                    informationId: informationId,
                    tag: foundTag
                }
            }));
            
        } else {
            showToast(response.message || 'Fehler beim Löschen der Information', 'error');
        }
    } catch (error) {
        console.error('Fehler beim Löschen der Information:', error);
        showToast('Netzwerkfehler beim Löschen der Information', 'error');
    }
};

/**
 * Gibt das Icon für eine Prioritätsstufe zurück
 * @param {string} prioritaet - Prioritätsstufe
 * @returns {string} Bootstrap Icon-Klasse
 */
function getPriorityIcon(prioritaet) {
    const icons = {
        'kritisch': '<i class="bi bi-exclamation-triangle-fill text-danger"></i>',
        'hoch': '<i class="bi bi-exclamation-circle-fill text-warning"></i>',
        'normal': '<i class="bi bi-info-circle-fill text-primary"></i>',
        'niedrig': '<i class="bi bi-info-circle text-secondary"></i>'
    };
    return icons[prioritaet] || icons['normal'];
} 