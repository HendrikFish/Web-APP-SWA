/**
 * UI-Funktionen für Zahlen-Auswertung
 * Rendert Desktop-Tabelle und Mobile-Akkordeon
 */

import { klassifiziereAnzahl, formatiereZeitpunkt } from './bestelldaten-api.js';

/**
 * Rendert die Desktop-Tabelle mit Bestelldaten
 * @param {Object} bestelldaten - Verarbeitete Bestelldaten
 */
export function renderDesktopTabelle(bestelldaten) {
    const tbody = document.getElementById('desktop-tabelle-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!bestelldaten || bestelldaten.einrichtungen.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-3 mb-2"></i>
                    <br>Keine Bestelldaten verfügbar
                </td>
            </tr>
        `;
        return;
    }

    const { einrichtungen, tage } = bestelldaten;
    
    // Rendere Datenzeilen
    einrichtungen.forEach(einrichtung => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <!-- Einrichtungs-Spalte -->
            <td class="sticky-col">
                <div class="einrichtung-info">
                    <div class="einrichtung-name">${einrichtung.name}</div>
                    <div class="einrichtung-typ">${einrichtung.typ}</div>
                    <div class="einrichtung-gruppen">
                        ${einrichtung.gruppen.map(g => `${g.name}: ${g.anzahl}`).join(' • ')}
                    </div>
                </div>
            </td>
            
            <!-- Tage-Spalten -->
            ${tage.map(tag => {
                const tagData = einrichtung.tage_daten[tag];
                const summe = tagData.summe;
                const klassifizierung = klassifiziereAnzahl(summe);
                
                return `
                    <td class="zahlen-zelle ${klassifizierung}">
                        <div>${summe || '-'}</div>
                        ${tagData.gruppen_details.length > 0 ? `
                            <div class="gruppen-detail">
                                ${tagData.gruppen_details.map(g => `
                                    <span class="gruppen-badge">${g.gruppe}: ${g.anzahl}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </td>
                `;
            }).join('')}
            
            <!-- Gesamt-Spalte -->
            <td class="zahlen-zelle gesamt-zelle">
                ${einrichtung.gesamt_bestellungen}
            </td>
            
            <!-- Info-Button -->
            <td class="text-center">
                <button class="btn btn-sm btn-outline-info info-btn ${(!einrichtung.read || einrichtung.hatUngeleseneInfos) ? 'ungelesen' : ''}" 
                        data-einrichtung-id="${einrichtung.id}"
                        data-bs-toggle="modal" 
                        data-bs-target="#info-modal"
                        title="${einrichtung.hatUngeleseneInfos ? `${einrichtung.anzahlUngeleseneInfos} ungelesene Information(en)` : 'Informationen anzeigen'}">
                    <i class="bi bi-info-circle"></i>
                    ${einrichtung.hatUngeleseneInfos ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${einrichtung.anzahlUngeleseneInfos}</span>` : ''}
                </button>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // Füge Summen-Zeile hinzu
    rendereDesktopSummenZeile(tbody, bestelldaten);
}

/**
 * Rendert die Summen-Zeile für die Desktop-Tabelle
 * @param {HTMLElement} tbody - Tabellenkörper
 * @param {Object} bestelldaten - Bestelldaten
 */
function rendereDesktopSummenZeile(tbody, bestelldaten) {
    const { einrichtungen, tage } = bestelldaten;
    
    // Berechne Tagessummen
    const tagessummen = {};
    let wochensumme = 0;
    
    tage.forEach(tag => {
        tagessummen[tag] = einrichtungen.reduce((sum, einrichtung) => {
            return sum + (einrichtung.tage_daten[tag]?.summe || 0);
        }, 0);
        wochensumme += tagessummen[tag];
    });
    
    const summenZeile = document.createElement('tr');
    summenZeile.className = 'table-secondary fw-bold';
    summenZeile.innerHTML = `
        <td class="sticky-col">
            <div class="einrichtung-info">
                <div class="einrichtung-name">GESAMT</div>
                <div class="einrichtung-typ">${einrichtungen.length} Einrichtungen</div>
            </div>
        </td>
        
        ${tage.map(tag => `
            <td class="zahlen-zelle">
                ${tagessummen[tag]}
            </td>
        `).join('')}
        
        <td class="zahlen-zelle gesamt-zelle">
            ${wochensumme}
        </td>
        
        <td class="text-center">
            <i class="bi bi-calculator text-muted"></i>
        </td>
    `;
    
    tbody.appendChild(summenZeile);
}

/**
 * Rendert das Mobile-Akkordeon mit Bestelldaten
 * @param {Object} bestelldaten - Verarbeitete Bestelldaten
 */
export function renderMobileAkkordeon(bestelldaten) {
    const accordion = document.getElementById('mobile-accordion');
    if (!accordion) return;

    accordion.innerHTML = '';

    if (!bestelldaten || bestelldaten.einrichtungen.length === 0) {
        accordion.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-inbox display-4 mb-3"></i>
                <h5>Keine Bestelldaten verfügbar</h5>
                <p>Für die ausgewählte Woche liegen noch keine Bestelldaten vor.</p>
            </div>
        `;
        return;
    }

    const { einrichtungen, tage } = bestelldaten;
    
    einrichtungen.forEach((einrichtung, index) => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'mobile-accordion-item';
        
        accordionItem.innerHTML = `
            <!-- Akkordeon-Header -->
            <div class="mobile-accordion-header" data-toggle="accordion" data-target="mobile-content-${index}">
                <div class="mobile-einrichtung-header">
                    <div class="mobile-einrichtung-info">
                        <h6>${einrichtung.name}</h6>
                        <div class="mobile-einrichtung-meta">
                            ${einrichtung.typ.toUpperCase()} • 
                            ${einrichtung.gruppen.map(g => `${g.name}: ${g.anzahl}`).join(' • ')}
                        </div>
                    </div>
                    <div class="mobile-wochensumme">
                        <span>${einrichtung.gesamt_bestellungen}</span>
                        <button class="btn btn-sm btn-outline-light info-btn ${(!einrichtung.read || einrichtung.hatUngeleseneInfos) ? 'ungelesen' : ''}" 
                                data-einrichtung-id="${einrichtung.id}"
                                data-bs-toggle="modal" 
                                data-bs-target="#info-modal"
                                onclick="event.stopPropagation()"
                                title="${einrichtung.hatUngeleseneInfos ? `${einrichtung.anzahlUngeleseneInfos} ungelesene Information(en)` : 'Informationen'}">
                            <i class="bi bi-info-circle"></i>
                            ${einrichtung.hatUngeleseneInfos ? `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${einrichtung.anzahlUngeleseneInfos}</span>` : ''}
                        </button>
                        <i class="bi bi-chevron-down accordion-icon"></i>
                    </div>
                </div>
            </div>
            
            <!-- Akkordeon-Content -->
            <div class="mobile-accordion-content" id="mobile-content-${index}">
                <div class="mobile-tage-grid">
                    ${tage.map(tag => {
                        const tagData = einrichtung.tage_daten[tag];
                        const klassifizierung = klassifiziereAnzahl(tagData.summe);
                        
                        return `
                            <div class="mobile-tag-karte">
                                <div class="mobile-tag-name">${getTagDisplayName(tag)}</div>
                                <div class="mobile-tag-anzahl ${klassifizierung}">
                                    ${tagData.summe || 0}
                                </div>
                                ${tagData.gruppen_details.length > 0 ? `
                                    <div class="mobile-tag-gruppen">
                                        ${tagData.gruppen_details.map(g => `${g.gruppe}: ${g.anzahl}`).join(', ')}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        accordion.appendChild(accordionItem);
    });
    
    // Event-Listener für Akkordeon-Toggle
    setupMobileAccordionListeners();
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
 * Setup Event-Listener für Mobile-Akkordeon
 */
function setupMobileAccordionListeners() {
    const headers = document.querySelectorAll('.mobile-accordion-header[data-toggle="accordion"]');
    
    headers.forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetId = header.getAttribute('data-target');
            const content = document.getElementById(targetId);
            const icon = header.querySelector('.accordion-icon');
            
            if (!content) return;
            
            // Toggle aktuellen Content
            const isAktiv = content.classList.contains('aktiv');
            
            if (isAktiv) {
                // Schließen
                content.classList.remove('aktiv');
                header.classList.remove('aktiv');
                icon.classList.remove('bi-chevron-up');
                icon.classList.add('bi-chevron-down');
            } else {
                // Öffnen
                content.classList.add('aktiv');
                header.classList.add('aktiv');
                icon.classList.remove('bi-chevron-down');
                icon.classList.add('bi-chevron-up');
            }
        });
    });
}

