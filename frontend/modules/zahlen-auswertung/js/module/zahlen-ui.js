/**
 * UI-Funktionen für Zahlen-Auswertung
 * Rendert Desktop-Tabelle und Mobile-Akkordeon
 * OPTIMIERT: Verwendet neuen Event-Manager statt DOM-Cloning
 */

import { 
    klassifiziereAnzahl, 
    formatiereZeitpunkt, 
    berechneProzentAuslastung 
} from './bestelldaten-api.js';
import { sanitizeHTML } from './data-validator.js';

/**
 * Zeigt Loading-Spinner an (EXPORT für script.js)
 */
export function showLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorContainer = document.getElementById('error-container');
    const desktopContainer = document.getElementById('desktop-container');
    const smartphoneContainer = document.getElementById('smartphone-container');
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (errorContainer) errorContainer.classList.add('d-none');
    if (desktopContainer) desktopContainer.style.display = 'none';
    if (smartphoneContainer) smartphoneContainer.style.display = 'none';
    
    console.log('⏳ Loading-Spinner angezeigt');
}

/**
 * Versteckt Loading-Spinner (EXPORT für script.js)
 */
export function hideLoading() {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
    console.log('✅ Loading-Spinner versteckt');
}

/**
 * Zeigt Fehlermeldung an (EXPORT für script.js)
 * @param {string} message - Fehlermeldung
 */
export function showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    
    if (errorContainer && errorMessage) {
        errorMessage.textContent = sanitizeHTML(message);
        errorContainer.classList.remove('d-none');
        console.error('🚨 Fehler angezeigt:', message);
    }
}

/**
 * Hauptfunktion zum Rendern der Bestelldaten (EXPORT für script.js)
 * @param {Object} bestelldaten - Bestelldaten
 */
export function renderBestelldaten(bestelldaten) {
    console.log('🎨 Rendere Bestelldaten für aktuellen Viewport');
    
    hideLoading();
    
    // Responsive Logik: Desktop vs Mobile basierend auf Bildschirmbreite
    const istMobile = window.innerWidth < 819;
    console.log(`📱 Mobile Ansicht (< 819px): ${istMobile ? 'JA' : 'NEIN'} (${window.innerWidth}px)`);
    
    if (istMobile) {
        // Mobile: Akkordeon-Ansicht nach Tagen im gleichen Container
        renderMobileAkkordeonInContainer(bestelldaten);
    } else {
        // Desktop/Tablet: Tabellen-Ansicht
        renderDesktopTabelle(bestelldaten);
    }
}

/**
 * Rendert die Desktop-Tabelle mit Bestelldaten (ANGEPASST für neue HTML-Struktur)
 * @param {Object} bestelldaten - Verarbeitete Bestelldaten
 */
