/**
 * Hauptskript für Zahlen-Auswertung Modul
 * OPTIMIERT: Verwendet neue Event-Manager und Data-Validation
 * Version: 2.0 (Performance & Security Enhanced)
 */

// ===== IMPORTS =====
// API und UI Module
import { bestelldatenAPI } from './module/bestelldaten-api.js';

// Security und Performance Module
import { sanitizeHTML, validateBestelldaten } from './module/data-validator.js';
import { EventManager, AccordionEventManager } from './module/event-manager.js';

// Auto-Refresh Timer
import { AutoRefreshTimer } from './module/auto-refresh-timer.js';

// Akkordeon-Reparatur
import { setupMobileAccordionFix } from './module/accordion-fix.js';

// Navigation
import { initializeBreadcrumbNavbar } from '@shared/components/breadcrumb-navbar/breadcrumb-navbar.js';

// SICHERHEITS-OPTIMIERTE IMPORTS
import {
    getBestelldaten,
    getVerfügbareWochen 
} from './module/bestelldaten-api.js';

import {
    renderBestelldaten, 
    showLoading, 
    hideLoading, 
    showError
} from './module/zahlen-ui.js';

// ===== GLOBALE VARIABLEN (MINIMIERT) =====
let currentYear = new Date().getFullYear();
let currentWeek = getCurrentWeek();
let debugMode = false;

// Event-Manager Instanzen
let eventManager;
let accordionManager;

// Auto-Refresh Timer
let autoRefreshTimer;

// Performance Monitoring
const performanceMetrics = {
    moduleLoadStart: performance.now(),
    dataLoadTimes: [],
    renderTimes: []
};

let lastInfoBtn = null;

/**
 * Initialisierung der Anwendung (SICHERHEITS-OPTIMIERT)
 */
async function initializeApp() {
    const initStart = performance.now();
    
    try {
        console.log('🚀 Zahlen-Auswertung wird initialisiert...');
        
        // Browser-Kompatibilität prüfen
        checkBrowserCompatibility();
        
        // UI-Placeholder anzeigen
        showUIPlaceholder();
        
        // Event-Manager und Accordion-Manager initialisieren
        eventManager = new EventManager();
        accordionManager = new AccordionEventManager();
        
        // Auto-Refresh Timer initialisieren
        autoRefreshTimer = new AutoRefreshTimer(refreshData);
        
        // Breadcrumb-Navbar initialisieren
        await initializeBreadcrumbNavbar();
        
        // Event-Listener mit Throttling für bessere Performance
        setupOptimizedEventListeners();
        
        // Globale Fehlerbehandlung
        setupErrorHandling();
        
        // Performance-Monitoring
        setupPerformanceMonitoring();
        
        // Accessibility-Features
        setupAccessibilityFeatures();
        
        // Keyboard-Shortcuts
        setupKeyboardShortcuts();
        
        // Orientierungsänderungen handhaben
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', throttle(handleResize, 250));
        
        // Wartungsaufgaben planen
        scheduleMaintenanceTasks();
        
        // Aktuelle Woche laden
        await loadCurrentWeekData();
        
        // Akkordeon-Reparatur anwenden
        setupMobileAccordionFix();
        
        // Auto-Refresh Timer starten
        autoRefreshTimer.start();
        
        console.log('✅ Zahlen-Auswertung erfolgreich initialisiert');
        performanceMetrics.renderTimes.push(performance.now() - performanceMetrics.moduleLoadStart);
        
    } catch (error) {
        console.error('❌ Fehler bei der Initialisierung:', error);
        showCriticalError(error);
        trackError('initialization_error', error);
    }
}

/**
 * Prüft Browser-Kompatibilität (SICHERHEIT)
 * @returns {boolean} Browser ist kompatibel
 */
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'fetch',
        'Promise',
        'Map',
        'WeakMap',
        'AbortController',
        'CustomEvent'
    ];
    
    return requiredFeatures.every(feature => feature in window);
}

/**
 * Zeigt UI-Placeholder für bessere wahrgenommene Performance
 */
function showUIPlaceholder() {
    const weekDisplay = document.getElementById('week-display');
    if (weekDisplay) {
        weekDisplay.innerHTML = `
            <span class="placeholder-glow">
                <span class="placeholder col-6"></span>
            </span>
        `;
    }
}

