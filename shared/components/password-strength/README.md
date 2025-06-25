# Passwort-Stärke-Komponente

## 📋 **Übersicht**

Diese Komponente bietet eine visuelle, interaktive Anzeige der Passwort-Stärke in Echtzeit. Sie validiert Passwörter basierend auf den gleichen Regeln wie das Backend und gibt dem Benutzer sofortiges Feedback.

## ✨ **Features**

- **🎯 Echtzeit-Validierung** während der Eingabe
- **📊 Visueller Fortschrittsbalken** mit Farbkodierung
- **📝 Detaillierte Anforderungsliste** mit Check-Marks
- **🎨 Bootstrap-Integration** mit responsivem Design
- **♿ Accessibility-Support** (ARIA, Keyboard-Navigation)
- **📱 Mobile-optimiert** mit Touch-Friendly UI

## 🚀 **Schnellstart**

### **Einfache Integration:**

```javascript
import { addPasswordStrengthToForm } from '@shared/components/password-strength/password-strength.js';

// Automatisch Container erstellen und Indikator hinzufügen
const passwordAPI = addPasswordStrengthToForm('my-password-input');
```

### **Erweiterte Integration:**

```javascript
import { createPasswordStrengthIndicator } from '@shared/components/password-strength/password-strength.js';

// Container manuell definieren
const container = document.getElementById('password-strength-container');
const passwordAPI = createPasswordStrengthIndicator(container, 'my-password-input');

// API verwenden
if (passwordAPI.isValid()) {
    // Passwort ist stark genug
    submitForm();
} else {
    // Fehler anzeigen
    const validation = passwordAPI.validate();
    showErrors(validation.errors);
}
```

## 🔧 **HTML-Setup**

### **Grundlegendes HTML:**

```html
<!-- CSS einbinden -->
<link rel="stylesheet" href="/shared/components/password-strength/password-strength.css">

<!-- Passwort-Input -->
<div class="mb-3">
    <label for="password" class="form-label">Passwort</label>
    <input type="password" class="form-control" id="password" required>
    <!-- Container für Stärke-Anzeige -->
    <div id="password-strength-container"></div>
</div>

<!-- JavaScript -->
<script type="module">
    import { addPasswordStrengthToForm } from '/shared/components/password-strength/password-strength.js';
    addPasswordStrengthToForm('password', 'password-strength-container');
</script>
```

## 📊 **Validierungsregeln**

Die Komponente validiert folgende Anforderungen:

| Anforderung | Beschreibung | Gewichtung |
|-------------|--------------|------------|
| **Länge** | Mindestens 8 Zeichen | 2x |
| **Großbuchstaben** | Mindestens ein A-Z | 1x |
| **Kleinbuchstaben** | Mindestens ein a-z | 1x |
| **Zahlen** | Mindestens eine 0-9 | 1x |
| **Sonderzeichen** | Mindestens ein !@#$%^&* | 1x |

### **Stärke-Level:**

- **0-39%**: 🔴 Sehr schwach
- **40-59%**: 🟠 Schwach  
- **60-79%**: 🟡 Mittel
- **80-99%**: 🟢 Stark
- **100%**: 🟢 Sehr stark

## 🎨 **Visuelle Darstellung**

```
Passwort: MySecure123!
████████████████████ 100% Sehr stark

Anforderungen:
✓ Mindestens 8 Zeichen
✓ Mindestens einen Großbuchstaben (A-Z)  
✓ Mindestens einen Kleinbuchstaben (a-z)
✓ Mindestens eine Zahl (0-9)
✓ Mindestens ein Sonderzeichen (!@#$%^&*)
```

## 🛠️ **API-Referenz**

### **`validatePasswordStrength(password)`**

Validiert ein Passwort und gibt detaillierte Informationen zurück.

```javascript
const result = validatePasswordStrength('MyPassword123!');
console.log(result);
// {
//   isValid: true,
//   requirements: [...],
//   strengthPercent: 100,
//   strengthLevel: 'sehr-stark',
//   strengthText: 'Sehr stark',
//   strengthColor: '#198754',
//   errors: []
// }
```

### **`createPasswordStrengthIndicator(container, passwordInputId)`**

Erstellt eine vollständige Passwort-Stärke-Anzeige.

**Parameter:**
- `container` - DOM-Element für die Anzeige
- `passwordInputId` - ID des Passwort-Input-Feldes