export function renderDesktopTabelle(bestelldaten) {
    const container = document.getElementById('zahlen-container');
    if (!container) {
        console.error('❌ zahlen-container Element nicht gefunden');
        return;
    }

    // Validiere Eingabedaten
    if (!bestelldaten) {
        console.error('❌ Keine Bestelldaten erhalten');
        container.innerHTML = `
            <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle fs-3 mb-2"></i>
                    <br>Fehler beim Laden der Bestelldaten
            </div>
        `;
        return;
    }

    if (!bestelldaten.einrichtungen || !Array.isArray(bestelldaten.einrichtungen)) {
        console.error('❌ Einrichtungen-Array fehlt oder ist ungültig:', bestelldaten.einrichtungen);
        container.innerHTML = `
            <div class="alert alert-warning text-center">
                    <i class="bi bi-exclamation-triangle fs-3 mb-2"></i>
                    <br>Einrichtungsdaten sind fehlerhaft
            </div>
        `;
        return;
    }

    if (bestelldaten.einrichtungen.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                    <i class="bi bi-inbox fs-3 mb-2"></i>
                    <br>Keine Bestelldaten verfügbar
            </div>
        `;
        return;
    }

    const { einrichtungen, tage } = bestelldaten;
    
    // Validiere Tage-Array
    if (!tage || !Array.isArray(tage)) {
        console.error('❌ Tage-Array fehlt oder ist ungültig:', tage);
        return;
    }
    
    console.log(`✅ Rendere ${einrichtungen.length} Einrichtungen für KW ${bestelldaten.week}/${bestelldaten.year}`);
    
    // Erstelle Desktop-Tabelle
    const tableHtml = `
        <div class="card shadow-sm">
            <div class="card-body p-3">
                <table class="table table-hover mb-0 zahlen-tabelle">
                    <thead class="table-primary">
                        <tr>
                            <th scope="col" class="sticky-col">Einrichtung</th>
                            <th scope="col" class="text-center">MO</th>
                            <th scope="col" class="text-center">DI</th>
                            <th scope="col" class="text-center">MI</th>
                            <th scope="col" class="text-center">DO</th>
                            <th scope="col" class="text-center">FR</th>
                            <th scope="col" class="text-center">SA</th>
                            <th scope="col" class="text-center">SO</th>
                            <th scope="col" class="text-center">Gesamt</th>
                            <th scope="col" class="text-center">Info</th>
                        </tr>
                    </thead>
                    <tbody id="desktop-tabelle-body">
                        ${renderTableRows(einrichtungen, tage)}
                    </tbody>
                    <tfoot class="table-secondary fw-bold">
                        ${renderGesamtZeile(einrichtungen, tage)}
                    </tfoot>
                </table>
            </div>
        </div>
    `;
    
    container.innerHTML = tableHtml;
    
    console.log(`✅ Desktop-Tabelle erfolgreich gerendert: ${einrichtungen.length} Einrichtungen`);
}

/**
 * Rendert die Tabellenzeilen für Einrichtungen
 * @param {Array} einrichtungen - Einrichtungen-Array
 * @param {Array} tage - Tage-Array
 * @returns {string} HTML für Tabellenzeilen
 */
function renderTableRows(einrichtungen, tage) {
    let html = '';
    
    // Rendere Datenzeilen mit robuster Fehlerbehandlung
    einrichtungen.forEach((einrichtung, index) => {
        try {
            // Validiere Einrichtungsdaten
            if (!einrichtung || typeof einrichtung !== 'object') {
                console.error(`❌ Einrichtung ${index + 1} ist ungültig:`, einrichtung);
                return;
            }

            if (!einrichtung.id || !einrichtung.name) {
                console.error(`❌ Einrichtung ${index + 1} fehlt ID oder Name:`, einrichtung);
                return;
            }

            if (!einrichtung.tage_daten || typeof einrichtung.tage_daten !== 'object') {
                console.error(`❌ Einrichtung ${index + 1} fehlt tage_daten:`, einrichtung);
                return;
            }
            
            // Sichere HTML-Erstellung
            const einrichtungName = sanitizeHTML(einrichtung.name || 'Unbekannt');
            const einrichtungTyp = sanitizeHTML(einrichtung.typ || 'unbekannt');
            const gruppenHtml = (einrichtung.gruppen || []).length > 0 
                ? `<span>Maximal:</span>` + 
                  (einrichtung.gruppen || []).map(g => 
                      `<div>${sanitizeHTML(g.name || '')}: ${g.anzahl || 0}</div>`
                  ).join('')
                : '';
            
            html += `
                <tr>
                <!-- Einrichtungs-Spalte -->
                <td class="sticky-col">
                    <div class="einrichtung-info">
                        <div class="einrichtung-name">${einrichtungName}</div>
                        <div class="einrichtung-typ">${einrichtungTyp}</div>
                        <div class="einrichtung-gruppen">
                            ${gruppenHtml}
                        </div>
                    </div>
                </td>
                
                <!-- Tage-Spalten -->
                ${tage.map(tag => {
                    const tagData = einrichtung.tage_daten[tag];
                    if (!tagData) {
                        return `<td class="zahlen-zelle null"><div class="zahlen-hauptwert">-</div></td>`;
                    }
                    
                    const summe = tagData.summe || 0;
                    
                    // Berechne prozentuale Klassifizierung für die Gesamtsumme
                    let dominanteKlassifizierung = 'null';
                    if (tagData.gruppen_details && Array.isArray(tagData.gruppen_details) && tagData.gruppen_details.length > 0) {
                        const klassifizierungen = tagData.gruppen_details.map(g => g.klassifizierung || 'null');
                        if (klassifizierungen.includes('hoch')) dominanteKlassifizierung = 'hoch';
                        else if (klassifizierungen.includes('mittel')) dominanteKlassifizierung = 'mittel';
                        else if (klassifizierungen.includes('niedrig')) dominanteKlassifizierung = 'niedrig';
                    }
                    
                    const gruppenDetailsHtml = (tagData.gruppen_details && Array.isArray(tagData.gruppen_details)) 
                        ? tagData.gruppen_details.map(g => {
                            // Tablet-spezifische zweizeilige Darstellung
                            const gruppenText = `${sanitizeHTML(g.gruppe || '')}:\n${g.anzahl || 0}`;
                            const titleText = `${sanitizeHTML(g.gruppe)}: ${g.anzahl || 0}`;
                            
                            return `
                                <span class="gruppen-badge" title="${titleText}">
                                    ${gruppenText}
                                </span>
                            `;
                        }).join('')
                        : '';
                    
                    return `
                        <td class="zahlen-zelle ${dominanteKlassifizierung}">
                            <div class="zahlen-hauptwert">${summe || '-'}</div>
                            ${gruppenDetailsHtml ? `<div class="gruppen-detail">${gruppenDetailsHtml}</div>` : ''}
                        </td>
                    `;
                }).join('')}
                
                <!-- Gesamt-Spalte -->
                <td class="zahlen-zelle gesamt-zelle">
                    ${einrichtung.gesamt_bestellungen || 0}
                </td>
                
                <!-- Info-Button -->
                <td class="text-center">
                    <button class="btn btn-sm info-btn ${einrichtung.hatUngeleseneInfos ? 'info-btn-ungelesen' : 'info-btn-gelesen'}" 
                                data-einrichtung-id="${sanitizeHTML(einrichtung.id)}"
                            data-bs-toggle="modal" 
                            data-bs-target="#info-modal"
                            title="${einrichtung.hatUngeleseneInfos ? `${einrichtung.anzahlUngeleseneInfos} ungelesene Information(en)` : 'Informationen anzeigen'}">
                        <i class="bi bi-info-circle"></i>
                    </button>
                </td>
                </tr>
            `;
            
            console.log(`✅ Einrichtung ${index + 1}/${einrichtungen.length} erfolgreich gerendert: ${einrichtungName}`);
            
        } catch (error) {
            console.error(`❌ Fehler beim Rendern von Einrichtung ${index + 1}:`, error);
            console.error('Einrichtungsdaten:', einrichtung);
            
            // Füge Fehler-Zeile hinzu
            html += `
                <tr>
                <td colspan="10" class="text-center text-danger py-2">
                    <small><i class="bi bi-exclamation-triangle"></i> Fehler beim Laden von Einrichtung ${index + 1}</small>
                </td>
                </tr>
            `;
        }
    });
    
    return html;
}

/**
 * Rendert die Gesamt-Zeile für Desktop-Tabelle
 * @param {Array} einrichtungen - Einrichtungen-Array
 * @param {Array} tage - Tage-Array
 * @returns {string} HTML für Gesamt-Zeile
 */
function renderGesamtZeile(einrichtungen, tage) {
    // Berechne Gesamt-Summen pro Tag
    const tagesSummen = {};
    let gesamtAlleEinrichtungen = 0;
    
    // Initialisiere alle Tage mit 0
    tage.forEach(tag => {
        tagesSummen[tag] = 0;
    });
    
    // Summiere alle Einrichtungen
    einrichtungen.forEach(einrichtung => {
        if (einrichtung.tage_daten) {
    tage.forEach(tag => {
                const tagData = einrichtung.tage_daten[tag];
                if (tagData && tagData.summe) {
                    tagesSummen[tag] += tagData.summe;
                }
            });
        }
        if (einrichtung.gesamt_bestellungen) {
            gesamtAlleEinrichtungen += einrichtung.gesamt_bestellungen;
        }
    });
    
    return `
        <tr>
        <td class="sticky-col">
            <div class="einrichtung-info">
                <div class="einrichtung-name">GESAMT</div>
                <div class="einrichtung-typ">${einrichtungen.length} Einrichtungen</div>
            </div>
        </td>
        ${tage.map(tag => `
                <td class="zahlen-zelle gesamt-zelle text-center">
                    ${tagesSummen[tag] || 0}
            </td>
        `).join('')}
            <td class="zahlen-zelle gesamt-zelle text-center">
                ${gesamtAlleEinrichtungen}
        </td>
        <td class="text-center">
                <i class="bi bi-check-circle text-success"></i>
        </td>
        </tr>
    `;
}

/**
 * Rendert das Mobile-Akkordeon mit Bestelldaten
 * @param {Object} bestelldaten - Verarbeitete Bestelldaten
 */
export function renderMobileAkkordeon(bestelldaten) {
    const accordion = document.getElementById('mobile-accordion');
    if (!accordion) return;

    accordion.innerHTML = '';

    // ✅ KORREKTUR: Auch bei leeren Daten die Datumsstruktur anzeigen
    if (!bestelldaten) {
        accordion.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-exclamation-triangle display-4 mb-3"></i>
                <h5>Fehler beim Laden der Daten</h5>
            </div>
        `;
        return;
    }

    // ✅ VERBESSERUNG: Stelle sicher dass year/week verfügbar sind, auch bei leeren Einrichtungen
    const currentYear = bestelldaten.year || new Date().getFullYear();
    const currentWeek = bestelldaten.week || getCurrentWeek();
    
    // Wenn keine Einrichtungen vorhanden sind, zeige trotzdem die Tagesstruktur
    if (!bestelldaten.einrichtungen || bestelldaten.einrichtungen.length === 0) {
        console.log('📱 Rendere leere Smartphone-Ansicht mit Datumsheadern');
        renderEmptyMobileView(accordion, currentYear, currentWeek);
        return;
    }

    // Normale Anzeige mit Daten
    renderSmartphoneAnsicht(bestelldaten);
}