/**
 * Setup optimierter Event-Listener (OHNE DOM-CLONING)
 */
function setupOptimizedEventListeners() {
    console.log('🎛️ Setup OPTIMIERTE Event-Listener (Performance Enhanced)');
    
    // Wochennavigation mit Event-Manager
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    const currentBtn = document.getElementById('current-week-display');
    
    if (prevBtn) {
        eventManager.addTouchOptimizedClick(prevBtn, () => navigateWeek(-1));
        eventManager.addKeyboardNavigation(prevBtn, () => navigateWeek(-1));
    }
    
    if (nextBtn) {
        eventManager.addTouchOptimizedClick(nextBtn, () => navigateWeek(1));
        eventManager.addKeyboardNavigation(nextBtn, () => navigateWeek(1));
    }
    
    if (currentBtn) {
        eventManager.addTouchOptimizedClick(currentBtn, goToCurrentWeek);
        eventManager.addKeyboardNavigation(currentBtn, goToCurrentWeek);
    }
    
    // Info-Form Handler
    const infoForm = document.getElementById('info-form');
    if (infoForm) {
        eventManager.addEventListener(infoForm, 'submit', handleInfoFormSubmit);
    }
    
    // Debug-Toggle
    const debugToggle = document.getElementById('debug-toggle');
    if (debugToggle) {
        eventManager.addEventListener(debugToggle, 'click', (e) => {
            e.preventDefault();
            toggleDebugMode();
        });
    }
    
    // Window Events (Throttled für Performance)
    eventManager.addEventListener(window, 'resize', throttle(handleResize, 250));
    eventManager.addEventListener(window, 'orientationchange', handleOrientationChange);
    
    // Keyboard Shortcuts (Global)
    eventManager.addEventListener(document, 'keydown', handleGlobalKeyboard);
    
    // Info-Button Event-Delegation
    eventManager.addEventListener(document, 'click', (e) => {
        const infoBtn = e.target.closest('.info-btn, .mobile-einrichtung-info-btn');
        if (infoBtn) {
            e.preventDefault();
            const einrichtungId = infoBtn.getAttribute('data-einrichtung-id');
            if (einrichtungId) {
                handleInfoButtonClick(einrichtungId);
            }
        }
    });
    
    console.log('✅ Event-Listener erfolgreich eingerichtet');
}

/**
 * Handler für "Information als gelesen markieren" Funktionalität
 * @param {string} infoId - ID der Information
 * @param {number} year - Jahr
 * @param {number} week - Woche
 */
async function markiereInformationAlsGelesenHandler(infoId, year, week) {
    try {
        console.log(`📝 Markiere Information ${infoId} als gelesen für KW ${week}/${year}`);
        
        // Button finden und deaktivieren
        const infoBtn = document.querySelector(`[data-info-id="${infoId}"]`);
        if (infoBtn) {
            infoBtn.disabled = true;
            infoBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Wird gespeichert...';
        }
        
        // TODO: Hier würde normalerweise eine API-Anfrage gemacht
        // Simuliere API-Aufruf
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Information-Karte als gelesen markieren
        const infoCard = infoBtn?.closest('.information-karte');
        if (infoCard) {
            infoCard.classList.remove('ungelesen');
            infoCard.classList.add('gelesen');
            
            // Ungelesen-Badge entfernen
            const ungeleseBadge = infoCard.querySelector('.badge.bg-danger');
            if (ungeleseBadge) {
                ungeleseBadge.remove();
            }
            
            // Button-Sektion entfernen
            const actionsDiv = infoCard.querySelector('.information-actions');
            if (actionsDiv) {
                actionsDiv.remove();
            }
        }
        
        console.log('✅ Information erfolgreich als gelesen markiert');
        
    } catch (error) {
        console.error('🚨 Fehler beim Markieren der Information als gelesen:', error);
        
        const infoBtn = document.querySelector(`[data-info-id="${infoId}"]`);
        if (infoBtn) {
            infoBtn.disabled = false;
            infoBtn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Als gelesen markieren';
        }
    }
}

/**
 * Behandelt Info-Button Klicks (VOLLSTÄNDIGE IMPLEMENTIERUNG)
 * @param {string} einrichtungId - ID der Einrichtung
 */
