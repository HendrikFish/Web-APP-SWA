/**
 * Passwort-Stärke-Validator für Frontend
 * Zeigt in Echtzeit die Passwort-Stärke und Anforderungen an
 */

/**
 * Validiert die Passwort-Stärke basierend auf den Backend-Regeln
 * @param {string} password 
 * @returns {object} Validierungsresultat
 */
export function validatePasswordStrength(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const requirements = [
        {
            key: 'length',
            label: `Mindestens ${minLength} Zeichen`,
            met: password.length >= minLength,
            weight: 2
        },
        {
            key: 'uppercase',
            label: 'Mindestens einen Großbuchstaben (A-Z)',
            met: hasUpperCase,
            weight: 1
        },
        {
            key: 'lowercase',
            label: 'Mindestens einen Kleinbuchstaben (a-z)',
            met: hasLowerCase,
            weight: 1
        },
        {
            key: 'number',
            label: 'Mindestens eine Zahl (0-9)',
            met: hasNumbers,
            weight: 1
        },
        {
            key: 'special',
            label: 'Mindestens ein Sonderzeichen (!@#$%^&*)',
            met: hasSpecialChar,
            weight: 1
        }
    ];

    // Berechne Stärke basierend auf erfüllten Anforderungen
    const metRequirements = requirements.filter(req => req.met);
    const totalWeight = requirements.reduce((sum, req) => sum + req.weight, 0);
    const metWeight = metRequirements.reduce((sum, req) => sum + req.weight, 0);
    
    const strengthPercent = Math.round((metWeight / totalWeight) * 100);
    
    let strengthLevel = 'sehr-schwach';
    let strengthText = 'Sehr schwach';
    let strengthColor = '#dc3545'; // Bootstrap danger red
    
    if (strengthPercent >= 100) {
        strengthLevel = 'sehr-stark';
        strengthText = 'Sehr stark';
        strengthColor = '#198754'; // Bootstrap success green
    } else if (strengthPercent >= 80) {
        strengthLevel = 'stark';
        strengthText = 'Stark';
        strengthColor = '#28a745'; // Light green
    } else if (strengthPercent >= 60) {
        strengthLevel = 'mittel';
        strengthText = 'Mittel';
        strengthColor = '#ffc107'; // Bootstrap warning yellow
    } else if (strengthPercent >= 40) {
        strengthLevel = 'schwach';
        strengthText = 'Schwach';
        strengthColor = '#fd7e14'; // Bootstrap orange
    }

    return {
        isValid: metRequirements.length === requirements.length,
        requirements,
        metRequirements,
        strengthPercent,
        strengthLevel,
        strengthText,
        strengthColor,
        errors: requirements.filter(req => !req.met).map(req => req.label)
    };
}

/**
 * Erstellt und rendert die Passwort-Stärke-Anzeige
 * @param {HTMLElement} container - Container-Element wo die Anzeige eingefügt wird
 * @param {string} passwordInputId - ID des Passwort-Input-Feldes
 * @returns {object} API-Objekte für externe Kontrolle
 */