/**
 * Rendert Mobile-Akkordeon-Ansicht im zahlen-container (NEUE IMPLEMENTATION)
 * @param {Object} bestelldaten - Verarbeitete Bestelldaten
 */
function renderMobileAkkordeonInContainer(bestelldaten) {
    const container = document.getElementById('zahlen-container');
    if (!container) {
        console.error('❌ zahlen-container Element nicht gefunden');
        return;
    }

    // Validiere Eingabedaten
    if (!bestelldaten) {
        container.innerHTML = `
            <div class="alert alert-warning text-center">
                <i class="bi bi-exclamation-triangle fs-3 mb-2"></i>
                <br>Fehler beim Laden der Bestelldaten
            </div>
        `;
        return;
    }

    if (!bestelldaten.einrichtungen || bestelldaten.einrichtungen.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info text-center">
                <i class="bi bi-inbox fs-3 mb-2"></i>
                <br>Keine Bestelldaten verfügbar
            </div>
        `;
        return;
    }

    console.log(`📱 Rendere Mobile-Akkordeon für ${bestelldaten.einrichtungen.length} Einrichtungen`);

    // Wochentage definieren
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const wochentageName = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    let html = '<div id="smartphone-tage-accordion">';

    wochentage.forEach((tag, index) => {
        const tagName = wochentageName[index];
        const tagDatum = getTagDatum(bestelldaten?.year || new Date().getFullYear(), bestelldaten?.week || getCurrentWeek(), tag);
        const tagDatumFormatiert = tagDatum.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit' 
        });

        // Tages-Gesamtsumme berechnen
        let tagesGesamtsumme = 0;
        const tagesEinrichtungen = [];

        bestelldaten.einrichtungen.forEach(einrichtung => {
            const tagesWert = getTagesWert(einrichtung, tag);
            tagesGesamtsumme += tagesWert;
            
            // Sanitisiere alle Ausgabedaten
            const einrichtungsDaten = {
                id: sanitizeHTML(einrichtung.id),
                name: sanitizeHTML(einrichtung.name),
                typ: sanitizeHTML(einrichtung.typ),
                tagesWert: tagesWert,
                gruppenDetail: getGruppenDetail(einrichtung, tag),
                infoStatus: einrichtung.hatUngeleseneInfos ? 'ungelesen' : 'gelesen'
            };
            tagesEinrichtungen.push(einrichtungsDaten);
        });

        const isFirst = index === 0;
        const collapseId = `collapse-${tag}`;
        const tagesInfoStatus = tagesEinrichtungen.some(e => e.infoStatus === 'ungelesen') ? 'ungelesen' : 'gelesen';

        html += `
            <div class="mobile-accordion-item">
                <!-- Header: Wochentag + Datum + Gesamtzahl -->
                <div class="mobile-accordion-header ${isFirst ? 'aktiv' : ''}" 
                     data-accordion-target="${sanitizeHTML(collapseId)}"
                     role="button"
                     tabindex="0"
                     aria-expanded="${isFirst ? 'true' : 'false'}" 
                     aria-controls="${sanitizeHTML(collapseId)}">
                    
                    <div class="mobile-tag-header">
                        <h6 class="mobile-tag-name">${sanitizeHTML(tagName)}</h6>
                        <span class="mobile-tag-datum">${sanitizeHTML(tagDatumFormatiert)}</span>
                        <span class="mobile-tag-gesamtzahl">${tagesGesamtsumme || 0}</span>
                    </div>
                    
                    <i class="bi bi-chevron-down mobile-chevron"></i>
                </div>
                
                <!-- Content: Tabellen-Layout -->
                <div id="${sanitizeHTML(collapseId)}" 
                     class="mobile-accordion-content ${isFirst ? 'show' : ''}"
                     aria-labelledby="header-${sanitizeHTML(collapseId)}">
                    
                    <table class="mobile-einrichtungen-tabelle">
                        <tbody>`;

        // Einrichtungs-Zeilen in Tabellenformat
        tagesEinrichtungen.forEach(einrichtung => {
            const tagesWertKlasse = getTagesWertKlasse(einrichtung.tagesWert);
            const hauptwert = einrichtung.tagesWert || '-';
            
            // Gruppen-Details als kleine Badges
            let gruppenHtml = '';
            if (einrichtung.gruppenDetail) {
                const gruppenMatches = einrichtung.gruppenDetail.match(/title="([^"]+)"/g);
                if (gruppenMatches) {
                    gruppenMatches.forEach(match => {
                        const gruppenInfo = match.replace('title="', '').replace('"', '');
                        gruppenHtml += `<span class="mobile-gruppen-badge-klein">${sanitizeHTML(gruppenInfo)}</span>`;
                    });
                }
            }
            
            html += `
                <tr>
                    <!-- Spalte 1: Einrichtungsname -->
                    <td class="mobile-einrichtung-name">
                        <h6>${einrichtung.name}</h6>
                        <div class="mobile-einrichtung-typ">${einrichtung.typ}</div>
                    </td>
                    
                    <!-- Spalte 2: Hauptwert -->
                    <td class="mobile-einrichtung-zahlen">
                        <div class="mobile-hauptwert ${sanitizeHTML(tagesWertKlasse)}">${sanitizeHTML(String(hauptwert))}</div>
                    </td>
                    
                    <!-- Spalte 3: Gruppen-Info + Info-Button -->
                    <td class="mobile-gruppen-spalte">
                        <div class="mobile-gruppen-info">${gruppenHtml}</div>
                        
                        <!-- Info-Button für Einrichtung -->
                        <button class="btn mobile-einrichtung-info-btn info-btn-${sanitizeHTML(einrichtung.infoStatus)}" 
                                data-einrichtung-id="${einrichtung.id}" 
                                data-bs-toggle="modal" 
                                data-bs-target="#info-modal" 
                                title="Informationen anzeigen">
                            <i class="bi bi-info-circle"></i>
                        </button>
                    </td>
                </tr>`;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
    
    // Setup für Akkordeon-Events
    setupMobileAccordionEvents();
    
    console.log(`✅ Mobile-Akkordeon erfolgreich gerendert`);
}

/**
 * Setup für Mobile-Akkordeon Events (KORRIGIERTE VERSION)
 */
function setupMobileAccordionEvents() {
    console.log('🎛️ Setup Mobile-Akkordeon Events');
    
    const headers = document.querySelectorAll('.mobile-accordion-header');
    
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = header.getAttribute('data-accordion-target');
            const content = document.getElementById(targetId);
            const chevron = header.querySelector('.mobile-chevron');
            
            if (!content || !chevron) return;
            
            // Toggle aktuellen Content
            const isAktiv = content.classList.contains('show');
            
            // Schließe alle anderen Akkordeons
            document.querySelectorAll('.mobile-accordion-content').forEach(otherContent => {
                if (otherContent !== content) {
                    otherContent.classList.remove('show');
                }
            });
            
            document.querySelectorAll('.mobile-accordion-header').forEach(otherHeader => {
                if (otherHeader !== header) {
                    otherHeader.classList.remove('aktiv');
                    const otherChevron = otherHeader.querySelector('.mobile-chevron');
                    if (otherChevron) {
                        otherChevron.classList.remove('bi-chevron-up');
                        otherChevron.classList.add('bi-chevron-down');
                    }
                }
            });
            
            if (isAktiv) {
                // Schließen
                content.classList.remove('show');
                header.classList.remove('aktiv');
                chevron.classList.remove('bi-chevron-up');
                chevron.classList.add('bi-chevron-down');
            } else {
                // Öffnen
                content.classList.add('show');
                header.classList.add('aktiv');
                chevron.classList.remove('bi-chevron-down');
                chevron.classList.add('bi-chevron-up');
            }
        });
    });
}

/**
 * Konvertiert Tagnamen zu Anzeigenamen
 * @param {string} tag - Interner Tagname
 * @returns {string} Anzeigename
 */
function getTagDisplayName(tag) {
    const tageMap = {
        'montag': 'MO',
        'dienstag': 'DI',
        'mittwoch': 'MI',
        'donnerstag': 'DO',
        'freitag': 'FR',
        'samstag': 'SA',
        'sonntag': 'SO'
    };
    return tageMap[tag] || tag.toUpperCase();
}

/**
 * Rendert Info-Modal mit Einrichtungsdetails
 * @param {Object} einrichtung - Einrichtungsdaten
 * @param {Object} bestelldaten - Komplette Bestelldaten
 */
export function renderInfoModal(einrichtung, bestelldaten) {
    const modalBody = document.getElementById('modal-body-content');
    
    if (!modalBody) return;
    
    // Berechne zusätzliche Statistiken
    const tageStats = berechneTageStatistiken(einrichtung, bestelldaten.tage);
    const gruppenStats = berechneGruppenStatistiken(einrichtung);
    
    modalBody.innerHTML = `
        <!-- Einrichtungs-Header -->
        <div class="modal-einrichtung-header">
            <div class="modal-einrichtung-avatar">
                ${einrichtung.name.charAt(0).toUpperCase()}
            </div>
            <div class="modal-einrichtung-details">
                <h5>${einrichtung.name}</h5>
                <p class="text-muted mb-0">
                    ${einrichtung.typ.charAt(0).toUpperCase() + einrichtung.typ.slice(1)} • 
                    Letzte Aktualisierung: ${formatiereZeitpunkt(einrichtung.letzte_aktualisierung)}
                </p>
            </div>
        </div>
        
        <!-- Wochenstatistik -->
        <div class="info-section">
            <h6><i class="bi bi-bar-chart me-2"></i>Wochenstatistik</h6>
            <div class="statistik-grid">
                <div class="statistik-karte">
                    <div class="statistik-wert">${einrichtung.gesamt_bestellungen}</div>
                    <div class="statistik-label">Gesamt Bestellungen</div>
                </div>
                <div class="statistik-karte">
                    <div class="statistik-wert">${(einrichtung.gesamt_bestellungen / 7).toFixed(1)}</div>
                    <div class="statistik-label">Ø pro Tag</div>
                </div>
                <div class="statistik-karte">
                    <div class="statistik-wert">${tageStats.höchsterWert}</div>
                    <div class="statistik-label">${tageStats.höchsterTag}</div>
                </div>
                <div class="statistik-karte">
                    <div class="statistik-wert">${gruppenStats.aktivste.anzahl}</div>
                    <div class="statistik-label">${gruppenStats.aktivste.name}</div>
                </div>
            </div>
        </div>
        
        <!-- Gruppen-Übersicht -->
        <div class="info-section">
            <h6><i class="bi bi-people me-2"></i>Personengruppen</h6>
            <div class="gruppen-liste">
                ${einrichtung.gruppen.map(gruppe => `
                    <div class="gruppen-badge-large">
                        ${gruppe.name}: ${gruppe.anzahl} Personen
                    </div>
                `).join('')}
            </div>
        </div>
        
        <!-- Informationen/Nachrichten -->
        ${Object.keys(einrichtung.informationen).length > 0 ? `
        <div class="info-section">
            <h6><i class="bi bi-chat-dots me-2"></i>Informationen von der Einrichtung 
                ${einrichtung.hatUngeleseneInfos ? `<span class="badge bg-danger ms-2">${einrichtung.anzahlUngeleseneInfos} ungelesen</span>` : ''}
            </h6>
            <div class="informationen-liste">
                ${Object.entries(einrichtung.informationen).map(([tag, infos]) => `
                    <div class="informationen-tag-gruppe mb-3">
                        <h6 class="text-muted">${getVollständigerTagname(tag)}</h6>
                        ${infos.map(info => `
                            <div class="information-karte ${!info.read ? 'ungelesen' : 'gelesen'}">
                                <div class="information-header">
                                    <div class="information-titel">
                                        <strong>${info.titel}</strong>
                                        <span class="badge ${getPrioritätsBadge(info.prioritaet)} ms-2">${info.prioritaet}</span>
                                        ${!info.read ? '<span class="badge bg-danger ms-1">ungelesen</span>' : ''}
                                    </div>
                                    <small class="text-muted">
                                        ${formatiereZeitpunkt(info.erstellt_von.timestamp)}
                                    </small>
                                </div>
                                <div class="information-inhalt mt-2">
                                    ${info.inhalt}
                                </div>
                                ${!info.read ? `
                                <div class="information-actions mt-2">
                                    <button class="btn btn-sm btn-success mark-info-read-btn" 
                                            data-info-id="${info.id}"
                                            onclick="window.markiereInformationAlsGelesenHandler('${info.id}', ${bestelldaten.year}, ${bestelldaten.week})">
                                        <i class="bi bi-check-lg me-1"></i>
                                        Als gelesen markieren
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
        
        <!-- Tages-Details -->
        <div class="info-section">
            <h6><i class="bi bi-calendar-week me-2"></i>Tagesübersicht</h6>
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Tag</th>
                            <th class="text-center">Bestellungen</th>
                            <th>Gruppen-Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bestelldaten.tage.map(tag => {
                            const tagData = einrichtung.tage_daten[tag];
                            return `
                                <tr>
                                    <td class="fw-bold">${getVollständigerTagname(tag)}</td>
                                    <td class="text-center">
                                        <span class="badge bg-${getTagBadgeColor(tagData.summe)}">${tagData.summe}</span>
                                    </td>
                                    <td>
                                        ${tagData.gruppen_details.map(g => 
                                            `<small class="text-muted">${g.gruppe}: ${g.anzahl}</small>`
                                        ).join(' • ')}
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Prozentuale Auslastung Legende -->
        <div class="info-section">
            <div class="alert alert-info mb-0">
                <div class="d-flex align-items-center justify-content-between flex-wrap">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-info-circle"></i>
                        <strong>Prozentuale Auslastung:</strong>
                    </div>
                    <div class="prozent-legende">
                        <div class="prozent-legende-item">
                            <div class="prozent-legende-farbe niedrig"></div>
                            <span>1-50% (Niedrig) - Geringe Auslastung</span>
                        </div>
                        <div class="prozent-legende-item">
                            <div class="prozent-legende-farbe mittel"></div>
                            <span>51-80% (Mittel) - Gute Auslastung</span>
                        </div>
                        <div class="prozent-legende-item">
                            <div class="prozent-legende-farbe hoch"></div>
                            <span>81-100%+ (Hoch) - Optimale Auslastung</span>
                        </div>
                    </div>
                </div>
                <small class="text-muted mt-2 d-block">
                    Farben basieren auf dem Verhältnis der aktuellen Bestellungen zur maximalen Gruppenstärke der Einrichtung.
                </small>
            </div>
        </div>
    `;
}

/**
 * Berechnet Tages-Statistiken
 * @param {Object} einrichtung - Einrichtungsdaten
 * @param {Array} tage - Tagesliste
 * @returns {Object} Statistiken
 */
function berechneTageStatistiken(einrichtung, tage) {
    let höchsterWert = 0;
    let höchsterTag = '';
    
    tage.forEach(tag => {
        const wert = einrichtung.tage_daten[tag]?.summe || 0;
        if (wert > höchsterWert) {
            höchsterWert = wert;
            höchsterTag = getTagDisplayName(tag);
        }
    });
    
    return { höchsterWert, höchsterTag };
}

/**
 * Berechnet Gruppen-Statistiken
 * @param {Object} einrichtung - Einrichtungsdaten
 * @returns {Object} Statistiken
 */
function berechneGruppenStatistiken(einrichtung) {
    let aktivste = { name: '', anzahl: 0 };
    
    einrichtung.gruppen.forEach(gruppe => {
        if (gruppe.anzahl > aktivste.anzahl) {
            aktivste = { name: gruppe.name, anzahl: gruppe.anzahl };
        }
    });
    
    return { aktivste };
}

/**
 * Hilfsfunktion: Wandelt Tageskürzel in vollständige Tagnamen um
 * @param {string} tag - Tageskürzel (z.B. "MO", "TU", "WE")
 * @returns {string} Vollständiger Tagname
 */
function getVollständigerTagname(tag) {
    const tagnamen = {
        'MO': 'Montag',
        'TU': 'Dienstag', 
        'WE': 'Mittwoch',
        'TH': 'Donnerstag',
        'FR': 'Freitag',
        'SA': 'Samstag',
        'SU': 'Sonntag'
    };
    
    return tagnamen[tag] || tag;
}

/**
 * Bestimmt Badge-Farbe basierend auf Anzahl
 * @param {number} anzahl - Anzahl Bestellungen
 * @returns {string} Bootstrap-Farbe
 */
function getTagBadgeColor(anzahl) {
    if (anzahl === 0) return 'secondary';
    if (anzahl <= 5) return 'success';
    if (anzahl <= 15) return 'warning';
    return 'danger';
}

/**
 * Bestimmt Badge-Klasse für Priorität
 * @param {string} prioritaet - Priorität (niedrig/normal/hoch)
 * @returns {string} Bootstrap-Badge-Klasse
 */
function getPrioritätsBadge(prioritaet) {
    switch (prioritaet) {
        case 'hoch': return 'bg-danger';
        case 'normal': return 'bg-primary';
        case 'niedrig': return 'bg-secondary';
        default: return 'bg-secondary';
    }
}

/**
 * Zeigt/Versteckt Loading-Zustand
 * @param {boolean} isLoading - Loading-Status
 */
export function toggleLoadingState(isLoading) {
    const loadingContainer = document.getElementById('loading-container');
    const desktopAnsicht = document.getElementById('desktop-ansicht');
    const mobileAnsicht = document.getElementById('mobile-ansicht');
    const keineDatenContainer = document.getElementById('keine-daten-container');
    
    if (isLoading) {
        loadingContainer?.classList.remove('d-none');
        desktopAnsicht?.classList.add('d-none');
        mobileAnsicht?.classList.add('d-none');
        keineDatenContainer?.classList.add('d-none');
    } else {
        loadingContainer?.classList.add('d-none');
        desktopAnsicht?.classList.remove('d-none');
        mobileAnsicht?.classList.remove('d-none');
    }
}

/**
 * Zeigt "Keine Daten" Zustand
 */
export function showNoDatenState() {
    const keineDatenContainer = document.getElementById('keine-daten-container');
    const desktopAnsicht = document.getElementById('desktop-ansicht');
    const mobileAnsicht = document.getElementById('mobile-ansicht');
    
    keineDatenContainer?.classList.remove('d-none');
    desktopAnsicht?.classList.add('d-none');
    mobileAnsicht?.classList.add('d-none');
}

/**
 * Rendert alle Ansichten und fügt Resize-Event-Listener hinzu
 * @param {Object} bestelldaten - Die Bestelldaten für die Woche
 */
export function renderAlleAnsichten(bestelldaten) {
    console.log('📊 Rendere alle Ansichten - Bildschirmbreite:', window.innerWidth);
    
    // Debug-Ausgabe für Breakpoint-Logik
    const istDesktopOderTablet = window.innerWidth >= 819;
    console.log(`🖥️ Desktop/Tablet (>=819px): ${istDesktopOderTablet ? 'JA' : 'NEIN'}`);
    
    const desktopElement = document.getElementById('desktop-ansicht');
    const smartphoneElement = document.getElementById('smartphone-ansicht');
    
    if (!desktopElement || !smartphoneElement) {
        console.error('Ansicht-Elemente nicht gefunden:', { desktopElement, smartphoneElement });
        return;
    }
    
    // Desktop/Tablet-Ansicht: Gleiche Tabelle, nur unterschiedliche CSS-Spaltenbreiten
    if (istDesktopOderTablet) {
        console.log('✅ Zeige Desktop-Tabelle für >= 819px');
        desktopElement.style.setProperty('display', 'block', 'important');
        smartphoneElement.style.setProperty('display', 'none', 'important');
        renderDesktopTabelle(bestelldaten);
    } else {
        console.log('📱 Zeige Smartphone-Akkordeon für < 819px');
        // Smartphone-Ansicht: Akkordeon mit Tagen
        desktopElement.style.setProperty('display', 'none', 'important');
        smartphoneElement.style.setProperty('display', 'block', 'important');
        renderSmartphoneAnsicht(bestelldaten);
    }
    
    // Resize-Event-Listener hinzufügen (nur einmal)
    if (!window.zahlenAuswertungResizeListener) {
        window.zahlenAuswertungResizeListener = true;
        
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                console.log('🔄 Bildschirmgröße geändert auf:', window.innerWidth, 'px');
                renderAlleAnsichten(bestelldaten);
            }, 250);
        });
    }
}

/**
 * Hilfsfunktion: Berechnet aktuelle Kalenderwoche
 */
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now - start;
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
}

/**
 * Hilfsfunktion: Berechnet Tageswert für eine Einrichtung
 */
function getTagesWert(einrichtung, tag) {
    // Prüfe verschiedene mögliche Datenstrukturen
    if (einrichtung.woche && einrichtung.woche[tag]) {
        let summe = 0;
        Object.values(einrichtung.woche[tag]).forEach(gruppenDaten => {
            if (gruppenDaten && typeof gruppenDaten.bestellungen === 'number') {
                summe += gruppenDaten.bestellungen;
            }
        });
        return summe;
    }
    
    // Alternative Datenstruktur: tage_daten
    if (einrichtung.tage_daten && einrichtung.tage_daten[tag]) {
        return einrichtung.tage_daten[tag].summe || 0;
    }
    
    return 0;
}

/**
 * Hilfsfunktion: Berechnet Wochensumme für eine Einrichtung
 */
function getWochenSumme(einrichtung) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    let summe = 0;
    
    wochentage.forEach(tag => {
        summe += getTagesWert(einrichtung, tag);
    });
    
    return summe;
}