async function handleInfoButtonClick(einrichtungId) {
    try {
        console.log('📋 Lade vollständige Informationen für Einrichtung:', einrichtungId);
        // Hole aktuelle Bestelldaten um die Einrichtung zu finden
        const bestelldaten = await getBestelldaten(currentYear, currentWeek);
        const einrichtung = bestelldaten.einrichtungen.find(e => e.id === einrichtungId);
        console.log('Gefundene Einrichtung:', einrichtung);
        console.log('Enthält Informationen:', einrichtung?.informationen);
        if (!einrichtung) {
            console.error('❌ Einrichtung nicht gefunden:', einrichtungId);
            return;
        }
        
        // Bootstrap Modal korrekt verwalten - REPARIERT
        const modalElement = document.getElementById('info-modal');
        
        // Bereinige vorherige Modal-Instanzen und Backdrops
        const existingBackdrops = document.querySelectorAll('.modal-backdrop');
        existingBackdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        document.body.style.removeProperty('padding-right');
        
        const modal = new bootstrap.Modal(modalElement, {
            backdrop: true,
            keyboard: true,
            focus: true
        });
        
        // Event-Listener für sauberes Schließen hinzufügen
        const handleModalHidden = function () {
            // Stelle sicher, dass alle Backdrops entfernt werden
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => {
                backdrop.remove();
                console.log('🧹 Modal-Backdrop entfernt');
            });
            
            // Entferne modal-open Klasse vom Body
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
            document.body.style.removeProperty('overflow');
            
            console.log('✅ Modal korrekt geschlossen und bereinigt');
            
            // Event-Listener nach Verwendung entfernen
            modalElement.removeEventListener('hidden.bs.modal', handleModalHidden);
        };
        
        modalElement.addEventListener('hidden.bs.modal', handleModalHidden);
        
        // Zusätzlicher Notfall-Cleanup beim Schließen-Button
        const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                setTimeout(() => {
                    const backdrops = document.querySelectorAll('.modal-backdrop');
                    if (backdrops.length > 0) {
                        console.log('🔧 Notfall-Backdrop-Cleanup ausgeführt');
                        backdrops.forEach(backdrop => backdrop.remove());
                        document.body.classList.remove('modal-open');
                        document.body.style.removeProperty('padding-right');
                    }
                }, 300);
            });
        });
        
        modal.show();
        
        // Verwende die vollständige renderInfoModal Funktion
        const { renderInfoModal } = await import('./module/zahlen-ui.js');
        renderInfoModal(einrichtung, bestelldaten);
        
        console.log('✅ Vollständiges Info-Modal erfolgreich gerendert');
        
    } catch (error) {
        console.error('🚨 Fehler beim Laden der Informationen:', error);
        
        // Bereinige auch bei Fehlern
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.classList.remove('modal-open');
        
        const modalBody = document.getElementById('modal-body-content');
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    <strong>Fehler:</strong> Informationen konnten nicht geladen werden.
                    <br><small class="text-muted">${sanitizeHTML(error.message)}</small>
                </div>
            `;
        }
    }
}

/**
 * Error-Handling Setup
 */
function setupErrorHandling() {
    // Global Error Handler
    window.addEventListener('error', (event) => {
        console.error('🚨 JavaScript-Fehler:', event.error);
        trackError('javascript_error', event.error);
    });
    
    // Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('🚨 Unbehandelte Promise-Rejection:', event.reason);
        trackError('promise_rejection', event.reason);
    });
}

/**
 * Performance-Monitoring Setup
 */
function setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                console.log(`⚡ ${entry.name}: ${Math.round(entry.value)}ms`);
            });
        });
        
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
}

/**
 * Lädt Daten für die aktuelle Woche (SICHERHEITS-VALIDIERT)
 */
async function loadCurrentWeekData() {
    const loadStart = performance.now();
    
    try {
        console.log(`📊 Lade Daten für Woche ${currentWeek}/${currentYear}`);
        
        showLoading();
        updateWeekDisplay();
        
        // SICHERHEIT: Input-Validation bereits in API
        const bestelldaten = await getBestelldaten(currentYear, currentWeek);
        
        // Performance: Messe Ladezeit
        const loadDuration = performance.now() - loadStart;
        performanceMetrics.dataLoadTimes.push(loadDuration);
        
        // Render: Mit Performance-Tracking
        const renderStart = performance.now();
        await renderBestelldaten(bestelldaten);
        const renderDuration = performance.now() - renderStart;
        performanceMetrics.renderTimes.push(renderDuration);
        
        hideLoading();
        updateDataStatus(`Daten geladen in ${Math.round(loadDuration)}ms`);
        
        console.log(`✅ Daten erfolgreich geladen und gerendert`);
        console.log(`📈 Performance: Load ${Math.round(loadDuration)}ms, Render ${Math.round(renderDuration)}ms`);
        
        // Analytics
        trackEvent('data_loaded', {
            week: currentWeek,
            year: currentYear,
            loadTime: loadDuration,
            renderTime: renderDuration
        });
        
    } catch (error) {
        hideLoading();
        console.error('🚨 Fehler beim Laden der Daten:', error);
        
        // SICHERHEIT: Sanitisiere Fehlermeldung
        const sanitizedMessage = sanitizeHTML(error.message || 'Unbekannter Fehler');
        showError(`Fehler beim Laden der Daten: ${sanitizedMessage}`);
        
        trackError('data_load_error', error);
    }
}

/**
 * Navigiert zur nächsten/vorherigen Woche
 * @param {number} direction - -1 für vorherige, +1 für nächste Woche
 */
async function navigateWeek(direction) {
    const newWeek = currentWeek + direction;
    if (newWeek < 1) {
        currentYear--;
        currentWeek = 52;
    } else if (newWeek > 52) {
        currentYear++;
        currentWeek = 1;
    } else {
        currentWeek = newWeek;
    }
    await loadCurrentWeekData();
    updateLeadYear();
}

/**
 * Springt zur aktuellen Woche
 */
async function goToCurrentWeek() {
    currentYear = new Date().getFullYear();
    currentWeek = getCurrentWeek();
    await loadCurrentWeekData();
    updateLeadYear();
}

/**
 * Aktualisiert die Daten (Refresh)
 */
async function refreshData() {
    console.log('🔄 Aktualisiere Daten...');
    
    // Animation für Refresh-Button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        const icon = refreshBtn.querySelector('i');
        if (icon) {
            icon.style.animation = 'spin 1s linear infinite';
            setTimeout(() => {
                icon.style.animation = '';
            }, 1000);
        }
    }
    
    await loadCurrentWeekData();
    
    // Akkordeon-Reparatur nach Datenaktualisierung erneut anwenden
    setTimeout(() => {
        setupMobileAccordionFix();
    }, 200);
}

/**
 * Aktualisiert die Wochenanzeige im neuen Button-Format
 */
function updateWeekDisplay() {
    const weekDisplay = document.getElementById('current-week-display');
    if (weekDisplay) {
        const weekStart = getWeekStartDate(currentYear, currentWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const formatOptions = { day: '2-digit', month: '2-digit' };
        const startStr = weekStart.toLocaleDateString('de-DE', formatOptions);
        const endStr = weekEnd.toLocaleDateString('de-DE', formatOptions);
        
        // Aktualisiere Button-Text OHNE Jahr im Datumsbereich
        const spanElement = weekDisplay.querySelector('span');
        if (spanElement) {
            spanElement.textContent = `KW ${currentWeek} (${startStr}-${endStr})`;
        }
        
        // Tooltip für zusätzliche Info
        weekDisplay.title = `Zur aktuellen Woche springen (KW ${getCurrentWeek()}/${new Date().getFullYear()})`;
    }
}

/**
 * Aktualisiert den Datenstatus im Footer
 * @param {string} message - Statusmeldung
 */
function updateDataStatus(message) {
    const dataStatus = document.getElementById('data-status');
    if (dataStatus) {
        dataStatus.textContent = sanitizeHTML(message);
    }
}

/**
 * Zeigt kritischen Fehler an
 * @param {Error} error - Fehler-Objekt
 */
function showCriticalError(error) {
    const body = document.body;
    body.innerHTML = `
        <div class="container mt-5">
            <div class="alert alert-danger text-center">
                <h4><i class="bi bi-exclamation-triangle"></i> Kritischer Fehler</h4>
                <p>Die Anwendung konnte nicht gestartet werden.</p>
                <small class="text-muted">${sanitizeHTML(error.message)}</small>
                <div class="mt-3">
                    <button class="btn btn-primary" onclick="location.reload()">
                        Seite neu laden
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Behandelt Fenster-Größenänderungen (Throttled)
 */
function handleResize() {
    console.log('📱 Fenster-Größe geändert');
    
    // Prüfe ob zwischen Desktop/Mobile gewechselt wurde
    const isDesktop = window.innerWidth >= 819;
    const currentView = isDesktop ? 'desktop' : 'mobile';
    
    // Force Re-render wenn nötig
    const needsReRender = document.body.dataset.currentView !== currentView;
    if (needsReRender) {
        document.body.dataset.currentView = currentView;
        console.log(`🔄 Wechsel zu ${currentView}-Ansicht`);
        
        // Re-render mit kleiner Verzögerung für smooth Transition
        setTimeout(() => {
            loadCurrentWeekData();
        }, 100);
    }
}

/**
 * Behandelt Bildschirm-Rotation
 */
function handleOrientationChange() {
    console.log('🔄 Bildschirm-Rotation erkannt');
    
    // Verzögerung für Orientierungsänderung
    setTimeout(() => {
        handleResize();
    }, 500);
}

/**
 * Setup für Keyboard-Shortcuts
 */
function setupKeyboardShortcuts() {
    // Wird in handleGlobalKeyboard implementiert
}

/**
 * Globale Keyboard-Behandlung
 * @param {KeyboardEvent} e - Keyboard-Event
 */
function handleGlobalKeyboard(e) {
    // Shortcuts nur wenn kein Input fokussiert ist
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'ArrowLeft':
            if (e.ctrlKey) {
                e.preventDefault();
                navigateWeek(-1);
            }
                break;
            case 'ArrowRight':
            if (e.ctrlKey) {
                e.preventDefault();
                navigateWeek(1);
            }
                break;
        case 'r':
            if (e.ctrlKey) {
                e.preventDefault();
                refreshData();
            }
                break;
        case 'h':
            if (e.ctrlKey) {
                e.preventDefault();
                goToCurrentWeek();
                }
                break;
        }
}

