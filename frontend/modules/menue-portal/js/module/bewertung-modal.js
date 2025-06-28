// bewertung-modal.js - Bewertungs-Modal UI-Komponente
// Verwaltet das Modal für Kategorie-basierte Bewertungen

import { showToast } from '@shared/components/toast-notification/toast-notification.js';
import { 
    createBewertung, 
    validateBewertungData, 
    formatDateForAPI,
    getKalenderwoche,
    istDatumBewertbar 
} from './bewertung-api.js';

// Modal-State
let currentBewertungData = null;
let currentUser = null;
let currentEinrichtung = null;

/**
 * Initialisiert das Bewertungs-Modal System
 * @param {object} user - Aktueller Benutzer
 * @param {object} einrichtung - Aktuelle Einrichtung
 */
export function initBewertungModal(user, einrichtung) {
    currentUser = user;
    currentEinrichtung = einrichtung;
    
    console.log('🎯 Bewertungs-Modal initialisiert für:', user.name, '-', einrichtung.name);
    
    // Modal-HTML erstellen falls nicht vorhanden
    createModalHTML();
    
    // Event-Listener setup
    setupModalEventListeners();
}

/**
 * Öffnet das Bewertungs-Modal für eine Kategorie
 * @param {string} tag - Wochentag (montag, dienstag, ...)
 * @param {string} kategorie - Kategorie (suppe, menu1, ...)
 * @param {string[]} rezepte - Array von Rezeptnamen
 * @param {Date} menueplanDatum - Datum des Menüplans
 */
export function openBewertungModal(tag, kategorie, rezepte, menueplanDatum) {
    // Prüfen ob Datum bewertbar ist
    if (!istDatumBewertbar(menueplanDatum)) {
        showToast('Bewertungen sind nur für die letzten 10 Tage möglich', 'warning');
        return;
    }
    
    // Bewertungsdaten vorbereiten
    currentBewertungData = {
        tag,
        kategorie,
        rezepte: Array.isArray(rezepte) ? rezepte : [rezepte],
        menueplan_datum: formatDateForAPI(menueplanDatum),
        kalenderwoche: getKalenderwoche(menueplanDatum),
        jahr: menueplanDatum.getFullYear(),
        einrichtung_id: currentEinrichtung.id,
        einrichtung_name: currentEinrichtung.name
    };
    
    console.log('📝 Öffne Bewertungs-Modal:', currentBewertungData);
    
    // Modal-Inhalt aktualisieren
    updateModalContent();
    
    // Modal anzeigen
    const modal = document.getElementById('bewertung-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Scrolling verhindern
    }
}

/**
 * Schließt das Bewertungs-Modal
 */
export function closeBewertungModal() {
    const modal = document.getElementById('bewertung-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Scrolling wieder aktivieren
    }
    
    // State zurücksetzen
    currentBewertungData = null;
    resetModalForm();
}

/**
 * Erstellt das Modal-HTML falls nicht vorhanden
 */