/**
 * Hilfsfunktion: Erstellt Gruppen-Informationen als String (KORRIGIERT)
 */
function getGruppenInfoString(gruppen) {
    if (!gruppen || typeof gruppen !== 'object') return '';
    
    // Konvertiere Gruppen-Objekt zu lesbarem String
    const gruppenArray = [];
    Object.entries(gruppen).forEach(([gruppe, anzahl]) => {
        if (typeof anzahl === 'number' && anzahl > 0) {
            gruppenArray.push(`${gruppe}: ${anzahl}`);
        }
    });
    
    return gruppenArray.join(', ');
}

/**
 * Hilfsfunktion: Erstellt Gruppen-Detail HTML für einen Tag
 */
function getGruppenDetail(einrichtung, tag) {
    // Prüfe woche Struktur
    if (einrichtung.woche && einrichtung.woche[tag]) {
        const gruppenBadges = [];
        Object.entries(einrichtung.woche[tag]).forEach(([gruppe, daten]) => {
            if (daten && typeof daten.bestellungen === 'number' && daten.bestellungen > 0) {
                gruppenBadges.push(`
                    <span class="gruppen-badge" title="${gruppe}: ${daten.bestellungen}">
                        ${gruppe}:\n${daten.bestellungen}
                    </span>
                `);
            }
        });
        return gruppenBadges.join('');
    }
    
    // Prüfe tage_daten Struktur
    if (einrichtung.tage_daten && einrichtung.tage_daten[tag] && einrichtung.tage_daten[tag].gruppen_details) {
        const gruppenDetails = einrichtung.tage_daten[tag].gruppen_details;
        if (Array.isArray(gruppenDetails)) {
            return gruppenDetails.map(g => `
                <span class="gruppen-badge" title="${g.gruppe}: ${g.anzahl}">
                    ${g.gruppe}:\n${g.anzahl}
                </span>
            `).join('');
        }
    }
    
    return '';
}