**Rückgabe-API:**
```javascript
const api = createPasswordStrengthIndicator(container, 'password');

// Methoden:
api.validate()      // Aktuelle Validierung abrufen
api.update()        // Anzeige manuell aktualisieren  
api.isValid()       // Prüfen ob Passwort gültig ist
api.getPassword()   // Aktuelles Passwort abrufen
api.reset()         // Passwort und Anzeige zurücksetzen
```

### **`addPasswordStrengthToForm(passwordInputId, containerId?)`**

Einfache Integration in bestehende Formulare.

```javascript
// Container automatisch erstellen
const api = addPasswordStrengthToForm('password');

// Container explizit angeben
const api = addPasswordStrengthToForm('password', 'custom-container');
```

## 🎯 **Verwendungsbeispiele**

### **1. Standard-Registrierungsformular:**

```javascript
import { addPasswordStrengthToForm } from '@shared/components/password-strength/password-strength.js';

document.addEventListener('DOMContentLoaded', () => {
    const passwordAPI = addPasswordStrengthToForm('register-password');
    
    document.getElementById('register-form').addEventListener('submit', (e) => {
        if (!passwordAPI.isValid()) {
            e.preventDefault();
            alert('Bitte erfüllen Sie alle Passwort-Anforderungen');
        }
    });
});
```

### **2. Passwort-Änderung mit Bestätigung:**

```javascript
import { createPasswordStrengthIndicator } from '@shared/components/password-strength/password-strength.js';

const newPasswordAPI = createPasswordStrengthIndicator(
    document.getElementById('new-password-strength'),
    'new-password'
);

document.getElementById('confirm-password').addEventListener('input', (e) => {
    const newPassword = newPasswordAPI.getPassword();
    const confirmPassword = e.target.value;
    
    if (newPassword !== confirmPassword) {
        e.target.classList.add('is-invalid');
    } else {
        e.target.classList.remove('is-invalid');
        e.target.classList.add('is-valid');
    }
});
```

### **3. Admin-Panel Integration:**

```javascript
import { validatePasswordStrength } from '@shared/components/password-strength/password-strength.js';

function validateUserPasswords() {
    const passwords = document.querySelectorAll('input[type="password"]');
    
    passwords.forEach(input => {
        const validation = validatePasswordStrength(input.value);
        
        if (!validation.isValid) {
            console.warn(`Schwaches Passwort für ${input.id}:`, validation.errors);
        }
    });
}
```

## 📱 **Responsive Design**

Die Komponente passt sich automatisch an verschiedene Bildschirmgrößen an:

- **Desktop**: Vollständige Anzeige mit allen Details
- **Tablet**: Kompakte Darstellung  
- **Mobile**: Gestapeltes Layout, optimierte Touch-Targets

## ♿ **Accessibility**

- **ARIA-Labels** für Screen Reader
- **Keyboard-Navigation** vollständig unterstützt
- **High-Contrast-Mode** kompatibel
- **Reduced-Motion** respektiert Benutzereinstellungen

## 🔗 **Integration in bestehende Module**

Die Komponente ist bereits integriert in:

- ✅ **Login/Registrierung** (`/core/login/`)
- ⚡ **Admin-Dashboard** (User-Management)
- 🔄 **Profile-Settings** (Passwort ändern)

## 🐛 **Debugging**

```javascript
// Debug-Modus aktivieren
window.DEBUG_PASSWORD_STRENGTH = true;

// Logging wird in der Browser-Konsole angezeigt
const api = addPasswordStrengthToForm('password');
```

## 🎨 **Anpassung**

### **CSS-Variablen überschreiben:**

```css
:root {
    --password-strength-success: #28a745;
    --password-strength-warning: #ffc107;
    --password-strength-danger: #dc3545;
}
```

### **Validierungsregeln anpassen:**

```javascript
import { validatePasswordStrength } from '@shared/components/password-strength/password-strength.js';

// Eigene Validierung mit angepassten Regeln
function customValidation(password) {
    const base = validatePasswordStrength(password);
    
    // Zusätzliche Regel: Keine Wiederholungen
    const hasRepeatedChars = /(.)\1{2,}/.test(password);
    
    if (hasRepeatedChars) {
        base.isValid = false;
        base.errors.push('Keine mehr als 2 gleiche Zeichen hintereinander');
    }
    
    return base;
}
```

---

**💡 Tipp:** Die Komponente synchronisiert sich automatisch mit den Backend-Validierungsregeln in `backend/middleware/securityMiddleware.js` 