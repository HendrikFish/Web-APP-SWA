/**
 * Abwesenheiten UI-Modul V2.0
 * Jahreskalender und KW-basierte Kinderverteilung
 */

import { 
    getEinrichtungen, 
    getStatusDefinitionen, 
    getJahresDaten,
    getCurrentUser,
    isUserAdmin,
    getCurrentYear,
    setCurrentYear,
    saveDayStatus,
    getDayStatus
} from './abwesenheit-api.js';

// UI-State Management
let uiState = {
    currentTab: 'ferien',
    selectedDate: null,
    selectedEinrichtung: null,
    isDragMode: false,
    dragSource: null,
    currentKW: getCurrentWeek(),
    visibleKWs: [] // Array von 3 sichtbaren KWs
};

/**
 * Initialisiert das UI nach erfolgreichem API-Load
 */
export async function initAbwesenheitUI(apiData) {
    try {
        console.log('🎨 Initialisiere Abwesenheiten UI V2.0...');
        
        // Verstecke Loading-Spinner sofort
        hideInitialLoadingSpinner();
        
        // Jahr-Auswahl initialisieren
        initJahrSelector();
        
        // Tab-System initialisieren
        initTabSystem();
        
        // Benutzer-spezifische UI
        initUserSpecificUI(apiData.currentUser, apiData.isAdmin);
        
        // Status-Legende aufbauen
        buildStatusLegende(apiData.statusDefinitionen);
        
        // Initial Tab laden (Ferienverwaltung)
        await loadFerienTab();
        
        // Event-Listener registrieren
        registerEventListeners();
        
        console.log('✅ Abwesenheiten UI erfolgreich initialisiert');
        
    } catch (error) {
        console.error('❌ Fehler beim Initialisieren des UI:', error);
        showErrorFallbackUI(error);
    }
}

/**
 * Versteckt den Loading-Spinner aggressiv
 */
export function hideInitialLoadingSpinner() {
    const loadingState = document.getElementById('loading-state');
    const mainContent = document.getElementById('main-content');
    
    if (loadingState) {
        loadingState.style.display = 'none';
        loadingState.style.visibility = 'hidden';
        loadingState.style.opacity = '0';
        loadingState.setAttribute('aria-hidden', 'true');
        console.log('🔄 Initialer Loading-Spinner versteckt');
    }
    
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.visibility = 'visible';
        mainContent.style.opacity = '1';
        mainContent.removeAttribute('aria-hidden');
        console.log('🔄 Haupt-Inhalt angezeigt');
    }
}

/**
 * Zeigt Fallback-UI bei Fehlern
 */
