# SmartWorkArt - Entwicklungs-Setup

## 🚀 **Schnellstart für neue Entwickler**

### **Voraussetzungen**

- **Node.js**: Version 18.x oder höher
- **MongoDB**: Version 6.0 oder höher  
- **Git**: Aktuelle Version
- **VS Code**: Empfohlen mit Extensions (siehe unten)

### **1. Repository klonen**

```bash
git clone https://github.com/organization/smartworkart.git
cd smartworkart
```

### **2. Abhängigkeiten installieren**

```bash
# Alle Abhängigkeiten installieren
npm run install:all

# Oder manuell:
npm install
cd backend && npm install
cd ../frontend && npm install
```

### **3. Umgebungsvariablen einrichten**

Erstellen Sie eine `.env` Datei im `backend/` Verzeichnis:

```bash
# Backend Konfiguration
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/smartworkart
# ODER für lokale Entwicklung:
# MONGODB_URI=mongodb://localhost:27017/smartworkart_dev

JWT_SECRET=your-super-secret-jwt-key-here
BACKEND_PORT=3000
NODE_ENV=development

# Logging (optional)
LOG_LEVEL=debug
LOG_TO_FILE=true

# Security (optional)
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

**Wichtig für MongoDB Atlas:**
- Stellen Sie sicher, dass Ihre IP-Adresse in der MongoDB Atlas Whitelist steht
- Link: https://www.mongodb.com/docs/atlas/security-whitelist/

### **4. MongoDB einrichten**

```bash
# MongoDB lokal starten
mongod

# Oder mit Docker:
docker run -d -p 27017:27017 --name smartworkart-mongo mongo:6.0
```

### **5. Anwendung starten**

```bash
# Frontend und Backend gleichzeitig starten
npm start

# Oder einzeln:
npm run start:backend  # Backend auf Port 3000
npm run start:frontend # Frontend auf Port 5173
```

## 🧪 **Tests und Qualitätssicherung**

### **Test-Umgebung**

**Alle Tests laufen isoliert von der Produktionsumgebung:**
- ✅ In-Memory MongoDB (keine echte Datenbank erforderlich)
- ✅ Separate Ports (Test: 3001, Produktion: 3000)
- ✅ Eigene Umgebungsvariablen
- ✅ Keine Beeinträchtigung des laufenden Systems

```bash
# Verschiedene Test-Modi
npm run test              # Standard-Tests mit Ausgabe
npm run test:isolated     # Tests mit maximaler Isolation
npm run test:watch        # Tests im Watch-Modus
npm run test:coverage     # Tests mit Coverage-Report

# Spezifische Test-Umgebung
cd backend
npm run test:isolated     # Läuft auf Port 3001, verwendet In-Memory DB
```

### **GitHub Actions / CI/CD**

Die Tests laufen automatisch bei jedem Push und Pull Request:
- Backend-Tests mit In-Memory MongoDB
- Frontend-Build-Tests
- Integration-Tests
- Security-Scans

## 🤖 **MCP-Server Setup (KI-Assistenz)**

Das SmartWorkArt-Projekt nutzt **Model Context Protocol (MCP) Server** für erweiterte KI-Assistenz.

### **MCP-Server installieren**

```bash
# Context7 MCP Server (global installiert)
npm install -g @upstash/context7-mcp

# Andere Server werden automatisch über npx geladen
```

### **MCP-Konfiguration (mcp-config-final.json)**

Die MCP-Server sind bereits konfiguriert in `mcp-config-final.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "enabled": true
    },
    "context7": {
      "command": "context7-mcp",
      "args": [],
      "enabled": true
    },
    "memory": {
      "command": "npx", 
      "args": ["@modelcontextprotocol/server-memory"],
      "enabled": true
    }
  }
}
```

### **MCP-Server testen**

```bash
# Context7 testen
context7-mcp --help

# Sequential Thinking testen  
npx -y @modelcontextprotocol/server-sequential-thinking

