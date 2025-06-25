# 🛡️ Sichere Modulare Entwicklung

## Problem-Analyse

Bei der modularen Entwicklung treten häufig diese Probleme auf:

1. **Server-Abstürze** → Einzelne Module legen den ganzen Server lahm
2. **Frontend-Crashes** → Ein fehlerhaftes Modul stürzt die ganze App ab
3. **Backend/Frontend-Inkonsistenzen** → Unterschiedliche API-Aufrufe
4. **Vite-Probleme** → Fehlerhafte Module blockieren Hot-Reload

## 🎯 Lösungsansatz

### **1. Error-Boundary System verwenden**

```javascript
// In jedem Modul script.js
import { initErrorBoundary, safeModuleInit } from '@shared/components/error-boundary/error-boundary.js';

// Error-Boundary einmalig initialisieren (nur im Hauptmodul)
initErrorBoundary();

// Module sicher initialisieren
safeModuleInit(async () => {
    // Ihre Module-Initialisierung hier
    await initModule();
}, 'IHR_MODULE_NAME');
```

### **2. Einheitlichen API-Client nutzen**

```javascript
// Alte, unsichere API-Aufrufe ersetzen:
// const response = await fetch('/api/data');

// Neue, sichere API-Aufrufe:
import { api } from '@shared/utils/api-client.js';

const data = await api.get('/api/data');
const result = await api.post('/api/create', formData);
```

### **3. Module-Template verwenden**

Für neue Module verwenden Sie das Template:

```bash
# Template kopieren
cp shared/templates/module-template.js frontend/modules/ihr-modul/js/script.js

# Anpassen:
# 1. MODULE_NAME ändern
# 2. MODULE-spezifische Logik implementieren
# 3. API-Endpunkte anpassen
```

## 🔧 Backend Error-Handling

### Server.js erweitern

```javascript
// server.js
const { errorHandler, notFound, setupGracefulShutdown } = require('./middleware/errorMiddleware');

// ... bestehende Routes ...

// Error-Middleware ganz am Ende hinzufügen
app.use(notFound);
app.use(errorHandler);

// Server starten
const server = app.listen(PORT, () => {
    console.log(`Backend-Server läuft auf http://localhost:${PORT}`);
});

// Graceful Shutdown einrichten
setupGracefulShutdown(server);
```

### AsyncHandler in Controllern

```javascript
// Alte Controller:
const getMenueplan = async (req, res) => {
    try {
        // ... Logik ...
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Neue Controller:
const { asyncHandler } = require('../../middleware/errorMiddleware');

const getMenueplan = asyncHandler(async (req, res) => {
    // ... Logik ...
    res.json(result);
    // Error-Handling automatisch durch asyncHandler
});
```

## 📱 Frontend Best Practices

### Module-Struktur

```
ihr-modul/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── script.js (basiert auf Template)
│   └── module/
│       ├── modul-api.js
│       ├── modul-ui.js
│       └── modul-state.js
└── path/
    └── paths.js
```

### Sichere Event-Listener

```javascript
// Delegierte Events verwenden (weniger fehleranfällig)
container.addEventListener('click', (event) => {
    try {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        
        handleAction(button.dataset.action);
    } catch (error) {
        console.error('Event-Handler Fehler:', error);
        // UI bleibt funktionsfähig
    }
});
```

## 🚀 Development Workflow

### 1. Neues Modul erstellen

```bash
# Template kopieren
cp -r shared/templates/module-template frontend/modules/neues-modul

# Template anpassen
# 1. MODULE_NAME = 'NEUES_MODUL'
# 2. Container-ID anpassen
# 3. Spezifische Logik implementieren
```

### 2. Vite-Config erweitern

```javascript
// vite.config.js
build: {
    rollupOptions: {
        input: {
            // ... bestehende Module ...
            neuesModul: resolve(__dirname, 'modules/neues-modul/index.html')
        }
    }
}
```

### 3. Backend-Route hinzufügen

```javascript
// backend/server.js
const neuesModulRoutes = require('./modules/neues-modul/routes');
app.use('/api/neues-modul', neuesModulRoutes);
```

### 4. Testen

```bash
# Backend starten
cd backend && npm start

# Frontend starten  
cd frontend && npm run dev

# Modul im Browser testen
# http://localhost:5173/modules/neues-modul/
```

## 🔍 Debugging

### Browser-Konsole

```javascript
// Modul-Status prüfen
console.log('Failed Modules:', window.failedModules);

// API-Client konfigurieren
window.apiClient = apiClient; // Für Debug-Zugriff
```

### Server-Logs

```bash
# Backend-Logs verfolgen
tail -f backend/logs/error.log

# Oder mit PM2
pm2 logs backend
```

## 🛠️ Troubleshooting

### Problem: Module stürzt ab

**Lösung:**
1. Error-Boundary überprüfen
2. `safeModuleInit()` verwenden
3. Fallback-UI implementieren

### Problem: API-Inkonsistenzen

**Lösung:**
1. Einheitlichen API-Client verwenden
2. Response-Format standardisieren
3. Error-Handling vereinheitlichen

### Problem: Vite-Fehler

**Lösung:**
1. HMR-Overlay konfigurieren
2. Error-only Modus aktivieren
3. Proxy-Error-Handling erweitern

### Problem: Server-Abstürze

**Lösung:**
1. Error-Middleware aktivieren
2. AsyncHandler verwenden
3. Graceful Shutdown implementieren

## 📋 Checkliste für neue Module

- [ ] Template als Basis verwendet
- [ ] MODULE_NAME angepasst
- [ ] Error-Boundary importiert
- [ ] Einheitlichen API-Client verwendet
- [ ] Event-Delegation implementiert
- [ ] Cleanup-Funktionen definiert
- [ ] Vite-Config erweitert
- [ ] Backend-Routes hinzugefügt
- [ ] Error-Handling getestet

## 🎯 Resultat

Mit diesen Maßnahmen erreichen Sie:

✅ **Module-Isolation** → Ein Fehler stoppt nicht die ganze App  
✅ **Graceful Degradation** → Fehlerhafte Module zeigen Fallback-UI  
✅ **Einheitliche APIs** → Keine Backend/Frontend-Konflikte  
✅ **Bessere Debug-Erfahrung** → Klare Fehlermeldungen  
✅ **Stabile Entwicklung** → Weniger Abstürze während Coding

---

*Bei Problemen: Zunächst Error-Boundary und API-Client prüfen!* 