export function showErrorFallbackUI(error) {
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Fehler beim Laden
                </h4>
                <p>Das Abwesenheiten-Modul konnte nicht vollständig geladen werden.</p>
                <p class="mb-0"><strong>Fehler:</strong> ${error.message}</p>
                <hr>
                <button class="btn btn-outline-danger" onclick="location.reload()">
                    <i class="bi bi-arrow-clockwise me-2"></i>
                    Seite neu laden
                </button>
            </div>
        `;
    }
}

/**
 * Ermittelt die aktuelle Kalenderwoche
 */
function getCurrentWeek() {
    const now = new Date();
    return getWeekNumber(now);
}

/**
 * Berechnet die Kalenderwoche für ein Datum
 */
function getWeekNumber(date) {
    const tempDate = new Date(date);
    tempDate.setHours(0, 0, 0, 0);
    tempDate.setDate(tempDate.getDate() + 3 - (tempDate.getDay() + 6) % 7);
    const week1 = new Date(tempDate.getFullYear(), 0, 4);
    return 1 + Math.round(((tempDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

/**
 * Initialisiert die Jahr-Button-Auswahl
 */
function initJahrSelector() {
    const buttonGroup = document.getElementById('jahr-button-group');
    if (!buttonGroup) return;
    
    // Aktuelles Jahr ermitteln
    const currentRealYear = new Date().getFullYear();
    const availableYears = [currentRealYear, currentRealYear - 1, currentRealYear - 2];
    
    // Buttons für verfügbare Jahre erstellen
    buttonGroup.innerHTML = '';
    availableYears.forEach((jahr, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn jahr-button ${index === 0 ? 'active' : ''}`;
        button.textContent = jahr;
        button.dataset.jahr = jahr;
        
        // Event-Listener für Jahr-Wechsel
        button.addEventListener('click', async (event) => {
            const neuesJahr = parseInt(event.target.dataset.jahr);
            
            // Alle Buttons deaktivieren, aktuellen aktivieren
            buttonGroup.querySelectorAll('.jahr-button').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Jahr wechseln und UI aktualisieren
            await setCurrentYear(neuesJahr);
            
            // Aktuelle Tab neu laden
            if (uiState.currentTab === 'ferien') {
                await loadFerienTab();
            } else {
                await loadVerteilungTab();
            }
            
            // Kalender-Jahr-Anzeige aktualisieren
            const kalenderJahr = document.getElementById('kalender-jahr');
            if (kalenderJahr) {
                kalenderJahr.textContent = neuesJahr;
            }
            
            console.log(`📅 Jahr gewechselt zu: ${neuesJahr}`);
        });
        
        buttonGroup.appendChild(button);
    });
    
    // Setze das aktuelle Jahr als Standard
    setCurrentYear(currentRealYear);
}

/**
 * Initialisiert das Tab-System
 */
function initTabSystem() {
    const ferienTab = document.getElementById('ferien-tab');
    const verteilungTab = document.getElementById('verteilung-tab');
    
    ferienTab?.addEventListener('click', async () => {
        uiState.currentTab = 'ferien';
        await loadFerienTab();
    });
    
    verteilungTab?.addEventListener('click', async () => {
        uiState.currentTab = 'verteilung';
        await loadVerteilungTab();
    });
}

/**
 * Initialisiert benutzer-spezifische UI-Elemente
 */
function initUserSpecificUI(currentUser, isAdmin) {
    const einrichtungSelector = document.getElementById('einrichtung-selector');
    const einrichtungSelect = document.getElementById('einrichtung-select');
    
    if (!isAdmin && currentUser && einrichtungSelector && einrichtungSelect) {
        // User sieht nur seine Einrichtung
        einrichtungSelector.style.display = 'block';
        einrichtungSelect.innerHTML = `<option value="${currentUser.kuerzel}">${currentUser.name}</option>`;
        einrichtungSelect.disabled = true;
        uiState.selectedEinrichtung = currentUser.kuerzel;
    } else if (isAdmin && einrichtungSelector && einrichtungSelect) {
        // Admin sieht alle Einrichtungen
        einrichtungSelector.style.display = 'block';
        const einrichtungen = getEinrichtungen();
        
        einrichtungSelect.innerHTML = '<option value="">Alle Einrichtungen</option>';
        einrichtungen.forEach(einrichtung => {
            einrichtungSelect.innerHTML += `<option value="${einrichtung.kuerzel}">${einrichtung.name}</option>`;
        });
        
        einrichtungSelect.addEventListener('change', async () => {
            uiState.selectedEinrichtung = einrichtungSelect.value || null;
            if (uiState.currentTab === 'ferien') {
                await loadFerienTab();
            }
        });
    }
}

/**
 * Baut die Status-Legende auf
 */
function buildStatusLegende(statusDefinitionen) {
    const statusLegende = document.getElementById('status-legende');
    if (!statusLegende) return;
    
    statusLegende.innerHTML = '';
    
    Object.entries(statusDefinitionen).forEach(([key, status]) => {
        const badge = document.createElement('div');
        badge.className = `status-badge status-${key}`;
        badge.innerHTML = `
            <span>${status.icon}</span>
            <span>${status.label}</span>
        `;
        statusLegende.appendChild(badge);
    });
}

/**
 * Lädt und rendert die Ferienverwaltung
 */