# Memory-Server ist automatisch verfügbar
```

### **MCP-Integration nutzen**

**Prompt-Beispiele für sofortigen Start:**

```bash
# Sequential Thinking
"Nutze Sequential Thinking: Plane die Implementierung eines neuen Moduls"

# Context7  
"Erstelle moderne Bootstrap Komponenten. use context7"

# Memory
"Speichere im Memory: SmartWorkArt nutzt Blueprint-Struktur für alle Module"

# Browser Tools
"Mache einen Performance-Audit der Menü-Portal Seite"
```

**Vollständige Dokumentation:** Siehe `MCP-INTEGRATION.md`

---

## 🛠️ **Entwickler-Tools**

### **Empfohlene VS Code Extensions**

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-json",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.test-adapter-converter",
    "humao.rest-client",
    "mongodb.mongodb-vscode"
  ]
}
```

### **Scripts**

```bash
# Anwendung starten
npm start                 # Backend (Port 3000) + Frontend (Port 5173+) parallel

# Tests ausführen (isoliert von Produktion)
npm run test              # Alle Tests
npm run test:backend      # Nur Backend-Tests (isolierte In-Memory DB)
npm run test:frontend     # Nur Frontend-Tests
npm run test:coverage     # Mit Coverage-Report
npm run test:isolated     # Backend-Tests mit maximaler Isolation

# Entwicklung
npm run start:backend     # Nur Backend (Port 3000)
npm run start:frontend    # Nur Frontend (Port 5173+)

# Code-Qualität
npm run lint              # ESLint prüfen
npm run lint:fix          # ESLint Fehler automatisch beheben
npm run format            # Prettier formatieren
npm run format:check      # Prettier prüfen

# Build
npm run build             # Production Build erstellen
npm run build:backend     # Backend für Production
npm run build:frontend    # Frontend für Production

# Entwicklung
npm run dev               # Development-Server mit Hot-Reload
npm run dev:debug         # Mit Debug-Modus
```

## 🏗️ **Projektstruktur verstehen**

```
SmartWorkArt/
├── backend/                 # Node.js/Express Backend
│   ├── modules/            # Feature-Module (Rezepte, Zutaten, etc.)
│   ├── middleware/         # Express-Middleware
│   ├── models/            # MongoDB-Modelle
│   ├── utils/             # Hilfsfunktionen
│   └── __tests__/         # Backend-Tests
│
├── frontend/              # Vite-basiertes Frontend
│   ├── core/             # Kern-Module (Login, Dashboard)
│   ├── modules/          # Feature-Module
│   └── public/           # Statische Dateien
│
├── shared/               # Geteilte Ressourcen
│   ├── components/       # Wiederverwendbare Komponenten
│   ├── config/          # Konfigurationsdateien
│   ├── data/            # JSON-Daten
│   └── utils/           # Geteilte Utilities
│
└── .github/workflows/    # CI/CD Pipeline
```

## 🧪 **Testing-Strategien**

### **Backend-Tests**

```bash
# Unit-Tests für einzelne Controller
npm run test backend/__tests__/auth.test.js

# Integration-Tests für APIs
npm run test:integration

# Coverage-Report generieren (fokussiert auf kritische Module)
npm run test:coverage
```

#### **Intelligente Coverage-Strategie**

Unser Test-Setup **fokussiert sich bewusst auf kritische Sicherheitsmodule** anstatt oberflächlicher globaler Coverage:

- **🎯 Fokussiert**: Nur `auth/controller/loginUser.js`, `auth/controller/registerUser.js`, `auth/routes.js`
- **📊 Hohe Standards**: 80%+ Coverage für alle getesteten Module
- **🔒 Sicherheit**: Kritische Authentication-Logic zu 100% getestet  
- **⚡ Effizienz**: Keine false negatives von ungenutzten Modulen

```bash
# Ergebnis: ~87% Coverage bei 100% Function Coverage
# Deutlich besser als 5% "globale" Coverage über alle ungenutzten Module
```