/**
 * Hilfsfunktion: Berechnet Datum für einen Wochentag
 */
function getTagDatum(year, week, tag) {
    const tagIndex = {
        'montag': 0, 'dienstag': 1, 'mittwoch': 2, 'donnerstag': 3,
        'freitag': 4, 'samstag': 5, 'sonntag': 6
    };
    
    // Erstes Tag des Jahres
    const firstDay = new Date(year, 0, 1);
    
    // Finde den ersten Montag des Jahres
    const firstMonday = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToAdd = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    firstMonday.setDate(firstDay.getDate() + daysToAdd);
    
    // Berechne das Datum für die gewünschte Woche und den Tag
    const targetDate = new Date(firstMonday);
    targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (tagIndex[tag] || 0));
    
    return targetDate;
}

/**
 * Hilfsfunktion: Bestimmt CSS-Klasse für Tageswert
 */
function getTagesWertKlasse(wert) {
    if (!wert || wert === 0) return 'null';
    if (wert <= 10) return 'niedrig';
    if (wert <= 25) return 'mittel';
    return 'hoch';
}

/**
 * Hilfsfunktion: Bestimmt Info-Button Status für einen Tag
 */
function getTagesInfoStatus(einrichtungen) {
    const hasUngelesen = einrichtungen.some(e => e.infoStatus === 'ungelesen');
    return hasUngelesen ? 'ungelesen' : 'gelesen';
}