/**
 * Setup für Accessibility-Features
 */
function setupAccessibilityFeatures() {
    // Live-Region für Screen-Reader Updates
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'visually-hidden';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
    
    // Focus-Management für Modals
    setupModalFocusManagement();
}

/**
 * Setup für Modal Focus-Management
 */
function setupModalFocusManagement() {
    const modal = document.getElementById('info-modal');
    if (modal) {
        modal.addEventListener('shown.bs.modal', () => {
            const firstButton = modal.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            }
        });
        modal.addEventListener('hidden.bs.modal', () => {
            if (lastInfoBtn) {
                lastInfoBtn.focus();
                lastInfoBtn = null;
            } else {
                document.body.focus();
            }
        });
    }
}

/**
 * Togglet Debug-Modus
 */
function toggleDebugMode() {
    debugMode = !debugMode;
    document.body.dataset.debug = debugMode;
    
    if (debugMode) {
        console.log('🔍 Debug-Modus aktiviert');
        showPerformanceMetrics();
    } else {
        console.log('🔍 Debug-Modus deaktiviert');
    }
}

/**
 * Zeigt Performance-Metriken an
 */
function showPerformanceMetrics() {
    const avgLoadTime = performanceMetrics.dataLoadTimes.reduce((a, b) => a + b, 0) / performanceMetrics.dataLoadTimes.length || 0;
    const avgRenderTime = performanceMetrics.renderTimes.reduce((a, b) => a + b, 0) / performanceMetrics.renderTimes.length || 0;
    
    console.log('📈 Performance-Metriken:');
    console.log(`  • Durchschnittliche Ladezeit: ${Math.round(avgLoadTime)}ms`);
    console.log(`  • Durchschnittliche Renderzeit: ${Math.round(avgRenderTime)}ms`);
    console.log(`  • Event-Listener aktiv: ${eventManager.getDebugInfo().activeListeners}`);
    console.log(`  • Accordion-Status: ${accordionManager.getDebugInfo().accordionCount} Sections`);
}

