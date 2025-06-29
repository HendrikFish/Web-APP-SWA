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

// UI-Utilities aus eigenem Modul importieren
import { 
    createModalHTML,
    showModal,
    hideModal,
    showOverviewMode,
    showFormMode,
    resetModalForm,
    fillFormWithData,
    setModalLabels,
    setTagDatum,
    getDayFromElement,
    getCategoryFromElement,
    getTagName,
    formatDate
} from './informationen-modal-ui.js';

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
    
    // Tag-Datum setzen (aus UI-Modul)
    setTagDatum(`${getTagName(tag)}, ${formatDate(datum)}`);
    
    // Informationen für diesen Tag laden und anzeigen
    loadAndDisplayInformationen(tag);
    
    // Übersichts-Modus aktivieren (aus UI-Modul)
    showOverviewMode();
    
    // Modal anzeigen (aus UI-Modul)
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
    
    // Modal-Labels setzen (aus UI-Modul)
    setModalLabels('Neue Information erstellen', 'Information erstellen', 'plus-lg');
    
    // Form-Daten setzen (aus UI-Modul)
    setTagDatum(`${getTagName(tag)}, ${formatDate(datum)}`);
    
    // Form zurücksetzen (aus UI-Modul)
    resetModalForm();
    
    // Formular-Modus aktivieren (aus UI-Modul)
    showFormMode();
    
    // Modal anzeigen (aus UI-Modul)
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
    
    // Modal-Labels setzen (aus UI-Modul)
    setModalLabels('Information bearbeiten', 'Information aktualisieren', 'pencil-square');
    
    // Form-Daten setzen (aus UI-Modul)
    setTagDatum(`${getTagName(tag)}, ${formatDate(datum)}`);
    
    // Form mit bestehenden Daten füllen (aus UI-Modul)
    fillFormWithData(information);
    
    // Formular-Modus aktivieren (aus UI-Modul)
    showFormMode();
    
    // Modal anzeigen (aus UI-Modul)
    showModal();
}

/**
 * Schließt das Informations-Modal
 */
export function closeInformationModal() {
    // Modal verstecken (aus UI-Modul)
    hideModal();
    
    // State zurücksetzen
    currentInformationData = null;
    isEditMode = false;
    resetModalForm();
    
    // Button-Zustände zurücksetzen
    resetInformationButtonStates();
}

// Globale Zuweisung für onclick-Handler
window.closeInformationModal = closeInformationModal;

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

// Hilfsfunktionen getDayFromElement und getCategoryFromElement werden aus informationen-modal-ui.js importiert

// Modal-HTML-Erstellung jetzt im UI-Modul

/**
 * Setzt Event-Listener für das Modal auf
 */
function setupModalEventListeners() {
    // Globale Funktionen für onclick-Handler sind bereits direkt als window.* definiert
    // Hier könnten bei Bedarf weitere Event-Listener hinzugefügt werden
}

