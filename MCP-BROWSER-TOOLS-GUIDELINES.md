# MCP Browser Tools - Entwicklungsrichtlinien

> **Qualitätssicherung für SmartWorkArt Seniorenheim-Webseiten**

Für die Entwicklung der SmartWorkArt Seniorenheim-Webseiten ist die Nutzung der MCP Browser Tools **obligatorisch**, um höchste Qualitäts- und Zugänglichkeitsstandards zu gewährleisten.

## 🎯 Primäre Anwendungsbereiche

### 1. **Barrierefreiheitsprüfungen (WCAG-Konformität)**
Aufgrund unserer Zielgruppe (Senioren, Pflegepersonal) sind WCAG-konforme Interfaces essentiell.

**Cursor-Befehle:**
- *"Führe ein Barrierefreiheits-Audit durch"*
- *"Überprüfe die Barrierefreiheit dieser Seite"*

**Prüft auf:**
- Farbkontraste (besonders wichtig für Senioren)
- Tastaturnavigation 
- Screenreader-Kompatibilität
- ARIA-Attribute
- Alt-Texte für Bilder

### 2. **Performance-Optimierung**
Einfache Bedienung erfordert schnelle Ladezeiten - besonders wichtig für ältere Nutzer.

**Cursor-Befehle:**
- *"Analysiere die Performance dieser Seite"*
- *"Führe ein Performance-Audit durch"*

**Identifiziert:**
- Render-blocking Ressourcen
- Übermäßige DOM-Größe
- Unoptimierte Bilder
- Langsame JavaScript-Ausführung

### 3. **SEO & Auffindbarkeit**
Bessere Sichtbarkeit für Seniorenheime und deren Services.

**Cursor-Befehle:**
- *"Führe ein SEO-Audit durch"*
- *"Optimiere diese Seite für Suchmaschinen"*

**Überprüft:**
- Metadaten und Titel
- Heading-Strukturierung
- Link-Hierarchie
- Strukturierte Daten

### 4. **Debugging & Entwicklungsunterstützung**

**Cursor-Befehle:**
- *"Mache einen Screenshot dieser Seite"*
- *"Zeige mir die Browser Console-Logs"*
- *"Führe den Debugger-Modus aus"*
- *"Prüfe die Netzwerk-Logs"*

## 📋 Setup-Voraussetzungen

✅ **Chrome Extension installiert und verbunden**  
✅ **Browser Tools Server läuft** (`npx @agentdeskai/browser-tools-server@latest`)  
✅ **MCP-Konfiguration in Cursor korrekt eingerichtet**  

**MCP-Konfiguration (`C:\Users\[USER]\.cursor\mcp.json`):**
```json
{
  "mcpServers": {
    "browser-tools": {
      "command": "node",
      "args": [
        "C:\\Users\\MrHen\\OneDrive\\Desktop\\projekt\\SmartWorkArt\\browser-tools-mcp\\browser-tools-mcp\\dist\\mcp-server.js"
      ],
      "enabled": true
    }
  }
}
```

## 🔄 Entwicklungsworkflow

### **Vor jedem Feature-Release:**
Mindestens die drei Kern-Audits durchführen:

1. **Barrierefreiheit:** *"Führe ein Barrierefreiheits-Audit durch"*
2. **Performance:** *"Analysiere die Performance dieser Seite"*  
3. **Best Practices:** *"Prüfe die Best Practices dieser Seite"*

### **Bei komplexen Debugging-Problemen:**
```
"Führe den Audit-Modus aus"
```
→ Führt alle verfügbaren Analysen automatisch nacheinander aus

### **Für Screenshots & Dokumentation:**
```
"Mache einen Screenshot dieser Seite"
```
→ Ideal für Bug-Reports und Feature-Dokumentation

## 🏥 SmartWorkArt-spezifische Prioritäten

### **Höchste Priorität: Barrierefreiheit**
- **Warum:** Senioren haben oft eingeschränkte Sehkraft/Motorik
- **Test-Frequenz:** Bei jeder UI-Änderung
- **Mindeststandard:** WCAG 2.1 AA

### **Hohe Priorität: Performance**
- **Warum:** Langsamere Internet-Verbindungen in Seniorenheimen
- **Ziel:** < 3 Sekunden Ladezeit
- **Test-Frequenz:** Wöchentlich

### **Mittlere Priorität: SEO**
- **Warum:** Auffindbarkeit für neue Kunden
- **Test-Frequenz:** Bei Content-Änderungen

## 🚀 Pro-Tipps

### **Audit-Modus für Vollständige Analyse:**
```
"Starte den Audit-Modus"
```
Führt automatisch aus: Accessibility + Performance + SEO + Best Practices

### **Debugger-Modus für Problemanalyse:**
```
"Führe den Debugger-Modus aus"
```
Sammelt automatisch: Console-Logs + Network-Logs + Screenshots + Fehleranalyse

### **Regelmäßige Überwachung:**
- **Täglich:** Screenshots für visuelle Regression-Tests
- **Wöchentlich:** Performance-Audits
- **Monatlich:** Vollständige Audit-Mode Durchläufe

## 🎨 Integration in den SmartWorkArt-Workflow

### **Module-Entwicklung:**
1. Feature implementieren
2. **Lokal testen** → Browser Tools Audits
3. **Barrierefreiheit prüfen** → besonders wichtig
4. **Performance optimieren** → falls nötig
5. Git Commit [[memory:3892240611422652457]]

### **Bug-Fixing:**
1. Problem reproduzieren
2. **Screenshots machen** → für Dokumentation
3. **Console-Logs prüfen** → für Debugging
4. Fix implementieren
5. **Regression-Tests** → alle Audits wiederholen

---

**Diese Richtlinien sind Teil des SmartWorkArt-Entwicklungsstandards und müssen von allen Entwicklern und KI-Assistenten befolgt werden.** 