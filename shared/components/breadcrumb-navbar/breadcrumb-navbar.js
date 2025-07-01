// Breadcrumb-Navbar HTML Template
const breadcrumbNavbarHtml = `
<header class="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
    <div class="container-fluid">
        <div class="d-flex justify-content-between align-items-center w-100">
            <!-- Breadcrumb Navigation -->
            <nav aria-label="breadcrumb" class="flex-grow-1">
                <ol class="breadcrumb mb-0" id="breadcrumb-navigation">
                    <li class="breadcrumb-item">
                        <a href="/core/dashboard/index.html" class="text-decoration-none">
                            <i class="bi bi-house-door"></i> Dashboard
                        </a>
                    </li>
                    <!-- Dynamisch gefüllt durch JavaScript -->
                </ol>
            </nav>
            
            <!-- User Info und Logout -->
            <div class="d-flex align-items-center gap-3">
                <span id="breadcrumb-username" class="navbar-text">
                    <i class="bi bi-person-circle me-1"></i>
                    <span class="d-none d-sm-inline">Lade...</span>
                </span>
                <button id="breadcrumb-logout-btn" class="btn btn-outline-danger btn-sm">
                    <i class="bi bi-box-arrow-right"></i>
                    <span class="d-none d-sm-inline ms-1">Abmelden</span>
                </button>
            </div>
        </div>
    </div>
</header>
`;

/**
 * Konfiguration für Module-spezifische Breadcrumbs
 */
const MODULE_CONFIG = {
    'zahlen-auswertung': {
        icon: 'bi-bar-chart',
        title: 'Zahlen Auswertung'
    },
    'rezept': {
        icon: 'bi-book',
        title: 'Rezept-Verwaltung'
    },
    'menue-portal': {
        icon: 'bi-calendar-week',
        title: 'Menü-Portal'
    },
    'einrichtung': {
        icon: 'bi-building',
        title: 'Einrichtungsverwaltung'
    },
    'menueplan': {
        icon: 'bi-calendar3',
        title: 'Menüplan-Verwaltung'
    },
    'zutaten': {
        icon: 'bi-list-check',
        title: 'Zutaten-Verwaltung'
    },
    'abwesenheit': {
        icon: 'bi-calendar-x',
        title: 'Abwesenheiten'
    },
    'admin-dashboard': {
        icon: 'bi-gear-fill',
        title: 'Admin Dashboard'
    }
};

/**
 * Ermittelt das aktuelle Modul basierend auf dem URL-Pfad
 * @returns {string} Der Modulname
 */
function getCurrentModule() {
    const path = window.location.pathname;
    
    // Extrahiere Modulname aus Pfad wie /modules/zahlen-auswertung/index.html
    const moduleMatch = path.match(/\/modules\/([^\/]+)/);
    if (moduleMatch) {
        return moduleMatch[1];
    }
    
    // Extrahiere Core-Module aus Pfad wie /core/admin-dashboard/index.html
    const coreMatch = path.match(/\/core\/([^\/]+)/);
    if (coreMatch) {
        return coreMatch[1];
    }
    
    // Fallback: Versuche aus anderen Pfad-Patterns
    const pathSegments = path.split('/').filter(segment => segment);
    for (const segment of pathSegments) {
        if (MODULE_CONFIG[segment]) {
            return segment;
        }
    }
    
    return 'unknown';
}

/**
 * Initialisiert die Breadcrumb-Navbar
 * @param {string} containerId - ID des Container-Elements (default: 'breadcrumb-navbar-container')
 * @param {object} customConfig - Optionale benutzerdefinierte Konfiguration
 * @returns {Promise<object>} - Das Benutzerobjekt nach erfolgreicher Initialisierung
 */
export async function initializeBreadcrumbNavbar(containerId = 'breadcrumb-navbar-container', customConfig = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn(`Container mit ID '${containerId}' nicht gefunden`);
        return null;
    }
    
    // HTML einfügen
    container.innerHTML = breadcrumbNavbarHtml;
    
    // User-Authentication und -Info laden
    const user = await initializeUserInfo();
    
    // Logout-Handler einrichten
    setupLogoutHandler();
    
    // Modulspezifische Breadcrumb hinzufügen
    const currentModule = getCurrentModule();
    const config = customConfig || MODULE_CONFIG[currentModule];
    
    if (config) {
        addModuleBreadcrumb(config.icon, config.title);
    } else {
        console.warn(`Keine Konfiguration für Modul '${currentModule}' gefunden`);
    }
    
    // Benutzerobjekt zurückgeben
    return user;
}