/**
 * Hilfsfunktion: Bestimmt Info-Button Status für eine Einrichtung
 */
function getInfoButtonStatus(einrichtungId) {
    // Implementierung basierend auf vorhandenen ungelesenen Informationen
    return 'gelesen'; // Placeholder - sollte echte Logik verwenden
}

/**
 * Rendert die Smartphone-Ansicht mit Tages-Akkordeons (SICHERHEITS-OPTIMIERT)
 * @param {Object} bestelldaten - Die Bestelldaten für die Woche
 */
function renderSmartphoneAnsicht(bestelldaten) {
    console.log('📱 Rendere SICHERE Smartphone-Ansicht (Validierte Daten)');
    
    // FIX: Verwende zahlen-container anstatt smartphone-container
    const container = document.getElementById('zahlen-container');
    if (!container) {
        console.error('Zahlen-Container nicht gefunden');
        return;
    }

    // Wochentage definieren
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const wochentageName = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    let html = '<div id="smartphone-tage-accordion">';

    wochentage.forEach((tag, index) => {
        const tagName = wochentageName[index];
        const tagDatum = getTagDatum(bestelldaten?.year || new Date().getFullYear(), bestelldaten?.week || getCurrentWeek(), tag);
        const tagDatumFormatiert = tagDatum.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit' 
        });

        // Tages-Gesamtsumme berechnen
        let tagesGesamtsumme = 0;
        const tagesEinrichtungen = [];

        if (bestelldaten && bestelldaten.einrichtungen) {
            bestelldaten.einrichtungen.forEach(einrichtung => {
                const tagesWert = getTagesWert(einrichtung, tag);
                tagesGesamtsumme += tagesWert;
                
                // SICHERHEIT: Sanitisiere alle Ausgabedaten
                const einrichtungsDaten = {
                    id: sanitizeHTML(einrichtung.id),
                    name: sanitizeHTML(einrichtung.name),
                    typ: sanitizeHTML(einrichtung.typ),
                    tagesWert: tagesWert,
                    gruppenDetail: getGruppenDetail(einrichtung, tag),
                    infoStatus: getInfoButtonStatus(einrichtung.id)
                };
                tagesEinrichtungen.push(einrichtungsDaten);
            });
        }

        const isFirst = index === 0;
        const collapseId = `collapse-${tag}`;
        const tagesInfoStatus = getTagesInfoStatus(tagesEinrichtungen);

        // SICHERHEIT: Alle Werte sanitisiert
        html += `
            <div class="mobile-accordion-item">
                <!-- Header: Wochentag + Datum + Gesamtzahl -->
                <div class="mobile-accordion-header ${isFirst ? 'aktiv' : ''}" 
                     data-accordion-target="${sanitizeHTML(collapseId)}"
                     role="button"
                     tabindex="0"
                     aria-expanded="${isFirst ? 'true' : 'false'}" 
                     aria-controls="${sanitizeHTML(collapseId)}">
                    
                    <div class="mobile-tag-header">
                        <h6 class="mobile-tag-name">${sanitizeHTML(tagName)}</h6>
                        <span class="mobile-tag-datum">${sanitizeHTML(tagDatumFormatiert)}</span>
                        <span class="mobile-tag-gesamtzahl">${tagesGesamtsumme || 0}</span>
                    </div>
                    
                    <!-- Info-Button (nur bei geöffnetem Akkordeon sichtbar) -->
                    <button class="btn mobile-tag-info-btn info-btn-${sanitizeHTML(tagesInfoStatus)}" 
                            data-tag="${sanitizeHTML(tag)}" 
                            data-bs-toggle="modal" 
                            data-bs-target="#info-modal" 
                            title="Informationen für ${sanitizeHTML(tagName)}">
                        <i class="bi bi-info-circle"></i>
                    </button>
                    
                    <i class="bi bi-chevron-down mobile-chevron"></i>
                </div>
                
                <!-- Content: Tabellen-Layout -->
                <div id="${sanitizeHTML(collapseId)}" 
                     class="mobile-accordion-content ${isFirst ? 'show' : ''}"
                     aria-labelledby="header-${sanitizeHTML(collapseId)}">
                    
                    <table class="mobile-einrichtungen-tabelle">
                        <tbody>`;

        // Einrichtungs-Zeilen in Tabellenformat (SICHERHEITS-VALIDIERT)
        tagesEinrichtungen.forEach(einrichtung => {
            const tagesWertKlasse = getTagesWertKlasse(einrichtung.tagesWert);
            const hauptwert = einrichtung.tagesWert || '-';
            
            // Gruppen-Details als kleine Badges (SANITISIERT)
            let gruppenHtml = '';
            if (einrichtung.gruppenDetail) {
                // Extrahiere Gruppen-Info aus HTML und formatiere als kleine Badges
                const gruppenMatches = einrichtung.gruppenDetail.match(/title="([^"]+)"/g);
                if (gruppenMatches) {
                    gruppenMatches.forEach(match => {
                        const gruppenInfo = match.replace('title="', '').replace('"', '');
                        // SICHERHEIT: Sanitisiere Gruppen-Info
                        gruppenHtml += `<span class="mobile-gruppen-badge-klein">${sanitizeHTML(gruppenInfo)}</span>`;
                    });
                }
            }
            
            html += `
                <tr>
                    <!-- Spalte 1: Einrichtungsname -->
                    <td class="mobile-einrichtung-name">
                        <h6>${einrichtung.name}</h6>
                        <div class="mobile-einrichtung-typ">${einrichtung.typ}</div>
                    </td>
                    
                    <!-- Spalte 2: Hauptwert -->
                    <td class="mobile-einrichtung-zahlen">
                        <div class="mobile-hauptwert ${sanitizeHTML(tagesWertKlasse)}">${sanitizeHTML(String(hauptwert))}</div>
                    </td>
                    
                    <!-- Spalte 3: Gruppen-Info + Info-Button -->
                    <td class="mobile-gruppen-spalte">
                        <div class="mobile-gruppen-info">${gruppenHtml}</div>
                        
                        <!-- Info-Button für Einrichtung -->
                        <button class="btn mobile-einrichtung-info-btn info-btn-${sanitizeHTML(einrichtung.infoStatus)}" 
                                data-einrichtung-id="${einrichtung.id}" 
                                data-bs-toggle="modal" 
                                data-bs-target="#info-modal" 
                                title="Informationen anzeigen">
                            <i class="bi bi-info-circle"></i>
                        </button>
                    </td>
                </tr>`;
        });

        html += `
                        </tbody>
                    </table>
                </div>
            </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
    
    // FIX: Verwende die ursprüngliche setupMobileAccordionEvents Funktion
    setupMobileAccordionEvents();
}

/**
 * Rendert eine leere Mobile-Ansicht mit Datumsheadern (für Wochen ohne Daten)
 * @param {HTMLElement} container - Container-Element
 * @param {number} year - Jahr
 * @param {number} week - Kalenderwoche
 */
function renderEmptyMobileView(container, year, week) {
    const wochentage = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'];
    const wochentageName = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

    let html = '<div id="smartphone-tage-accordion">';

    wochentage.forEach((tag, index) => {
        const tagName = wochentageName[index];
        const tagDatum = getTagDatum(year, week, tag);
        const tagDatumFormatiert = tagDatum.toLocaleDateString('de-DE', { 
            day: '2-digit', 
            month: '2-digit' 
        });

        const isFirst = index === 0;
        const collapseId = `collapse-${tag}`;

        // ✅ SICHERHEIT: Alle Werte sanitisiert
        html += `
            <div class="mobile-accordion-item">
                <!-- Header: Wochentag + Datum -->
                <div class="mobile-accordion-header ${isFirst ? 'aktiv' : ''}" 
                     data-accordion-target="${sanitizeHTML(collapseId)}"
                     role="button"
                     tabindex="0"
                     aria-expanded="${isFirst ? 'true' : 'false'}" 
                     aria-controls="${sanitizeHTML(collapseId)}">
                    
                    <div class="mobile-tag-header">
                        <h6 class="mobile-tag-name">${sanitizeHTML(tagName)}</h6>
                        <span class="mobile-tag-datum">${sanitizeHTML(tagDatumFormatiert)}</span>
                        <span class="mobile-tag-gesamtzahl">0</span>
                    </div>
                    
                    <i class="bi bi-chevron-down mobile-chevron"></i>
                </div>
                
                <!-- Content: Leere Nachricht -->
                <div id="${sanitizeHTML(collapseId)}" 
                     class="mobile-accordion-content ${isFirst ? 'show' : ''}"
                     aria-labelledby="header-${sanitizeHTML(collapseId)}">
                    
                    <div class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-4 mb-2"></i>
                        <p class="mb-0">Keine Bestelldaten für ${sanitizeHTML(tagName)}</p>
                    </div>
                </div>
            </div>`;
    });

    html += '</div>';
    
    // Füge eine allgemeine Info-Nachricht hinzu
    html += `
        <div class="alert alert-info mt-3 text-center">
            <i class="bi bi-info-circle me-2"></i>
            Für KW ${week}/${year} liegen noch keine Bestelldaten vor.
        </div>
    `;
    
    container.innerHTML = html;
    
    // Setup für OPTIMIERTE Akkordeon-Events (ohne DOM-Cloning)
    setupMobileAccordionEvents();
    
    console.log(`✅ Leere Mobile-Ansicht mit Datumsheadern für KW ${week}/${year} gerendert`);
}

// Sammle alle UI-Funktionen in einem Objekt für einfachen Import
export const zahlenUI = {
    showLoading,
    hideLoading,
    showError,
    renderBestelldaten,
    renderDesktopTabelle,
    renderMobileAkkordeon,
    renderInfoModal,
    toggleLoadingState,
    showNoDatenState,
    renderAlleAnsichten
}; 