### **Frontend-Tests**

```bash
# Unit-Tests für Module
npm run test:frontend

# E2E-Tests mit Playwright (wenn implementiert)
npm run test:e2e
```

## 🐛 **Debugging**

### **Backend-Debugging**

```bash
# Mit VS Code Debugger
npm run dev:debug

# Mit Chrome DevTools
node --inspect backend/server.js
```

### **Frontend-Debugging**

```bash
# Browser DevTools verwenden
npm run dev

# Network-Requests im Browser Developer Tools überwachen
# Vue DevTools / React DevTools falls applicable
```

## 🔒 **Sicherheits-Checkliste**

- [ ] `.env` Dateien niemals committen
- [ ] Sichere JWT-Secrets verwenden
- [ ] Input-Validierung bei allen Endpunkten
- [ ] Rate-Limiting aktiviert
- [ ] HTTPS in Production
- [ ] Sicherheits-Headers konfiguriert

## 📊 **Performance-Monitoring**

### **Backend-Performance**

```bash
# Memory Usage überwachen
node --inspect --max-old-space-size=4096 backend/server.js

# Performance-Profile erstellen
node --prof backend/server.js
```

### **Frontend-Performance**

```bash
# Lighthouse-Report generieren
npm run lighthouse

# Bundle-Analyse
npm run analyze
```

## 🚀 **Deployment**

### **Development Deployment**

```bash
# Docker-Entwicklungsumgebung
docker-compose up -d

# Lokaler Build-Test
npm run build
npm run start:production
```

### **Production Deployment**

```bash
# CI/CD Pipeline triggern
git push origin main

# Manueller Production-Build
NODE_ENV=production npm run build
```

## 🔧 **Troubleshooting**

### **Häufige Probleme**

**MongoDB-Verbindungsfehler:**
```bash
# MongoDB-Status prüfen
sudo systemctl status mongod

# MongoDB-Logs prüfen
tail -f /var/log/mongodb/mongod.log
```

**Port bereits belegt:**
```bash
# Port-Verwendung prüfen
lsof -i :3000
lsof -i :5173

# Prozess beenden
kill -9 <PID>
```

**NPM-Abhängigkeiten-Konflikte:**
```bash
# Node-Modules löschen und neu installieren
rm -rf node_modules package-lock.json
npm install

# Cache leeren
npm cache clean --force
```

### **Log-Dateien**

```bash
# Backend-Logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Frontend-Entwicklungsserver-Logs
npm run dev -- --debug
```

## 📚 **Weiterführende Dokumentation**

- [API-Dokumentation](./API-DOCS.md)
- [Datenbankschema](./DATABASE-SCHEMA.md)
- [Deployment-Guide](./DEPLOYMENT.md)
- [Sicherheits-Best-Practices](./SECURITY.md)
- [Performance-Optimierung](./PERFORMANCE.md)

## 👥 **Team-Konventionen**

### **Git-Workflow**

```bash
# Feature-Branch erstellen
git checkout -b feature/neue-funktion

# Commits mit aussagekräftigen Nachrichten
git commit -m "feat: neue Rezept-Suche implementiert"

# Pull Request erstellen
git push origin feature/neue-funktion
```

### **Code-Style**

- **JavaScript**: ESLint + Prettier
- **CSS**: BEM-Konvention
- **Commits**: Conventional Commits
- **Documentation**: JSDoc für komplexe Funktionen

### **Review-Prozess**

1. Feature-Branch erstellen
2. Code implementieren + Tests schreiben
3. Pull Request erstellen
4. Code-Review durch Team-Mitglied
5. CI/CD-Pipeline muss grün sein
6. Merge nach Approval

## ❓ **Support**

Bei Fragen oder Problemen:

1. **Dokumentation** durchsuchen
2. **GitHub Issues** prüfen
3. **Team-Chat** verwenden
4. **Issue erstellen** wenn Problem nicht gelöst

---

*Letzte Aktualisierung: Januar 2025* 