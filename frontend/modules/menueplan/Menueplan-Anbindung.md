# Menüplan Modul - Technische Anbindung

> **🛡️ SICHERHEIT:** Dieses Modul MUSS das neue Sicherheitssystem verwenden! Siehe `shared/docs/MODULARE-ENTWICKLUNG.md` für sichere Implementierung mit Error-Boundary und einheitlichem API-Client.

Dieses Dokument beschreibt die technischen Details der Integration des Menüplan-Moduls, einschließlich Datenquellen, API-Endpunkte, Auto-Save-System und Geschäftslogik-Integration.

## Datenquellen & State-Management

### **1. Zentrale Stammdaten**
- **`/shared/data/menueplaene/stammdaten.json`**: Mahlzeiten-Kategorien für Grid-Zeilen
- **`/shared/data/einrichtungen/einrichtungen.json`**: Einrichtungsdaten für Anforderungsmatrix
- **`/shared/data/rezepte/rezepte.json`**: Verfügbare Rezepte für Suchfunktion

### **2. Path-Layer (Blueprint-konform)**
**Datei:** `path/paths.js`
```javascript
export const paths = {
    stammdaten: '/shared/data/menueplaene/stammdaten.json',
    einrichtungen: '/shared/data/einrichtungen/einrichtungen.json',
    rezepte: '/shared/data/rezepte/rezepte.json',
    api: {
        base: '/api/menueplan',
        getWeek: (year, week) => `/api/menueplan/${year}/${week}`,
        saveWeek: (year, week) => `/api/menueplan/${year}/${week}`
    }
};
```

### **3. State-Management (menueplan-state.js)**
**Zentraler State:**
```javascript
const state = {
    currentPlan: { year: null, week: null, days: {} },
    stammdaten: { kategorien: [], einrichtungen: [], rezepte: [] },
    currentYear: new Date().getFullYear(),
    currentWeek: getCurrentWeek(),
    onStateChange: null // Auto-Save Callback
};
```

## API-Endpunkte & Kommunikation

### **Backend-API (menueplan-api.js)**

**1. Plan laden:**
```javascript
export async function getMenueplan(year, week) {
    const response = await fetch(`/api/menueplan/${year}/${week}`);
    return response.ok ? response.json() : { year, week, days: {} };
}
```

**2. Plan speichern (mit Snapshot-Integration):**
```javascript
export async function saveMenueplan(year, week, planData) {
    // GESCHÄFTSLOGIK: Plan enthält Einrichtungs-Snapshot
    await fetch(`/api/menueplan/${year}/${week}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData)
    });
}
```

### **Auto-Save Integration**
```javascript
// Debounced Auto-Save (1,5s Verzögerung)
const debouncedSave = debounce(async () => {
    try {
        setAutoSaveStatus('saving');
        
        // GESCHÄFTSLOGIK: Snapshot hinzufügen
        const planWithSnapshot = {
            ...state.currentPlan,
            einrichtungsSnapshot: createEinrichtungsSnapshot()
        };
        
        await api.saveMenueplan(state.currentYear, state.currentWeek, planWithSnapshot);
        setAutoSaveStatus('success');
        showToast('Plan automatisch gespeichert', 'success');
        
    } catch (error) {
        setAutoSaveStatus('error');
        showToast('Fehler beim Speichern', 'error');
    }
}, 1500);
```

## Datenstrukturen

### **Erweiterte currentPlan-Struktur (mit Geschäftslogik-Integration):**
```json
{
  "year": 2025,
  "week": 26,
  "days": {
    "montag": {
      "Mahlzeiten": {
        "suppe": [{ "id": "123", "name": "Tomatensuppe" }],
        "menu1": [{ "id": "456", "name": "Schnitzel" }],
        "menu2": [{ "id": "789", "name": "Pasta" }]
      },
      "Zuweisungen": {
        "menu1": ["einrichtung-001", "einrichtung-002"],
        "menu2": ["einrichtung-003"]
      }
    }
    // ... weitere Wochentage
  },
  "einrichtungsSnapshot": {
    "einrichtungen": [
      {
        "id": "einrichtung-001",
        "name": "Haus Sonnenschein",
        "kuerzel": "HS",
        "isIntern": false,
        "speiseplan": { ... }
      }
    ],
    "generatedAt": "2025-01-20T10:30:00Z",
    "categories": ["suppe", "menu1", "menu2"],
    "snapshotMetadata": {
      "version": "1.0",
      "source": "menueplan-module"
    }
  }
}
```

### **Historische Genauigkeit (Snapshot-Prinzip):**
- **Neue Pläne:** Verwenden aktuelle Stammdaten
- **Gespeicherte Pläne:** Verwenden eingefrorene Snapshot-Daten
- **Unveränderlich:** Historische Pläne zeigen korrekte Daten unabhängig von späteren Stammdaten-Änderungen 