function createModalHTML() {
    // Prüfen ob Modal bereits existiert
    if (document.getElementById('bewertung-modal')) {
        return;
    }
    
    const modalHTML = `
        <div id="bewertung-modal" class="bewertung-modal">
            <div class="bewertung-modal-overlay" onclick="closeBewertungModal()"></div>
            <div class="bewertung-modal-content">
                <div class="bewertung-modal-header">
                    <h3 id="bewertung-modal-title">Bewertung abgeben</h3>
                    <button type="button" class="bewertung-modal-close" onclick="closeBewertungModal()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="bewertung-modal-body">
                    <div class="bewertung-info">
                        <div class="bewertung-kategorie">
                            <strong id="bewertung-kategorie-name">Kategorie</strong>
                            <span id="bewertung-tag-datum">Tag, Datum</span>
                        </div>
                        <div class="bewertung-rezepte">
                            <strong>Rezepte:</strong>
                            <ul id="bewertung-rezepte-liste"></ul>
                        </div>
                    </div>
                    
                    <form id="bewertung-form" class="bewertung-form">
                        <!-- Geschmacksbewertung -->
                        <div class="bewertung-field">
                            <label for="geschmack-rating">
                                <i class="bi bi-star-fill text-warning"></i>
                                Geschmack
                            </label>
                            <div class="star-rating" data-field="geschmack" id="geschmack-rating" role="radiogroup" aria-labelledby="geschmack-label">
                                <span class="star" data-value="1" role="radio" aria-checked="false" tabindex="0">⭐</span>
                                <span class="star" data-value="2" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                                <span class="star" data-value="3" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                                <span class="star" data-value="4" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                                <span class="star" data-value="5" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                            </div>
                            <span class="rating-text" id="geschmack-text">Bitte bewerten</span>
                        </div>
                        
                        <!-- Optikbewertung -->
                        <div class="bewertung-field">
                            <label for="optik-rating">
                                <i class="bi bi-eye-fill text-info"></i>
                                Optik
                            </label>
                            <div class="star-rating" data-field="optik" id="optik-rating" role="radiogroup" aria-labelledby="optik-label">
                                <span class="star" data-value="1" role="radio" aria-checked="false" tabindex="0">⭐</span>
                                <span class="star" data-value="2" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                                <span class="star" data-value="3" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                                <span class="star" data-value="4" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                                <span class="star" data-value="5" role="radio" aria-checked="false" tabindex="-1">⭐</span>
                            </div>
                            <span class="rating-text" id="optik-text">Bitte bewerten</span>
                        </div>
                        
                        <!-- Verbesserungsvorschlag -->
                        <div class="bewertung-field">
                            <label for="verbesserungsvorschlag">
                                <i class="bi bi-lightbulb-fill text-success"></i>
                                Verbesserungsvorschlag mit Alternative
                                <span class="required">*</span>
                            </label>
                            <textarea 
                                id="verbesserungsvorschlag" 
                                name="verbesserungsvorschlag"
                                rows="4"
                                placeholder="Bitte geben Sie einen konkreten Verbesserungsvorschlag mit Alternative an, z.B. 'Statt Frittaten wären Leberknödel eine bessere Alternative - sie passen geschmacklich besser zur Rindersuppe'"
                                required
                                minlength="10"></textarea>
                            <small class="form-text">
                                Mindestens 10 Zeichen. Bitte immer eine konkrete Alternative vorschlagen!
                            </small>
                        </div>
                    </form>
                </div>
                
                <div class="bewertung-modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeBewertungModal()">
                        Abbrechen
                    </button>
                    <button type="button" class="btn btn-primary" id="bewertung-submit-btn" onclick="submitBewertung()">
                        <i class="bi bi-check-lg"></i>
                        Bewertung abgeben
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Modal zum Body hinzufügen
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Globale Funktionen für onclick-Handler
    window.closeBewertungModal = closeBewertungModal;
    window.submitBewertung = submitBewertung;
}

/**
 * Aktualisiert den Modal-Inhalt basierend auf currentBewertungData
 */
function updateModalContent() {
    if (!currentBewertungData) return;
    
    // Titel und Kategorie aktualisieren
    const kategorieName = getCategoryDisplayName(currentBewertungData.kategorie);
    document.getElementById('bewertung-modal-title').textContent = `${kategorieName} bewerten`;
    document.getElementById('bewertung-kategorie-name').textContent = kategorieName;
    
    // Tag und Datum anzeigen
    const tagName = currentBewertungData.tag.charAt(0).toUpperCase() + currentBewertungData.tag.slice(1);
    const datumFormatiert = new Date(currentBewertungData.menueplan_datum).toLocaleDateString('de-DE');
    document.getElementById('bewertung-tag-datum').textContent = `${tagName}, ${datumFormatiert}`;
    
    // Rezepte-Liste aktualisieren
    const rezepteListe = document.getElementById('bewertung-rezepte-liste');
    rezepteListe.innerHTML = '';
    currentBewertungData.rezepte.forEach(rezept => {
        const li = document.createElement('li');
        li.textContent = rezept;
        rezepteListe.appendChild(li);
    });
    
    // Form zurücksetzen
    resetModalForm();
}

/**
 * Setzt das Modal-Formular zurück
 */
function resetModalForm() {
    // Sterne-Ratings zurücksetzen
    document.querySelectorAll('.star-rating .star').forEach(star => {
        star.classList.remove('active');
    });
    
    // Rating-Texte zurücksetzen
    document.getElementById('geschmack-text').textContent = 'Bitte bewerten';
    document.getElementById('optik-text').textContent = 'Bitte bewerten';
    
    // Textarea leeren
    document.getElementById('verbesserungsvorschlag').value = '';
    
    // Submit-Button aktivieren
    document.getElementById('bewertung-submit-btn').disabled = false;
}

/**
 * Setup Event-Listener für das Modal
 */
function setupModalEventListeners() {
    // Sterne-Rating Event-Listener
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('star')) {
            const rating = parseInt(e.target.dataset.value);
            const field = e.target.closest('.star-rating').dataset.field;
            setStarRating(field, rating);
        }
    });
    
    // ESC-Taste zum Schließen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.getElementById('bewertung-modal').style.display === 'flex') {
            closeBewertungModal();
        }
    });
}

/**
 * Setzt die Sterne-Bewertung für ein Feld
 * @param {string} field - Feld (geschmack oder optik)
 * @param {number} rating - Bewertung (1-5)
 */
function setStarRating(field, rating) {
    const starContainer = document.querySelector(`[data-field="${field}"]`);
    const stars = starContainer.querySelectorAll('.star');
    const textElement = document.getElementById(`${field}-text`);
    
    // Alle Sterne zurücksetzen
    stars.forEach(star => star.classList.remove('active'));
    
    // Aktive Sterne setzen
    for (let i = 0; i < rating; i++) {
        stars[i].classList.add('active');
    }
    
    // Text aktualisieren
    const ratingTexts = {
        1: 'Sehr schlecht',
        2: 'Schlecht',
        3: 'Okay',
        4: 'Gut',
        5: 'Sehr gut'
    };
    textElement.textContent = `${rating}/5 - ${ratingTexts[rating]}`;
}

/**
 * Sammelt die Formular-Daten und sendet die Bewertung
 */
async function submitBewertung() {
    if (!currentBewertungData) {
        showToast('Keine Bewertungsdaten verfügbar', 'error');
        return;
    }
    
    // Submit-Button deaktivieren
    const submitBtn = document.getElementById('bewertung-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Wird gesendet...';
    
    try {
        // Bewertungswerte sammeln
        const geschmackRating = getStarRatingValue('geschmack');
        const optikRating = getStarRatingValue('optik');
        const verbesserungsvorschlag = document.getElementById('verbesserungsvorschlag').value.trim();
        
        // Vollständige Bewertungsdaten erstellen
        const bewertungData = {
            ...currentBewertungData,
            geschmack: geschmackRating,
            optik: optikRating,
            verbesserungsvorschlag
        };
        
        // Validierung
        const validation = validateBewertungData(bewertungData);
        if (!validation.isValid) {
            showToast(`Validierungsfehler: ${validation.errors.join(', ')}`, 'error');
            return;
        }
        
        // API-Aufruf
        const response = await createBewertung(bewertungData);
        
        if (response.success) {
            showToast('Bewertung erfolgreich abgegeben!', 'success');
            closeBewertungModal();
            
            // Optional: Seite aktualisieren oder Event emittieren
            // window.location.reload();
        } else {
            showToast(response.message || 'Fehler beim Speichern der Bewertung', 'error');
        }
        
    } catch (error) {
        console.error('Fehler beim Absenden der Bewertung:', error);
        showToast('Netzwerkfehler beim Speichern der Bewertung', 'error');
    } finally {
        // Submit-Button wieder aktivieren
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Bewertung abgeben';
    }
}

/**
 * Ermittelt den aktuellen Sterne-Rating-Wert für ein Feld
 * @param {string} field - Feld (geschmack oder optik)
 * @returns {number} Rating-Wert (1-5) oder 0 wenn nicht gesetzt
 */
function getStarRatingValue(field) {
    const activeStars = document.querySelectorAll(`[data-field="${field}"] .star.active`);
    return activeStars.length;
}

/**
 * Hilfsfunktion: Kategorie-Namen für Anzeige formatieren
 * @param {string} kategorie - Kategorie-Key
 * @returns {string} Formatierter Name
 */
function getCategoryDisplayName(kategorie) {
    const categoryNames = {
        'suppe': 'Suppe',
        'menu1': 'Menü 1',
        'menu2': 'Menü 2',
        'dessert': 'Dessert',
        'abend': 'Abendessen'
    };
    
    return categoryNames[kategorie] || kategorie;
} 