async function loadFerienTab() {
    try {
        console.log('📅 Lade Ferienverwaltung...');
        
        const container = document.getElementById('jahreskalender-container');
        if (!container) return;
        
        const jahr = getCurrentYear();
        const jahresDaten = getJahresDaten(jahr);
        const statusDefinitionen = getStatusDefinitionen();
        const einrichtungen = getEinrichtungen();
        
        // Filtere Einrichtungen basierend auf User-Berechtigung
        let anzuzeigeEinrichtungen = einrichtungen;
        if (uiState.selectedEinrichtung) {
            anzuzeigeEinrichtungen = einrichtungen.filter(e => e.kuerzel === uiState.selectedEinrichtung);
        }
        
        container.innerHTML = '';
        console.log('🔧 Container gefunden:', container);
        console.log('🔧 Container Klassen:', container.className);
        console.log('🔧 Anzuzeigende Einrichtungen:', anzuzeigeEinrichtungen.length);
        
        // WICHTIG: NUR EINE EINRICHTUNG zur Zeit anzeigen!
        // Bei mehreren Einrichtungen zeigen wir nur die erste oder die ausgewählte
        let anzuzeigeEinrichtung;
        if (uiState.selectedEinrichtung) {
            anzuzeigeEinrichtung = einrichtungen.find(e => e.kuerzel === uiState.selectedEinrichtung);
        } else {
            anzuzeigeEinrichtung = einrichtungen[0]; // Erste verfügbare Einrichtung
        }
        
        if (!anzuzeigeEinrichtung) {
            container.innerHTML = '<div class="alert alert-warning">Keine Einrichtung verfügbar</div>';
            return;
        }
        
        // WICHTIG: Container selbst zum Grid machen - CARD-LAYOUT für 12 MONATE!
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(4, 1fr)';
        container.style.gridTemplateRows = 'repeat(3, minmax(280px, 1fr))'; // Mindesthöhe pro Zeile
        container.style.gap = '16px'; // Perfekte Abstände zwischen Cards
        container.style.height = 'max(90vh, 920px)'; // Dynamische Höhe
        container.style.minHeight = 'calc((280px * 3) + (16px * 2) + (16px * 2))'; // 920px minimum
        container.style.maxHeight = '95vh'; // Max für sehr große Bildschirme
        container.style.padding = '16px'; // Mehr Padding um Container
        container.style.overflow = 'hidden'; // Kein Scroll
        container.style.background = '#f1f5f9'; // Hintergrund für Card-Kontrast
        container.style.alignItems = 'stretch'; // Alle Items gleich hoch
        container.style.justifyItems = 'stretch'; // Alle Items gleich breit
        container.classList.add('jahreskalender-grid-container');
        console.log('📅 Container: 4x3 Grid mit Card-Layout für 12 Monate erstellt!');
        
        // Info-Div außerhalb des Grids anzeigen (wenn mehrere Einrichtungen)
        if (einrichtungen.length > 1) {
            const parentContainer = container.parentElement;
            let infoDiv = parentContainer.querySelector('.einrichtung-info');
            if (!infoDiv) {
                infoDiv = document.createElement('div');
                infoDiv.className = 'einrichtung-info alert alert-info mb-3';
                parentContainer.insertBefore(infoDiv, container);
            }
            infoDiv.innerHTML = `
                <strong>Angezeigt:</strong> ${anzuzeigeEinrichtung.name} 
                (${einrichtungen.length - 1} weitere verfügbar - verwende Einrichtungsfilter)
            `;
        }
        
        // EINEN Jahreskalender für die ausgewählte Einrichtung erstellen
        console.log(`🔧 Erstelle Kalender für:`, anzuzeigeEinrichtung.name);
        const kalenderHTML = buildJahreskalender(jahr, anzuzeigeEinrichtung, jahresDaten, statusDefinitionen);
        console.log('🔧 Generiertes HTML (erste 200 Zeichen):', kalenderHTML.substring(0, 200));
        container.insertAdjacentHTML('beforeend', kalenderHTML);
        
        // Prüfe was tatsächlich im Container ist
        console.log('🔧 Container Inhalt nach dem Laden:', container.innerHTML.substring(0, 500));
        console.log('🔧 Monatskalender gefunden:', container.querySelectorAll('.monatskalender').length);
        console.log('🔧 Container ist jetzt Grid:', window.getComputedStyle(container).display);
        console.log('🔧 Grid Template Columns:', window.getComputedStyle(container).gridTemplateColumns);
        
        // Event-Listener für Tag-Klicks registrieren
        registerDayClickListeners();
        
        console.log(`📅 Jahreskalender für ${anzuzeigeEinrichtungen.length} Einrichtung(en) geladen`);
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Ferienverwaltung:', error);
    }
}

