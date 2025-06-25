# 🚀 **QUICK REFERENCE - Die wichtigsten Befehle**

*Für den täglichen Gebrauch - immer griffbereit!*

---

## 🎯 **Projekt starten/stoppen**

```bash
# Alles starten (Backend + Frontend)
npm start

# Stoppen: Ctrl + C (zweimal)

# Nur Backend starten
cd backend && npm run dev

# Nur Frontend starten  
cd frontend && npm run dev
```

---

## 🔧 **Entwicklung & Testing**

```bash
# Tests ausführen
cd backend && npm test

# Code prüfen (Fehler finden)
cd frontend && npm run lint

# Code automatisch reparieren
cd frontend && npm run lint:fix

# Projekt neu installieren (bei Problemen)
npm install
```

---

## 📁 **Neue Module erstellen**

```bash
# 1. Ordner erstellen
mkdir frontend/modules/mein-modul
mkdir frontend/modules/mein-modul/js
mkdir frontend/modules/mein-modul/css

# 2. Template kopieren
cp shared/templates/module-template.js frontend/modules/mein-modul/js/script.js

# 3. HTML erstellen
touch frontend/modules/mein-modul/index.html
```

---

## 🎨 **Wichtige Dateien & Pfade**

| Was | Wo |
|-----|-----|
| **Module** | `frontend/modules/[name]/` |
| **Shared Components** | `shared/components/` |
| **App-Daten** | `shared/data/` |
| **Templates** | `shared/templates/` |
| **Backend APIs** | `backend/modules/` |

---

## 💻 **Code-Snippets**

### **Neues Modul (script.js)**
```javascript
import { safeModuleInit } from '@shared/components/error-boundary/error-boundary.js';
import { api } from '@shared/utils/api-client.js';

safeModuleInit(async () => {
    console.log('Mein Modul lädt...');
    
    // Deine Funktionen hier
    
}, 'MeinModul');
```

### **API Daten holen**
```javascript
// GET Request
const data = await api.get('/rezepte');

// POST Request  
const newItem = await api.post('/rezepte', {
    name: 'Neues Rezept',
    zutaten: ['Zutat1', 'Zutat2']
});

// PUT Request (Update)
await api.put('/rezepte/123', { name: 'Geändert' });

// DELETE Request
await api.delete('/rezepte/123');
```

### **HTML Template (Bootstrap)**
```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Mein Modul</title>
</head>
<body>
    <!-- Header einbinden -->
    <div id="main-header"></div>
    
    <!-- Hauptinhalt -->
    <div class="container mt-4">
        <div class="card rounded-0">
            <div class="card-header">
                <h5>Mein Feature</h5>
            </div>
            <div class="card-body">
                <button class="btn btn-primary">Aktion</button>
            </div>
        </div>
    </div>
    
    <script src="/modules/mein-modul/js/script.js" type="module"></script>
</body>
</html>
```

---

## 🚨 **Troubleshooting**

| Problem | Lösung |
|---------|---------|
| **Server startet nicht** | `npm install` dann `npm start` |
| **MongoDB Fehler** | Überprüfe `.env` Datei |
| **Weiße Seite** | F12 → Console → Error-Boundary fehlt? |
| **404 Fehler** | Pfad überprüfen, Server neu starten |
| **Modul lädt nicht** | Import-Pfade überprüfen |

---

## 🎯 **URLs die du brauchst**

| Service | URL |
|---------|-----|
| **Frontend** | `http://localhost:4173` |
| **Backend Health** | `http://localhost:3000/health` |
| **Login** | `http://localhost:4173/core/login/` |
| **Admin** | `http://localhost:4173/core/admin-dashboard/` |
| **Menüplan** | `http://localhost:4173/modules/menueplan/` |

---

## 📝 **Git Befehle (für später)**

```bash
# Status prüfen
git status

# Änderungen hinzufügen
git add .

# Commit erstellen (IMMER auf Deutsch!)
git commit -m "feat: Neue Funktion für Rezept-Verwaltung hinzugefügt"

# Zu GitHub hochladen
git push
```

### **🇩🇪 WICHTIG: Deutsche Commit-Messages**

**✅ GUT (Deutsch):**
```bash
git commit -m "feat: Drag-and-Drop für Menüplan implementiert"
git commit -m "fix: Login-Problem bei ungültigen Passwörtern behoben"
git commit -m "docs: Anleitung für neue Module erstellt"
git commit -m "refactor: API-Client für bessere Fehlerbehandlung überarbeitet"
```

**❌ SCHLECHT (Englisch):**
```bash
git commit -m "feat: implement drag and drop for menu plan"
git commit -m "fix: login issue with invalid passwords"
```

**Commit-Typen:**
- `feat:` - Neue Funktion
- `fix:` - Fehler behoben
- `docs:` - Dokumentation
- `refactor:` - Code umstrukturiert
- `test:` - Tests hinzugefügt

---

## 🆘 **Wenn gar nichts geht**

```bash
# 1. Alles stoppen (Ctrl + C)
# 2. Sauber neu starten:

npm install
npm start
```

---

## 📞 **Hilfe holen**

**Frag mich einfach:**
- "Wie erstelle ich ...?"
- "Warum funktioniert ... nicht?"
- "Zeig mir wie ich ... mache"

**Oder schaue in:**
- `ANFÄNGER-GUIDE.md` (ausführliche Erklärungen)
- `README.md` (technische Details)
- Konsole (F12) für Fehlermeldungen 