/**
 * Plant Wartungsaufgaben
 */
function scheduleMaintenanceTasks() {
    // Cleanup alle 5 Minuten
    setInterval(() => {
        // Memory-Cleanup für Performance-Metriken
        if (performanceMetrics.dataLoadTimes.length > 50) {
            performanceMetrics.dataLoadTimes = performanceMetrics.dataLoadTimes.slice(-20);
        }
        if (performanceMetrics.renderTimes.length > 50) {
            performanceMetrics.renderTimes = performanceMetrics.renderTimes.slice(-20);
        }
    }, 5 * 60 * 1000);
}

/**
 * Hilfsfunktionen
 */

// Throttle-Funktion für Performance
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
}

// Aktuelle Kalenderwoche berechnen
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

// Startdatum einer Kalenderwoche
function getWeekStartDate(year, week) {
    const jan1 = new Date(year, 0, 1);
    const days = (week - 1) * 7;
    const weekStart = new Date(jan1.getTime() + days * 24 * 60 * 60 * 1000);
    
    // Anpassung auf Montag als Wochenstart
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    weekStart.setDate(weekStart.getDate() + diff);
    
    return weekStart;
}

// Event-Tracking (Mock für Analytics)
function trackEvent(eventName, data) {
    if (debugMode) {
        console.log(`📊 Event: ${eventName}`, data);
    }
    // Hier würde normalerweise Analytics-Code stehen
}

