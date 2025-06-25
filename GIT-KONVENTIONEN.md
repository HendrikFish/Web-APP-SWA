# 🇩🇪 **Git-Konventionen für SmartWorkArt**

*Alle Git-Commits müssen auf Deutsch geschrieben werden!*

---

## 🎯 **Warum deutsche Commit-Messages?**

- **Teamverständlichkeit:** Alle Entwickler sprechen Deutsch
- **Projekthistorie:** Git-Log ist für das ganze Team lesbar
- **Konsistenz:** Einheitliche Sprache im gesamten Projekt
- **Dokumentation:** Commits dienen als Projektdokumentation

---

## 📝 **Commit-Message Format**

### **Standard-Format:**
```
typ: Kurze Beschreibung der Änderung

- Detaillierte Erklärung was geändert wurde
- Warum die Änderung notwendig war  
- Welche Auswirkungen sie hat
```

### **Kurz-Format (für kleine Änderungen):**
```
typ: Kurze Beschreibung der Änderung
```

---

## 🏷️ **Commit-Typen (Präfixe)**

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| **feat** | Neue Funktion oder Feature | `feat: Rezept-Suchfunktion hinzugefügt` |
| **fix** | Fehler behoben | `fix: Login-Problem bei leeren Feldern behoben` |
| **docs** | Dokumentation | `docs: Anfänger-Guide für CI/CD erstellt` |
| **refactor** | Code umstrukturiert | `refactor: API-Client für einheitliche Fehlerbehandlung überarbeitet` |
| **test** | Tests hinzugefügt/geändert | `test: Unit-Tests für Authentication-Module erstellt` |
| **style** | Code-Formatierung | `style: ESLint-Fehler in Menüplan-Modul behoben` |
| **perf** | Performance-Verbesserung | `perf: Datenbankabfragen für Rezepte optimiert` |
| **build** | Build-System/Dependencies | `build: Vite-Konfiguration für bessere Performance angepasst` |
| **ci** | CI/CD Pipeline | `ci: GitHub Actions für automatische Tests eingerichtet` |
| **chore** | Wartungsarbeiten | `chore: Abhängigkeiten auf neueste Versionen aktualisiert` |

---

## ✅ **Gute Beispiele**

### **Feature-Commits:**
```bash
feat: Drag-and-Drop für Menüplan-Rezepte implementiert

- Benutzer können Rezepte per Drag-and-Drop verschieben
- Touch-Support für mobile Geräte hinzugefügt
- Automatische Speicherung nach Änderungen

feat: Passwort-Stärke-Validierung im Registrierungsformular

feat: Offline-Support für Rezept-Anzeige hinzugefügt
```

### **Bug-Fix-Commits:**
```bash
fix: Menüplan-Synchronisation zwischen Frontend und Backend repariert

- Einrichtungs-Snapshot wurde nicht im Frontend-State aktualisiert
- Neue Einrichtungen erschienen nicht in der UI
- Problem durch State-Update nach Backend-Call gelöst

fix: Login-Fehler bei Benutzern ohne Genehmigung behoben

fix: MongoDB-Verbindungsfehler in CI/CD Pipeline repariert
```

### **Dokumentations-Commits:**
```bash
docs: Umfassende Anleitung für neue Module erstellt

- Schritt-für-Schritt Anleitung für Anfänger
- Code-Beispiele und Templates hinzugefügt
- Troubleshooting-Sektion erweitert

docs: API-Dokumentation für Authentication-Endpunkte

docs: README mit Projekt-Setup-Anweisungen aktualisiert
```

### **Refactoring-Commits:**
```bash
refactor: Error-Boundary-System für modulare Entwicklung eingeführt

- Globale Fehlerbehandlung implementiert
- Module können nicht mehr die ganze App crashen
- Fallback-UI für fehlgeschlagene Module

refactor: API-Client mit einheitlicher Fehlerbehandlung erstellt

refactor: Shared-Komponenten in eigenes Verzeichnis verschoben
```

---

## ❌ **Schlechte Beispiele (NICHT machen)**

