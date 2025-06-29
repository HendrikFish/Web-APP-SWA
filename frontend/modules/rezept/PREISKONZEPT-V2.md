# 💰 Erweiterte Preisberechnung V2.0

## 🎯 Problemstellung

Das ursprüngliche Preissystem konnte nicht korrekt zwischen **Einkaufseinheiten** und **Rezeptverwendung** unterscheiden:

### ❌ Problematische Szenarien:

**Fall 1: Eier (Stück → Gramm)**
- 🛒 Einkauf: 1 Ei = 0,20€
- ⚖️ Realität: 1 Ei = 60g
- 📝 Rezept: "Brauche 7g vom Ei"
- ❓ **Wie berechne ich 7g?**

**Fall 2: Fleischbällchen (kg → Stück)**
- 🛒 Einkauf: 1kg = 8,00€
- ⚖️ Realität: 1 Bällchen = 15g
- 📝 Rezept: "Brauche 6 Stück"
- ❓ **Wie berechne ich 6 Stück?**

## ✅ Lösung: Flexibles Preiskonzept

### 🏗️ Neue Preisstruktur:

```javascript
"preis": {
  "basis": 8.0,              // Einkaufspreis
  "basiseinheit": "kg",      // Einkaufseinheit
  "verwendungseinheit": "Stk.", // Wie wird es im Rezept verwendet
  "umrechnungsfaktor": 66.67    // 1kg = 66,67 Stück
},
"gewicht_pro_einheit": 15      // 1 Stück = 15g
```

### ⚙️ Automatische Berechnungsgrundlagen:

Das System berechnet **automatisch**:
- `pro_gramm`: 8€ ÷ 1000g = 0,008€/g
- `pro_stueck`: 8€ ÷ 66,67 = 0,12€/Stück

## 📊 Berechnungsbeispiele

### **Beispiel 1: Eier (Stück → Gramm Umrechnung)**

```javascript
// Zutat-Definition:
{
  "name": "Eier",
  "preis": {
    "basis": 0.20,           // 0,20€ pro Ei
    "basiseinheit": "Stk."
  },
  "gewicht_pro_einheit": 60  // 1 Ei = 60g
}

// Automatisch berechnet:
// pro_gramm = 0,20€ ÷ 60g = 0,0033€/g
// pro_stueck = 0,20€

// Rezeptverwendung:
7g vom Ei = 7g × 0,0033€/g = 0,023€
2 Eier    = 2 × 0,20€     = 0,40€
```

### **Beispiel 2: Fleischbällchen (kg → Stück Umrechnung)**

```javascript
// Zutat-Definition:
{
  "name": "Fleischbällchen (TK) 15g",
  "preis": {
    "basis": 8.0,            // 8€ pro kg
    "basiseinheit": "kg"
  },
  "gewicht_pro_einheit": 15  // 1 Bällchen = 15g
}

// Automatisch berechnet:
// pro_gramm = 8€ ÷ 1000g = 0,008€/g
// pro_stueck = 8€ ÷ (1000g÷15g) = 8€ ÷ 66,67 = 0,12€/Stück

// Rezeptverwendung:
6 Stück = 6 × 0,12€ = 0,72€
90g     = 90g × 0,008€/g = 0,72€  // Gleicher Preis!
```

### **Beispiel 3: Milch (Liter → Milliliter)**

```javascript
// Zutat-Definition:
{
  "name": "Milch ESL 3,5%",
  "preis": {
    "basis": 1.02,           // 1,02€ pro Liter
    "basiseinheit": "l"
  }
}

// Automatisch berechnet:
// pro_milliliter = 1,02€ ÷ 1000ml = 0,00102€/ml

// Rezeptverwendung:
250ml = 250ml × 0,00102€/ml = 0,255€
```

## 🚀 Implementierung

### JavaScript-Funktionen:

```javascript
import { berechnePreisFürMenge, erstellePreisaufschlüsselung } from './preis-berechnung.js';

// Preis für beliebige Menge berechnen
const preis = berechnePreisFürMenge(zutat, 6, 'Stk.');

// Detaillierte Aufschlüsselung für Debug
const aufschlüsselung = erstellePreisaufschlüsselung(zutat, 6, 'Stk.');
console.log(aufschlüsselung.berechnung);
// "6 Stk. × 0.12€ = 0.7200€"
```

### Unterstützte Einheiten:

| Kategorie | Einheiten | Beschreibung |
|-----------|-----------|--------------|
| **Gewicht** | g, kg | Gramm, Kilogramm |
| **Volumen** | ml, l | Milliliter, Liter |
| **Stück** | Stk., Stück, Pkg., Packung | Stückzahl |

### Debug-Modus:

```javascript
// Debug-Ausgabe aktivieren
window.DEBUG_PREIS = true;

// In der Konsole erscheint dann:
// Preisberechnung: {
//   zutat_name: "Fleischbällchen (TK) 15g",
//   einkauf: { preis: 8, einheit: "kg" },
//   verwendung: { menge: 6, einheit: "Stk.", preis: 0.72 },
//   berechnung: "6 Stk. × 0.12€ = 0.7200€"
// }
```

## 🔄 Migration von alter Preisstruktur

Das System ist **rückwärtskompatibel**:

```javascript
// Alte Struktur (funktioniert weiterhin):
"preis": {
  "basis": 1.72,
  "basiseinheit": "kg", 
  "verwendungseinheit": "g",
  "umrechnungsfaktor": 1000
}

// Wird automatisch konvertiert zu:
// pro_gramm = 1,72€ ÷ 1000 = 0,00172€/g
```

## 📈 Vorteile

### ✅ **Präzise Preisberechnung**
- **7g Ei**: 0,023€ (statt 0,20€)
- **6 Fleischbällchen**: 0,72€ (statt fehlerhaft)

### ✅ **Flexible Verwendung**
- Einkauf in kg, Verwendung in Stück
- Einkauf per Stück, Verwendung in Gramm
- Automatische Umrechnung zwischen allen Einheiten

### ✅ **Einkaufsplanung**
- Korrekte Kosten für Menüplanung
- Präzise Kalkulation für Portionen
- Realistische Budgetierung

### ✅ **Transparenz**
- Debug-Modus für Nachvollziehbarkeit
- Detaillierte Preisaufschlüsselung
- Automatische Berechnungsvalidierung

## 🏠 Nutzen für Seniorenheim

### 👨‍🍳 **Für Köche:**
- Präzise Portionsplanung
- Realistische Kostenschätzung
- Flexible Rezeptanpassung

### 📊 **Für Verwaltung:**
- Genaue Budgetplanung
- Kostencontrolling pro Mahlzeit
- Einkaufsoptimierung

### 🛒 **Für Einkauf:**
- Bedarfsgerechte Mengen
- Minimale Verschwendung
- Optimale Lieferantenauswahl

---

*Implementiert für SmartWorkArt Seniorenheim-Management System 2025* 🎯 