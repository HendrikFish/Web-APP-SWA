/**
 * Effizienter Event-Manager für Zahlen-Auswertung
 * Ersetzt das problematische DOM-Cloning und verhindert Memory-Leaks
 */

/**
 * Event-Manager für saubere Event-Listener-Verwaltung
 */
export class EventManager {
    constructor() {
        this.listeners = new Map();
        this.delegatedListeners = new Map();
        this.abortController = new AbortController();
    }

    /**
     * Fügt Event-Listener hinzu (mit automatischer Cleanup)
     * @param {Element} element - Ziel-Element
     * @param {string} event - Event-Typ
     * @param {Function} handler - Event-Handler
     * @param {Object} options - Event-Optionen
     */
    addEventListener(element, event, handler, options = {}) {
        const key = this.getListenerKey(element, event, handler);
        
        // Entferne existierenden Listener falls vorhanden
        this.removeEventListener(element, event, handler);
        
        const finalOptions = {
            ...options,
            signal: this.abortController.signal
        };
        
        element.addEventListener(event, handler, finalOptions);
        
        // Speichere Referenz für spätere Cleanup
        this.listeners.set(key, {
            element,
            event,
            handler,
            options: finalOptions
        });
    }

    /**
     * Entfernt spezifischen Event-Listener
     * @param {Element} element - Ziel-Element
     * @param {string} event - Event-Typ
     * @param {Function} handler - Event-Handler
     */
    removeEventListener(element, event, handler) {
        const key = this.getListenerKey(element, event, handler);
        const listenerInfo = this.listeners.get(key);
        
        if (listenerInfo) {
            element.removeEventListener(event, handler);
            this.listeners.delete(key);
        }
    }

    /**
     * Event-Delegation für dynamische Inhalte
     * @param {Element} container - Container-Element
     * @param {string} selector - CSS-Selektor für Ziel-Elemente
     * @param {string} event - Event-Typ
     * @param {Function} handler - Event-Handler
     */
    delegate(container, selector, event, handler) {
        const delegateKey = `${container.id || 'container'}-${selector}-${event}`;
        
        // Entferne existierenden Delegated-Listener
        this.removeDelegatedListener(delegateKey);
        
        const delegatedHandler = (e) => {
            const target = e.target.closest(selector);
            if (target && container.contains(target)) {
                handler.call(target, e);
            }
        };
        
        this.addEventListener(container, event, delegatedHandler, { passive: false });
        
        // Speichere für spätere Cleanup
        this.delegatedListeners.set(delegateKey, {
            container,
            selector,
            event,
            handler: delegatedHandler
        });
    }

    /**
     * Entfernt Event-Delegation
     * @param {string} delegateKey - Delegation-Key
     */
    removeDelegatedListener(delegateKey) {
        const delegatedInfo = this.delegatedListeners.get(delegateKey);
        if (delegatedInfo) {
            this.removeEventListener(delegatedInfo.container, delegatedInfo.event, delegatedInfo.handler);
            this.delegatedListeners.delete(delegateKey);
        }
    }

    /**
     * Touch-optimierte Event-Behandlung
     * @param {Element} element - Ziel-Element
     * @param {Function} handler - Click-Handler
     */
    addTouchOptimizedClick(element, handler) {
        let touchStart = null;
        let touchEnd = null;
        
        // Touch-Start erfassen
        this.addEventListener(element, 'touchstart', (e) => {
            touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
        }, { passive: true });
        
        // Touch-End erfassen
        this.addEventListener(element, 'touchend', (e) => {
            touchEnd = {
                time: Date.now()
            };
            
            // Prüfe ob es ein gültiger Tap war
            if (touchStart) {
                const deltaTime = touchEnd.time - touchStart.time;
                const deltaX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
                const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);
                
                // Tap-Kriterien: < 300ms, < 10px Bewegung
                if (deltaTime < 300 && deltaX < 10 && deltaY < 10) {
                    e.preventDefault();
                    handler.call(element, e);
                }
            }
            
            touchStart = null;
        }, { passive: false });
        
        // Fallback für Maus-Clicks
        this.addEventListener(element, 'click', (e) => {
            // Verhindere doppelte Ausführung bei Touch-Geräten
            if (!touchEnd || (Date.now() - touchEnd.time > 50)) {
                handler.call(element, e);
            }
        });
    }

    /**
     * Keyboard-Navigation hinzufügen
     * @param {Element} element - Ziel-Element
     * @param {Function} handler - Handler-Funktion
     */
    addKeyboardNavigation(element, handler) {
        this.addEventListener(element, 'keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handler.call(element, e);
            }
        });
    }

    /**
     * Erstellt eindeutigen Key für Listener
     * @param {Element} element - Element
     * @param {string} event - Event-Typ
     * @param {Function} handler - Handler
     * @returns {string} Eindeutiger Key
     */
    getListenerKey(element, event, handler) {
        const elementId = element.id || element.tagName + '_' + Math.random().toString(36).substr(2, 9);
        return `${elementId}-${event}-${handler.name || 'anonymous'}`;
    }

    /**
     * Cleanup aller Event-Listener
     */
    cleanup() {
        // AbortController beendet alle Signal-basierten Listener
        this.abortController.abort();
        
        // Cleanup Maps
        this.listeners.clear();
        this.delegatedListeners.clear();
        
        // Neuen AbortController für zukünftige Events
        this.abortController = new AbortController();
    }

    /**
     * Debug-Information über aktive Listener
     */
    getDebugInfo() {
        return {
            activeListeners: this.listeners.size,
            activeDelegations: this.delegatedListeners.size,
            isAborted: this.abortController.signal.aborted
        };
    }
}

/**
 * Globaler Event-Manager für das Modul
 */