/**
 * Erstellt einen Jahreskalender für eine Einrichtung
 */
function buildJahreskalender(jahr, einrichtung, jahresDaten, statusDefinitionen) {
    const monate = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    
    const wochentage = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    
    // DIREKTE GRID-STRUKTUR ohne zusätzliche Wrapper!
    // Der Container wird direkt zum Grid-Container
    let kalenderHTML = '';
    
    // 12 Monatskalender generieren - DIREKT als Grid-Items
    console.log('🔧 Generiere 12 Monatskalender direkt als Grid-Items...');
    for (let monat = 0; monat < 12; monat++) {
        console.log(`🔧 Erstelle Monat ${monat + 1}: ${monate[monat]}`);
        const monatsHTML = buildMonatskalender(jahr, monat, einrichtung, jahresDaten, statusDefinitionen, monate[monat], wochentage);
        console.log(`🔧 HTML für ${monate[monat]} (erste 100 Zeichen):`, monatsHTML.substring(0, 100));
        kalenderHTML += monatsHTML;
    }
    console.log('🔧 Alle 12 Monate generiert - OHNE Wrapper!');
    
    return kalenderHTML;
}

/**
 * Erstellt einen einzelnen Monatskalender
 */
function buildMonatskalender(jahr, monat, einrichtung, jahresDaten, statusDefinitionen, monatsName, wochentage) {
    const firstDay = new Date(jahr, monat, 1);
    const lastDay = new Date(jahr, monat + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7; // Montag = 0
    const heute = new Date();
    
    let html = `
        <div class="monatskalender">
            <div class="monatskalender-header">
                <i class="bi bi-calendar3 me-2"></i>
                ${monatsName} ${jahr}
            </div>
            <div class="monatskalender-grid">
    `;
    
    // Wochentag-Header
    wochentage.forEach(tag => {
        html += `<div class="wochentag-header">${tag}</div>`;
    });
    
    // Leere Zellen für Tage vor dem Monatsanfang
    for (let i = 0; i < startWeekday; i++) {
        const prevMonth = new Date(jahr, monat, 0);
        const day = prevMonth.getDate() - startWeekday + i + 1;
        html += `<div class="tag-zelle andere-monat">${day}</div>`;
    }
    
    // Tage des aktuellen Monats
    for (let tag = 1; tag <= lastDay.getDate(); tag++) {
        const datum = `${jahr}-${String(monat + 1).padStart(2, '0')}-${String(tag).padStart(2, '0')}`;
        const tagDatum = new Date(jahr, monat, tag);
        const wochentag = tagDatum.getDay(); // 0=Sonntag, 6=Samstag
        const istWochenende = wochentag === 0 || wochentag === 6; // Sonntag oder Samstag
        
        const tagStatus = getDayStatus(einrichtung.kuerzel, datum);
        const istHeute = heute.getFullYear() === jahr && heute.getMonth() === monat && heute.getDate() === tag;
        const istFeiertag = isOesterreichischerFeiertag(datum); // Synchrone Prüfung
        
        let classes = ['tag-zelle'];
        let tooltip = '';
        
        // Basis-Klassen
        if (istHeute) classes.push('heute');
        if (istWochenende) classes.push('wochenende');
        if (istFeiertag) classes.push('feiertag');
        
        // Status-spezifische Klassen
        if (tagStatus.status !== 'normal') {
            classes.push(`status-${tagStatus.status}`);
            classes.push('hat-status');
            tooltip = tagStatus.grund;
        } else if (istFeiertag) {
            tooltip = 'Österreichischer Feiertag';
        } else if (istWochenende) {
            tooltip = wochentag === 0 ? 'Sonntag' : 'Samstag';
        } else {
            tooltip = 'Normaler Arbeitstag';
        }
        
        html += `
            <div class="${classes.join(' ')}" 
                 data-datum="${datum}" 
                 data-einrichtung="${einrichtung.kuerzel}"
                 data-wochentag="${wochentag}"
                 title="${tooltip}">
                ${tag}
            </div>
        `;
    }
    
    // Leere Zellen für Tage nach dem Monatsende
    const totalCells = Math.ceil((startWeekday + lastDay.getDate()) / 7) * 7;
    const daysAfter = totalCells - (startWeekday + lastDay.getDate());
    for (let i = 1; i <= daysAfter; i++) {
        html += `<div class="tag-zelle andere-monat">${i}</div>`;
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

/**
 * Lädt und rendert die Kinderverteilung (vereinfacht)
 */
async function loadVerteilungTab() {
    try {
        console.log('🔄 Lade Kinderverteilung...');
        
        const container = document.getElementById('kw-ubersicht');
        if (!container) return;
        
        // Berechne 3 sichtbare KWs (aktuell -1, aktuell, aktuell +1)
        const aktuelleKW = getCurrentWeek();
        uiState.visibleKWs = [aktuelleKW - 1, aktuelleKW, aktuelleKW + 1];
        
        container.innerHTML = `
            <div class="alert alert-info">
                <h5><i class="bi bi-info-circle me-2"></i>Kinderverteilung</h5>
                <p>Die KW-basierte Kinderverteilung wird hier implementiert.</p>
                <p><strong>Aktuelle KW:</strong> ${aktuelleKW}</p>
                <p><strong>Sichtbare KWs:</strong> ${uiState.visibleKWs.join(', ')}</p>
            </div>
        `;
        
        console.log(`🔄 Kinderverteilung für KW ${uiState.visibleKWs.join(', ')} vorbereitet`);
        
    } catch (error) {
        console.error('❌ Fehler beim Laden der Kinderverteilung:', error);
    }
}

/**
 * Registriert Event-Listener für Tag-Klicks im Kalender
 */
function registerDayClickListeners() {
    document.querySelectorAll('.tag-zelle:not(.andere-monat)').forEach(tagElement => {
        tagElement.addEventListener('click', (event) => {
            const datum = event.target.dataset.datum;
            const einrichtung = event.target.dataset.einrichtung;
            
            if (datum && einrichtung) {
                openStatusModal(datum, einrichtung);
            }
        });
    });
}

/**
 * Öffnet das Status-Änderungs-Modal
 */
function openStatusModal(datum, einrichtungKuerzel) {
    const modal = document.getElementById('status-modal');
    const modalDatum = document.getElementById('modal-datum');
    const modalEinrichtung = document.getElementById('modal-einrichtung');
    const modalStatusSelect = document.getElementById('modal-status-select');
    const modalGrundInput = document.getElementById('modal-grund-input');
    
    if (!modal) return;
    
    // Einrichtungsname ermitteln
    const einrichtungen = getEinrichtungen();
    const einrichtung = einrichtungen.find(e => e.kuerzel === einrichtungKuerzel);
    const einrichtungName = einrichtung ? einrichtung.name : einrichtungKuerzel;
    
    // Aktueller Status laden
    const currentStatus = getDayStatus(einrichtungKuerzel, datum);
    
    // Modal befüllen
    modalDatum.value = new Date(datum).toLocaleDateString('de-DE');
    modalEinrichtung.value = einrichtungName;
    modalGrundInput.value = currentStatus.grund || '';
    
    // Status-Select befüllen
    const statusDefinitionen = getStatusDefinitionen();
    modalStatusSelect.innerHTML = '';
    
    Object.entries(statusDefinitionen).forEach(([key, status]) => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = `${status.icon} ${status.label}`;
        if (key === currentStatus.status) {
            option.selected = true;
        }
        modalStatusSelect.appendChild(option);
    });
    
    // Event-Listener für Speichern-Button
    const saveBtn = document.getElementById('modal-save-btn');
    saveBtn.onclick = () => saveStatusFromModal(datum, einrichtungKuerzel);
    
    // Modal anzeigen
    const bootstrapModal = new bootstrap.Modal(modal);
    bootstrapModal.show();
}

/**
 * Speichert den Status aus dem Modal
 */
async function saveStatusFromModal(datum, einrichtungKuerzel) {
    try {
        const modalStatusSelect = document.getElementById('modal-status-select');
        const modalGrundInput = document.getElementById('modal-grund-input');
        
        const status = modalStatusSelect.value;
        const grund = modalGrundInput.value.trim();
        
        await saveDayStatus(einrichtungKuerzel, datum, status, grund);
        
        // Modal schließen
        const modal = bootstrap.Modal.getInstance(document.getElementById('status-modal'));
        modal.hide();
        
        // UI aktualisieren
        await loadFerienTab();
        
        console.log(`✅ Status für ${einrichtungKuerzel} am ${datum} gespeichert`);
        
    } catch (error) {
        console.error('❌ Fehler beim Speichern:', error);
        alert('Fehler beim Speichern des Status: ' + error.message);
    }
}

/**
 * Registriert globale Event-Listener
 */
function registerEventListeners() {
    console.log('🔧 Event-Listener registriert');
}

/**
 * Prüft ob ein Datum ein österreichischer Feiertag ist
 * TODO: Später durch externe API erweitern
 */
function isOesterreichischerFeiertag(datum) {
    const date = new Date(datum);
    const tag = date.getDate();
    const monat = date.getMonth() + 1; // JavaScript Monate sind 0-basiert
    const jahr = date.getFullYear();
    
    // Fixe österreichische Feiertage
    const fixeFeiertage = [
        { tag: 1, monat: 1 },   // Neujahr
        { tag: 6, monat: 1 },   // Heilige Drei Könige
        { tag: 1, monat: 5 },   // Tag der Arbeit
        { tag: 15, monat: 8 },  // Mariä Himmelfahrt
        { tag: 26, monat: 10 }, // Nationalfeiertag
        { tag: 1, monat: 11 },  // Allerheiligen
        { tag: 8, monat: 12 },  // Mariä Empfängnis
        { tag: 25, monat: 12 }, // Weihnachten
        { tag: 26, monat: 12 }  // Stefanitag
    ];
    
    // Prüfe fixe Feiertage
    for (const feiertag of fixeFeiertage) {
        if (tag === feiertag.tag && monat === feiertag.monat) {
            return true;
        }
    }
    
    // TODO: Variable Feiertage (Ostern, Pfingsten, etc.) berechnen
    // Das würde eine Oster-Berechnung erfordern oder eine externe API
    
    return false;
}

/**
 * Lädt österreichische Feiertage von einer externen API (zukünftig)
 * TODO: Implementierung mit https://feiertage-api.de/ oder ähnlicher API
 */
async function loadOesterreichischeFeiertage(jahr) {
    try {
        // Beispiel für zukünftige API-Integration
        // const response = await fetch(`https://feiertage-api.de/api/?jahr=${jahr}&nur_land=AT`);
        // const feiertage = await response.json();
        // return feiertage;
        
        console.log(`🎉 Österreichische Feiertage für ${jahr} würden hier geladen werden`);
        return {};
    } catch (error) {
        console.warn('⚠️ Fehler beim Laden der Feiertage:', error);
        return {};
    }
} 