/**
 * Initialisiert die User-Information
 * @returns {Promise<object>} - Das Benutzerobjekt
 */
async function initializeUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Wenn kein Token vorhanden ist, zum Login umleiten
        window.location.href = '/core/login/index.html';
        throw new Error('Kein Authentifizierungstoken gefunden.');
    }

    try {
        const user = await fetchCurrentUser(token);
        const usernameElement = document.getElementById('breadcrumb-username');
        if (usernameElement) {
            const usernameSpan = usernameElement.querySelector('span');
            if (usernameSpan) {
                usernameSpan.textContent = user.firstName || user.username || 'Benutzer';
            }
        }
        return user;
    } catch (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        // Bei Fehlern zum Login umleiten
        localStorage.removeItem('token');
        window.location.href = '/core/login/index.html';
        throw error;
    }
}

/**
 * Holt die Benutzerdaten vom Backend
 * @param {string} token - Der JWT-Token
 * @returns {Promise<object>} - Die Benutzerdaten
 */
async function fetchCurrentUser(token) {
    const response = await fetch('/api/user/current', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/core/login/index.html';
        }
        throw new Error('Fehler beim Abrufen der Benutzerdaten.');
    }
    
    return await response.json();
}

/**
 * Richtet den Logout-Handler ein
 */
function setupLogoutHandler() {
    const logoutBtn = document.getElementById('breadcrumb-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/core/login/index.html';
        });
    }
}

/**
 * Fügt einen Modul-spezifischen Breadcrumb hinzu
 * @param {string} icon - Bootstrap Icon Klasse (z.B. 'bi-bar-chart')
 * @param {string} title - Titel des Moduls
 */
function addModuleBreadcrumb(icon, title) {
    const breadcrumbNav = document.getElementById('breadcrumb-navigation');
    if (!breadcrumbNav) return;
    
    const moduleItem = document.createElement('li');
    moduleItem.className = 'breadcrumb-item active';
    moduleItem.setAttribute('aria-current', 'page');
    moduleItem.innerHTML = `<i class="${icon}"></i> ${title}`;
    
    breadcrumbNav.appendChild(moduleItem);
}

/**
 * Fügt einen zusätzlichen Breadcrumb-Eintrag hinzu (z.B. für Unterseiten)
 * @param {string} icon - Bootstrap Icon Klasse
 * @param {string} title - Titel des Eintrags
 * @param {string} href - Optional: Link-URL (wenn leer, wird als aktiver Eintrag markiert)
 */
export function addBreadcrumb(icon, title, href = null) {
    const breadcrumbNav = document.getElementById('breadcrumb-navigation');
    if (!breadcrumbNav) return;
    
    // Entferne 'active' Klasse von allen bestehenden Einträgen
    const activeItems = breadcrumbNav.querySelectorAll('.breadcrumb-item.active');
    activeItems.forEach(item => {
        item.classList.remove('active');
        item.removeAttribute('aria-current');
    });
    
    const newItem = document.createElement('li');
    
    if (href) {
        // Link-Eintrag
        newItem.className = 'breadcrumb-item';
        newItem.innerHTML = `<a href="${href}" class="text-decoration-none"><i class="${icon}"></i> ${title}</a>`;
    } else {
        // Aktiver Eintrag
        newItem.className = 'breadcrumb-item active';
        newItem.setAttribute('aria-current', 'page');
        newItem.innerHTML = `<i class="${icon}"></i> ${title}`;
    }
    
    breadcrumbNav.appendChild(newItem);
}

/**
 * Setzt die Breadcrumb-Navigation zurück (behält nur Dashboard + Modul)
 */
export function resetBreadcrumb() {
    const breadcrumbNav = document.getElementById('breadcrumb-navigation');
    if (!breadcrumbNav) return;
    
    // Entferne alle Einträge außer dem Dashboard-Link
    const items = breadcrumbNav.querySelectorAll('.breadcrumb-item');
    items.forEach((item, index) => {
        if (index > 0) { // Behalte nur Dashboard (Index 0)
            item.remove();
        }
    });
    
    // Füge Modul wieder hinzu
    const currentModule = getCurrentModule();
    const config = MODULE_CONFIG[currentModule];
    if (config) {
        addModuleBreadcrumb(config.icon, config.title);
    }
} 