export function createPasswordStrengthIndicator(container, passwordInputId) {
    const passwordInput = document.getElementById(passwordInputId);
    
    if (!passwordInput || !container) {
        console.error('Password input oder container nicht gefunden');
        return null;
    }

    // HTML-Struktur erstellen
    const strengthHTML = `
        <div class="password-strength-container mt-2">
            <!-- Fortschrittsbalken -->
            <div class="password-strength-progress mb-2">
                <div class="progress" style="height: 6px;">
                    <div class="progress-bar" role="progressbar" 
                         style="width: 0%; transition: all 0.3s ease;" 
                         aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                    </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mt-1">
                    <small class="password-strength-text text-muted">Passwort eingeben...</small>
                    <small class="password-strength-percentage text-muted">0%</small>
                </div>
            </div>
            
            <!-- Anforderungen-Liste -->
            <div class="password-requirements">
                <div class="row g-1">
                    <div class="col-12">
                        <small class="text-muted fw-bold">Anforderungen:</small>
                    </div>
                </div>
                <div class="requirements-list mt-1"></div>
            </div>
        </div>
    `;

    container.innerHTML = strengthHTML;

    // DOM-Elemente referenzieren
    const progressBar = container.querySelector('.progress-bar');
    const strengthText = container.querySelector('.password-strength-text');
    const strengthPercentage = container.querySelector('.password-strength-percentage');
    const requirementsList = container.querySelector('.requirements-list');

    /**
     * Aktualisiert die Anzeige basierend auf der aktuellen Passwort-Eingabe
     */
    function updateStrengthDisplay() {
        const password = passwordInput.value;
        
        if (!password) {
            // Leeres Passwort - Reset
            progressBar.style.width = '0%';
            progressBar.style.backgroundColor = '#e9ecef';
            strengthText.textContent = 'Passwort eingeben...';
            strengthText.className = 'password-strength-text text-muted';
            strengthPercentage.textContent = '0%';
            requirementsList.innerHTML = '';
            passwordInput.classList.remove('is-valid', 'is-invalid');
            return;
        }

        const validation = validatePasswordStrength(password);
        
        // Fortschrittsbalken aktualisieren
        progressBar.style.width = `${validation.strengthPercent}%`;
        progressBar.style.backgroundColor = validation.strengthColor;
        progressBar.setAttribute('aria-valuenow', validation.strengthPercent);
        
        // Text aktualisieren
        strengthText.textContent = validation.strengthText;
        strengthText.className = `password-strength-text fw-bold`;
        strengthText.style.color = validation.strengthColor;
        
        // Prozent aktualisieren
        strengthPercentage.textContent = `${validation.strengthPercent}%`;
        strengthPercentage.style.color = validation.strengthColor;
        
        // Anforderungen rendern
        renderRequirements(validation.requirements);
        
        // Bootstrap-Validierungsklassen setzen
        if (validation.isValid) {
            passwordInput.classList.remove('is-invalid');
            passwordInput.classList.add('is-valid');
        } else {
            passwordInput.classList.remove('is-valid');
            passwordInput.classList.add('is-invalid');
        }

        return validation;
    }

    /**
     * Rendert die Liste der Passwort-Anforderungen
     * @param {Array} requirements 
     */
    function renderRequirements(requirements) {
        const requirementsHTML = requirements.map(req => {
            const iconClass = req.met ? 'text-success' : 'text-muted';
            const icon = req.met ? '✓' : '○';
            const textClass = req.met ? 'text-success' : 'text-muted';
            
            return `
                <div class="requirement-item d-flex align-items-center gap-2 mb-1">
                    <span class="${iconClass}" style="font-weight: bold; font-size: 12px;">${icon}</span>
                    <small class="${textClass}" style="font-size: 11px;">${req.label}</small>
                </div>
            `;
        }).join('');
        
        requirementsList.innerHTML = requirementsHTML;
    }

    // Event-Listener für Passwort-Input
    passwordInput.addEventListener('input', updateStrengthDisplay);
    passwordInput.addEventListener('keyup', updateStrengthDisplay);
    passwordInput.addEventListener('blur', updateStrengthDisplay);

    // Initiale Anzeige
    updateStrengthDisplay();

    // API für externe Kontrolle zurückgeben
    return {
        validate: () => validatePasswordStrength(passwordInput.value),
        update: updateStrengthDisplay,
        isValid: () => validatePasswordStrength(passwordInput.value).isValid,
        getPassword: () => passwordInput.value,
        reset: () => {
            passwordInput.value = '';
            updateStrengthDisplay();
        }
    };
}

/**
 * Einfache Funktion um Passwort-Stärke-Indikator zu einem Formular hinzuzufügen
 * @param {string} passwordInputId - ID des Passwort-Feldes
 * @param {string} containerId - ID des Containers (optional, wird automatisch erstellt)
 * @returns {object} API-Objekt
 */
export function addPasswordStrengthToForm(passwordInputId, containerId = null) {
    const passwordInput = document.getElementById(passwordInputId);
    
    if (!passwordInput) {
        console.error(`Passwort-Input mit ID "${passwordInputId}" nicht gefunden`);
        return null;
    }

    let container;
    
    if (containerId) {
        container = document.getElementById(containerId);
    } else {
        // Container automatisch nach dem Passwort-Input erstellen
        container = document.createElement('div');
        container.className = 'password-strength-wrapper';
        passwordInput.parentNode.insertBefore(container, passwordInput.nextSibling);
    }

    return createPasswordStrengthIndicator(container, passwordInputId);
} 