/**
 * Rendert Info-Modal mit Einrichtungsdetails
 * @param {Object} einrichtung - Einrichtungsdaten
 * @param {Object} bestelldaten - Komplette Bestelldaten
 */
export function renderInfoModal(einrichtung, bestelldaten) {
    const modalBody = document.getElementById('modal-body-content');
    const leseBtn = document.getElementById('lesebestaetigung-btn');
    
    if (!modalBody || !leseBtn) return;
    
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
        
        <!-- Lesebestätigung -->
        <div class="info-section">
            <div class="lesebestaetigung-info ${einrichtung.read ? 'lesebestaetigung-erfolg' : ''}">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-${einrichtung.read ? 'check-circle-fill' : 'info-circle'} fs-5"></i>
                    <div>
                        ${einrichtung.read ? 
                            `<strong>Bereits gelesen</strong><br>
                             <small>Bestätigt am: ${formatiereZeitpunkt(einrichtung.gelesen_am || einrichtung.letzte_aktualisierung)}</small>` :
                            `<strong>Noch nicht gelesen</strong><br>
                             <small>Bitte bestätigen Sie, dass Sie die Informationen zur Kenntnis genommen haben.</small>`
                        }
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Setup Lesebestätigung-Button (für Bestelldaten, nicht Informationen)
    leseBtn.style.display = einrichtung.read ? 'none' : 'block';
    leseBtn.onclick = () => {
        if (window.markiereAlsGelesenHandler) {
            window.markiereAlsGelesenHandler(einrichtung.id, bestelldaten.year, bestelldaten.week);
        }
    };
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
 * Konvertiert Tagnamen zu vollständigen Namen
 * @param {string} tag - Interner Tagname
 * @returns {string} Vollständiger Name
 */
function getVollständigerTagname(tag) {
    const tageMap = {
        'montag': 'Montag',
        'dienstag': 'Dienstag',
        'mittwoch': 'Mittwoch',
        'donnerstag': 'Donnerstag',
        'freitag': 'Freitag',
        'samstag': 'Samstag',
        'sonntag': 'Sonntag'
    };
    return tageMap[tag] || tag;
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

// Global verfügbar machen für Event-Handler
window.markiereAlsGelesenHandler = null; // Wird in script.js gesetzt
window.markiereInformationAlsGelesenHandler = null; // Wird in script.js gesetzt 