export const eventManager = new EventManager();

/**
 * Accordion-Event-Manager (Ersetzt DOM-Cloning)
 */
export class AccordionEventManager {
    constructor() {
        this.accordionStates = new Map();
        this.isSetup = false;
    }

    /**
     * Setup für Accordion-Events (OHNE DOM-Cloning)
     * @param {string} containerSelector - Container-Selektor
     */
    setupAccordionEvents(containerSelector = '#smartphone-tage-accordion') {
        console.log('🎛️ Richte OPTIMIERTE Akkordeon-Events ein (ohne DOM-Cloning)');
        
        if (this.isSetup) {
            this.cleanup();
        }
        
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`Accordion-Container nicht gefunden: ${containerSelector}`);
            return;
        }
        
        // Event-Delegation für bessere Performance
        eventManager.delegate(container, '.mobile-accordion-header[data-accordion-target]', 'click', this.handleAccordionClick.bind(this));
        
        // Keyboard-Support
        eventManager.delegate(container, '.mobile-accordion-header[data-accordion-target]', 'keydown', this.handleAccordionKeydown.bind(this));
        
        // Touch-optimiert
        const headers = container.querySelectorAll('.mobile-accordion-header[data-accordion-target]');
        headers.forEach(header => {
            eventManager.addTouchOptimizedClick(header, this.handleAccordionTouch.bind(this));
            
            // Initial-State erfassen
            const targetId = header.getAttribute('data-accordion-target');
            const isActive = header.classList.contains('aktiv');
            this.accordionStates.set(targetId, {
                isOpen: isActive,
                header,
                content: document.getElementById(targetId)
            });
        });
        
        this.isSetup = true;
    }

    /**
     * Behandelt Accordion-Clicks (OHNE DOM-Cloning)
     * @param {Event} e - Click-Event
     */
    handleAccordionClick(e) {
        // Verhindere Accordion-Toggle bei Info-Button-Clicks
        if (e.target.closest('.mobile-tag-info-btn, .mobile-einrichtung-info-btn')) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        this.toggleAccordion(e.currentTarget);
    }

    /**
     * Behandelt Keyboard-Navigation
     * @param {Event} e - Keyboard-Event
     */
    handleAccordionKeydown(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.toggleAccordion(e.currentTarget);
        }
    }

    /**
     * Behandelt Touch-Events
     * @param {Event} e - Touch-Event
     */
    handleAccordionTouch(e) {
        // Touch-Feedback
        const header = e.currentTarget;
        header.style.backgroundColor = '#e9ecef';
        
        setTimeout(() => {
            header.style.backgroundColor = '';
        }, 150);
        
        this.toggleAccordion(header);
    }

    /**
     * Toggle Accordion-Section (OPTIMIERTE VERSION)
     * @param {Element} header - Accordion-Header
     */
    toggleAccordion(header) {
        const targetId = header.getAttribute('data-accordion-target');
        const state = this.accordionStates.get(targetId);
        
        if (!state || !state.content) {
            console.warn(`Accordion-Target nicht gefunden: ${targetId}`);
            return;
        }
        
        const { content } = state;
        const chevron = header.querySelector('.mobile-chevron');
        const isCurrentlyOpen = state.isOpen;
        
        if (isCurrentlyOpen) {
            this.closeAccordion(header, content, chevron, targetId);
        } else {
            this.openAccordion(header, content, chevron, targetId);
        }
    }

    /**
     * Öffnet Accordion-Section
     * @param {Element} header - Header-Element
     * @param {Element} content - Content-Element
     * @param {Element} chevron - Chevron-Element
     * @param {string} targetId - Target-ID
     */
    openAccordion(header, content, chevron, targetId) {
        // State aktualisieren
        this.accordionStates.set(targetId, {
            ...this.accordionStates.get(targetId),
            isOpen: true
        });
        
        // DOM-Updates
        header.classList.add('aktiv');
        header.setAttribute('aria-expanded', 'true');
        content.classList.add('show');
        
        if (chevron) {
            chevron.style.transform = 'rotate(180deg)';
        }
        
        // Dynamische Höhenberechnung für smooth Animation
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Event für andere Komponenten
        header.dispatchEvent(new CustomEvent('accordion:opened', {
            detail: { targetId, header, content }
        }));
    }

    /**
     * Schließt Accordion-Section
     * @param {Element} header - Header-Element
     * @param {Element} content - Content-Element
     * @param {Element} chevron - Chevron-Element
     * @param {string} targetId - Target-ID
     */
    closeAccordion(header, content, chevron, targetId) {
        // State aktualisieren
        this.accordionStates.set(targetId, {
            ...this.accordionStates.get(targetId),
            isOpen: false
        });
        
        // DOM-Updates
        header.classList.remove('aktiv');
        header.setAttribute('aria-expanded', 'false');
        content.classList.remove('show');
        content.style.maxHeight = '0';
        
        if (chevron) {
            chevron.style.transform = 'rotate(0deg)';
        }
        
        // Event für andere Komponenten
        header.dispatchEvent(new CustomEvent('accordion:closed', {
            detail: { targetId, header, content }
        }));
    }

    /**
     * Cleanup aller Accordion-Events
     */
    cleanup() {
        this.accordionStates.clear();
        this.isSetup = false;
        // EventManager übernimmt das Event-Cleanup
    }

    /**
     * Debug-Information
     */
    getDebugInfo() {
        return {
            isSetup: this.isSetup,
            accordionCount: this.accordionStates.size,
            openAccordions: Array.from(this.accordionStates.entries())
                .filter(([_, state]) => state.isOpen)
                .map(([id, _]) => id)
        };
    }
}

/**
 * Globaler Accordion-Manager
 */
export const accordionManager = new AccordionEventManager(); 