// Error-Tracking (Mock für Error-Reporting)
function trackError(errorType, error) {
    if (debugMode) {
        console.log(`🚨 Error: ${errorType}`, error);
    }
    // Hier würde normalerweise Error-Reporting-Code stehen
}

/**
 * Cleanup beim Seitenwechsel
 */
function cleanup() {
    console.log('🧹 Cleanup Event-Listener und Ressourcen');
    eventManager.cleanup();
    accordionManager.cleanup();
}

// Cleanup bei Seitenwechsel
window.addEventListener('beforeunload', cleanup);

// ===== INITIALISIERUNG =====
// Warte auf DOM-Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
            } else {
    // DOM bereits geladen
    initializeApp();
}

// Performance: Modul-Ladezeit loggen
const moduleLoadDuration = performance.now() - performanceMetrics.moduleLoadStart;
console.log(`⚡ Module geladen in ${Math.round(moduleLoadDuration)}ms`);

// Handler-Funktionen global verfügbar machen
window.markiereInformationAlsGelesenHandler = markiereInformationAlsGelesenHandler;

/**
 * Behandelt Info-Formular Submit
 * @param {Event} e - Submit-Event
 */
async function handleInfoFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Client-seitige Validierung
    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }
    
    try {
        const infoData = {
            titel: formData.get('titel'),
            inhalt: formData.get('inhalt'),
            prioritaet: formData.get('prioritaet'),
            kategorie: formData.get('kategorie'),
            gueltig_bis: formData.get('gueltig_bis'),
            week: currentWeek,
            year: currentYear,
            erstellt: new Date().toISOString()
        };
        
        console.log('💾 Speichere neue Information:', infoData);
        
        // TODO: API-Call zum Speichern der Information
        // const response = await fetch('/api/informationen', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${localStorage.getItem('token')}`
        //     },
        //     body: JSON.stringify(infoData)
        // });
        
        // Simuliere erfolgreiche Speicherung
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Toast-Benachrichtigung anzeigen
        showSuccessToast('Information erfolgreich gespeichert!');
        
        // Form zurücksetzen
        form.reset();
        form.classList.remove('was-validated');
        
        // Modal schließen
        const modal = bootstrap.Modal.getInstance(document.getElementById('info-modal'));
        if (modal) {
            modal.hide();
        }
        
        // Daten neu laden um die neue Information anzuzeigen
        await refreshData();
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern der Information:', error);
        showErrorToast('Fehler beim Speichern der Information. Bitte versuchen Sie es erneut.');
    }
}

/**
 * Zeigt Success-Toast
 * @param {string} message - Nachricht
 */
function showSuccessToast(message) {
    // Einfacher Alert als Fallback - kann später durch Toast-System ersetzt werden
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-success alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="bi bi-check-circle me-2"></i>
        ${sanitizeHTML(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    // Auto-entfernen nach 3 Sekunden
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

/**
 * Zeigt Error-Toast
 * @param {string} message - Fehlernachricht
 */
function showErrorToast(message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert alert-danger alert-dismissible fade show position-fixed';
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${sanitizeHTML(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

function updateLeadYear() {
    const leadJahr = document.getElementById('lead-kw-jahr-value');
    if (leadJahr) {
        leadJahr.textContent = currentYear;
    }
} 