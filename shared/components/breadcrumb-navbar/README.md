# Breadcrumb-Navbar Komponente

Eine wiederverwendbare Breadcrumb-Navigation für alle Module in SmartWorkArt.

## Verwendung

### 1. HTML einbinden

Füge einen Container für die Breadcrumb-Navbar in dein HTML ein:

```html
<div id="breadcrumb-navbar-container"></div>
```

### 2. JavaScript importieren und initialisieren

```javascript
import { initializeBreadcrumbNavbar } from '@shared/components/breadcrumb-navbar/breadcrumb-navbar.js';

// Einfache Initialisierung (automatische Erkennung des Moduls)
initializeBreadcrumbNavbar();

// Mit benutzerdefiniertem Container
initializeBreadcrumbNavbar('mein-container-id');

// Mit benutzerdefinierter Konfiguration
initializeBreadcrumbNavbar('breadcrumb-navbar-container', {
    icon: 'bi-custom-icon',
    title: 'Benutzerdefinierter Titel'
});
```

### 3. Zusätzliche Breadcrumbs hinzufügen

```javascript
import { addBreadcrumb, resetBreadcrumb } from '@shared/components/breadcrumb-navbar/breadcrumb-navbar.js';

// Zusätzlichen Breadcrumb hinzufügen
addBreadcrumb('bi-pencil', 'Bearbeiten');

// Breadcrumb mit Link hinzufügen
addBreadcrumb('bi-list', 'Liste', '/modules/mein-modul/liste.html');

// Zurück zur Basis-Navigation
resetBreadcrumb();
```

## Automatisch unterstützte Module

Die Komponente erkennt automatisch folgende Module:

- **zahlen-auswertung**: Zahlen Auswertung (bar-chart Icon)
- **rezept**: Rezept-Verwaltung (book Icon)
- **menue-portal**: Menü-Portal (calendar-week Icon)
- **einrichtung**: Einrichtungsverwaltung (building Icon)
- **menueplan**: Menüplan-Verwaltung (calendar3 Icon)
- **zutaten**: Zutaten-Verwaltung (list-check Icon)

## Struktur

```
shared/components/breadcrumb-navbar/
├── breadcrumb-navbar.html      # HTML-Template
├── breadcrumb-navbar.js        # JavaScript-Logik
└── README.md                   # Diese Dokumentation
```

## API

### initializeBreadcrumbNavbar(containerId, customConfig)
- `containerId` (string): ID des Container-Elements (default: 'breadcrumb-navbar-container')
- `customConfig` (object): Optionale Konfiguration mit `icon` und `title`

### addBreadcrumb(icon, title, href)
- `icon` (string): Bootstrap Icon Klasse (z.B. 'bi-pencil')
- `title` (string): Angezeigter Text
- `href` (string, optional): Link-URL. Wenn nicht angegeben, wird als aktiver Eintrag markiert

### resetBreadcrumb()
Setzt die Navigation auf Dashboard + aktuelles Modul zurück.

## Beispiel komplette Integration

```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>Mein Modul</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <!-- Breadcrumb Navigation -->
    <div id="breadcrumb-navbar-container"></div>
    
    <!-- Hauptinhalt -->
    <main class="container my-4">
        <!-- Inhalt des Moduls -->
    </main>
    
    <script type="module">
        import { initializeBreadcrumbNavbar } from '/shared/components/breadcrumb-navbar/breadcrumb-navbar.js';
        
        // Navigation initialisieren
        initializeBreadcrumbNavbar();
    </script>
</body>
</html>
``` 