```bash
# Englisch (FALSCH):
fix: login issue with invalid passwords
feat: implement drag and drop for menu plan
docs: add setup instructions

# Zu unspezifisch:
fix: Fehler behoben
feat: Neue Funktion
update: Änderungen

# Zu technisch/kryptisch:
fix: NPE in AuthController.loginUser() L47
feat: impl. D&D w/ touch support
refactor: mv shared comps to /shared/components/

# Ohne Typ-Präfix:
Login-Problem behoben
Neue Suchfunktion hinzugefügt
Dokumentation aktualisiert
```

---

## 🚀 **Praktische Git-Workflows**

### **Einfacher Workflow:**
```bash
# 1. Änderungen machen
# 2. Status prüfen
git status

# 3. Dateien hinzufügen
git add .

# 4. Commit mit deutscher Message
git commit -m "feat: Neue Filterfunktion für Rezepte hinzugefügt"

# 5. Zu GitHub pushen
git push
```

### **Größere Änderungen:**
```bash
# Ausführlicher Commit mit Beschreibung
git commit -m "feat: Umfassendes Error-Boundary-System implementiert

- Globale Fehlerbehandlung für alle Module
- safeModuleInit() Wrapper-Funktion erstellt
- Fallback-UI bei Modul-Fehlern
- Automatische Fehlerberichterstattung an Backend
- Verhindert App-Crashes durch einzelne Module"
```

### **Mehrere kleine Commits:**
```bash
git add backend/
git commit -m "feat: Backend-API für Benutzer-Genehmigung erweitert"

git add frontend/
git commit -m "feat: Frontend-UI für Admin-Benutzer-Verwaltung hinzugefügt"

git add shared/
git commit -m "feat: Shared-Komponenten für Benutzer-Tabelle erstellt"

git push
```

---

## 🔧 **Git-Konfiguration für deutsche Messages**

### **Git-Template erstellen:**
```bash
# Template-Datei erstellen
echo "typ: Kurze Beschreibung

- Was wurde geändert?
- Warum war es notwendig?
- Welche Auswirkungen hat es?" > .gitmessage

# Template aktivieren
git config commit.template .gitmessage
```

### **Hilfreiche Git-Aliases:**
```bash
# Deutsche Shortcuts
git config --global alias.hinzufügen 'add'
git config --global alias.status 'status'
git config --global alias.übertragen 'push'
git config --global alias.ziehen 'pull'
```

---

## 📊 **Commit-Häufigkeit**

### **Empfohlene Praxis:**
- **Kleine, häufige Commits** statt große, seltene
- **Ein Commit pro logische Änderung**
- **Funktionsfähigen Code committen**

### **Beispiel-Workflow für neues Feature:**
```bash
# 1. Grundstruktur
git commit -m "feat: Grundgerüst für Bewohner-Verwaltung erstellt"

# 2. Backend-API
git commit -m "feat: Backend-Endpunkte für Bewohner-CRUD implementiert"

# 3. Frontend-UI
git commit -m "feat: Frontend-Formular für Bewohner-Erfassung hinzugefügt"

# 4. Tests
git commit -m "test: Unit-Tests für Bewohner-Module erstellt"

# 5. Dokumentation
git commit -m "docs: Anleitung für Bewohner-Verwaltung dokumentiert"
```

---

## 🎯 **Zusammenfassung**

### **Die 3 goldenen Regeln:**
1. **🇩🇪 IMMER auf Deutsch schreiben**
2. **🏷️ Typ-Präfix verwenden** (`feat:`, `fix:`, etc.)
3. **📝 Aussagekräftig beschreiben** was und warum

### **Schnell-Check vor jedem Commit:**
- ✅ Ist die Message auf Deutsch?
- ✅ Hat sie ein Typ-Präfix?
- ✅ Beschreibt sie klar was geändert wurde?
- ✅ Würde ein Teammitglied es verstehen?

**Gute Commits = Bessere Teamarbeit = Erfolgreiches Projekt!** 🚀✨ 