// Modal-Anzeige und Form-Reset jetzt im UI-Modul

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
        
        // WICHTIG: Kalenderwoche aus dem tatsächlichen Datum berechnen, nicht aus aktueller Woche
        const actualKalenderwoche = getISOWeek(datum);
        const actualJahr = datum.getFullYear();
        
        console.log(`📅 Information wird gespeichert für:`, {
            tag,
            datum: datum.toISOString().split('T')[0],
            actualJahr,
            actualKalenderwoche,
            // Zur Debug-Info: aktuelle Woche vs. tatsächliche Woche
            currentWeek: window.currentWeek,
            currentYear: window.currentYear
        });
        
        const informationData = {
            jahr: actualJahr,
            kalenderwoche: actualKalenderwoche,
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
                
                // Informationen für die spezifische Woche laden und anzeigen
                const weekInformationen = await loadInformationenForSpecificWeek(actualJahr, actualKalenderwoche, currentEinrichtung.id);
                
                // Wenn die Information für die aktuell angezeigte Woche ist, globale Daten aktualisieren
                if (actualJahr === window.currentYear && actualKalenderwoche === window.currentWeek) {
                    window.currentInformationenData = weekInformationen;
                }
                
                // Informationen für den Tag anzeigen (aus den spezifischen Wochendaten)
                const tagInformationen = weekInformationen[tag] || [];
                const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
                displayInformationenInModal(activeInformationen, tag);
                showOverviewMode();
                
                // Event emittieren für UI-Update
                window.dispatchEvent(new CustomEvent('informationUpdated', {
                    detail: { 
                        information: response.information,
                        tag: tag,
                        datum: datum,
                        kalenderwoche: actualKalenderwoche,
                        jahr: actualJahr
                    }
                }));
            } else {
                showToast(response.message || 'Fehler beim Aktualisieren der Information', 'error');
            }
        } else {
            const response = await createInformation(informationData);
            
            if (response.success) {
                showToast(`Information erfolgreich erstellt für KW ${actualKalenderwoche}/${actualJahr}!`, 'success');
                
                // Informationen für die spezifische Woche laden und anzeigen
                const weekInformationen = await loadInformationenForSpecificWeek(actualJahr, actualKalenderwoche, currentEinrichtung.id);
                
                // Wenn die Information für die aktuell angezeigte Woche ist, globale Daten aktualisieren
                if (actualJahr === window.currentYear && actualKalenderwoche === window.currentWeek) {
                    window.currentInformationenData = weekInformationen;
                }
                
                // Informationen für den Tag anzeigen (aus den spezifischen Wochendaten)
                const tagInformationen = weekInformationen[tag] || [];
                const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
                displayInformationenInModal(activeInformationen, tag);
                showOverviewMode();
                
                // Event emittieren für UI-Update
                window.dispatchEvent(new CustomEvent('informationCreated', {
                    detail: { 
                        information: response.information,
                        tag: tag,
                        datum: datum,
                        kalenderwoche: actualKalenderwoche,
                        jahr: actualJahr
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

// Hilfsfunktionen jetzt im UI-Modul verfügbar

// ===== NEUE FUNKTIONEN FÜR INFORMATIONS-VERWALTUNG =====

/**
 * Zeigt Informationen direkt im Modal an
 * @param {Array} informationen - Array von Informationen
 * @param {string} tag - Wochentag
 */
function displayInformationenInModal(informationen, tag) {
    const informationList = document.getElementById('information-list');
    
    try {
        if (informationen.length === 0) {
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
        informationen.sort((a, b) => priorityOrder[b.prioritaet] - priorityOrder[a.prioritaet]);
        
        // HTML für jede Information erstellen
        const informationenHTML = informationen.map(info => {
            const istGelesen = info.read === true;
            const istEigeneInformation = currentUser && info.ersteller_id === currentUser.id;
            
            // Vereinfachter Gelesen-Status ohne Aktionen
            const gelesenStatusHTML = istGelesen ? `
                <div class="gelesen-status">
                    <i class="bi bi-check-circle-fill text-success"></i>
                    <small class="text-success">
                        Gelesen von: ${info.gelesen_von?.benutzer_name || 'Unbekannt'} 
                        am ${new Date(info.gelesen_von?.timestamp || info.erstellt_am).toLocaleString('de-DE')}
                    </small>
                </div>
            ` : `
                <div class="gelesen-status">
                    <i class="bi bi-circle text-muted"></i>
                    <small class="text-muted">Noch nicht gelesen</small>
                </div>
            `;
            
            return `
                <div class="information-item ${istGelesen ? 'gelesen' : 'ungelesen'}" data-id="${info.id}">
                    <div class="information-header">
                        <div class="information-priority priority-${info.prioritaet}">
                            ${getPriorityIcon(info.prioritaet)} ${info.prioritaet.charAt(0).toUpperCase() + info.prioritaet.slice(1)}
                        </div>
                        <div class="information-actions">
                            ${istEigeneInformation ? `
                                <button type="button" class="btn btn-sm btn-outline-primary" onclick="editInformation('${info.id}')">
                                    <i class="bi bi-pencil-square"></i> Bearbeiten
                                </button>
                                <button type="button" class="btn btn-sm btn-outline-danger" onclick="deleteInformation('${info.id}')">
                                    <i class="bi bi-trash"></i> Löschen
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    <div class="information-content">
                        <h5 class="information-title">${info.titel}</h5>
                        <p class="information-text" id="text-${info.id}">
                            ${info.inhalt}
                        </p>
                        ${gelesenStatusHTML}
                        <div class="information-meta">
                            <small class="text-muted">
                                <i class="bi bi-person"></i> Erstellt von: ${info.ersteller_name || 'Unbekannt'} |
                                <i class="bi bi-clock"></i> ${info.erstellt_am ? new Date(info.erstellt_am).toLocaleString('de-DE') : 'Datum unbekannt'}
                                ${info.aktualisiert_am && info.aktualisiert_am !== info.erstellt_am ? 
                                    `| <i class="bi bi-pencil"></i> Bearbeitet: ${new Date(info.aktualisiert_am).toLocaleString('de-DE')}` : ''}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        informationList.innerHTML = informationenHTML;
        
    } catch (error) {
        console.error('Fehler beim Anzeigen der Informationen:', error);
        informationList.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Fehler beim Anzeigen der Informationen: ${error.message}
            </div>
        `;
    }
}

/**
 * Lädt und zeigt alle Informationen für einen bestimmten Tag an
 * @param {string} tag - Wochentag (montag, dienstag, ...)
 */
async function loadAndDisplayInformationen(tag) {
    // Globale Informationen-Daten verwenden
    const informationenData = window.currentInformationenData || {};
    const tagInformationen = informationenData[tag] || [];
    
    // Nur aktive (nicht gelöschte) Informationen anzeigen
    const activeInformationen = tagInformationen.filter(info => !info.soft_deleted);
    
    displayInformationenInModal(activeInformationen, tag);
}

// Modus-Wechsel-Funktionen jetzt im UI-Modul verfügbar

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

// Funktion fillFormWithData wird aus informationen-modal-ui.js importiert

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

/**
 * Lädt Informationen-Daten für eine spezifische Woche und Einrichtung
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 * @param {string} einrichtungId - Einrichtungs-ID
 * @returns {Promise<object>} - Informationen-Daten
 */
async function loadInformationenForSpecificWeek(year, week, einrichtungId) {
    try {
        console.log(`📋 Lade Informationen für KW ${week}/${year}, Einrichtung-ID: ${einrichtungId}`);
        
        const result = await getInformationen(year, week, einrichtungId);
        
        if (result.success) {
            console.log('✅ Informationen-Daten erfolgreich geladen:', Object.keys(result.informationen || {}).length, 'Tage');
            return result.informationen || {};
        } else {
            console.warn('⚠️ Keine Informationen verfügbar:', result.message);
            return {};
        }
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Informationen-Daten:', error);
        return {};
    }
}

/**
 * Lädt Informationen-Daten für die aktuelle Woche und Einrichtung
 */
async function loadInformationenDataFromAPI() {
    try {
        if (!currentEinrichtung) {
            console.warn('⚠️ Keine Einrichtung ausgewählt für Informationen-Laden');
            return;
        }
        
        const informationenData = await loadInformationenForSpecificWeek(currentYear, currentWeek, currentEinrichtung.id);
        window.currentInformationenData = informationenData;
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Informationen-Daten:', error);
        window.currentInformationenData = {};
    }
} 