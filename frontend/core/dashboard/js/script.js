/*
 * Haupt-Skript für das Core-Dashboard-Layout.
 * Dieses Skript ist verantwortlich für:
 * 1. Das Laden globaler Styles und Frameworks (Bootstrap).
 * 2. Das Initialisieren von Core-Komponenten wie dem Header.
 * 3. Das Bereitstellen einer Basis für alle untergeordneten Module.
 */

// Lade Bootstrap einmal zentral für alle Module, die in diesem Layout laufen.
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '../css/style.css';

import { initializeHeader } from '@shared/components/header/header.js';
import allModules from '@shared/config/module-config.json';
import { showToast, showNotificationToast } from '@shared/components/toast-notification/toast-notification.js';
import { getUnreadNotifications, markNotificationAsRead } from './module/notification-api.js';

// DOM-Elemente
const userFirstNameSpan = document.getElementById('user-firstname');
const moduleContainer = document.getElementById('module-container');

/**
 * Erstellt eine einzelne Modul-Kachel als Bootstrap-Card.
 * @param {object} module Das Modul-Objekt aus der Konfiguration.
 * @returns {HTMLAnchorElement} Das-DOM-Element für die Modul-Kachel.
 */
function createModuleCard(module) {
    const card = document.createElement('div');
    card.className = 'col';

    const cardContent = `
        <a href="${module.path}" class="card h-100 text-decoration-none text-dark shadow-sm">
            <div class="card-body">
                <h5 class="card-title">${module.name}</h5>
                <p class="card-text">${module.description}</p>
            </div>
        </a>
    `;
    card.innerHTML = cardContent;
    return card;
}

/**
 * Rendert die Modul-Kacheln auf der Dashboard-Seite basierend auf den Rollen des Benutzers.
 * @param {string[]} userRoles Die Rollen des aktuellen Benutzers.
 */
function renderModuleCards(userRoles) {
    if (!moduleContainer) return;

    moduleContainer.innerHTML = ''; 
    const accessibleModules = allModules.filter(module => 
        module.roles.some(role => userRoles.includes(role))
    );

    if (accessibleModules.length > 0) {
        accessibleModules.forEach(module => {
            const cardElement = createModuleCard(module);
            moduleContainer.appendChild(cardElement);
        });
    } else {
        moduleContainer.innerHTML = '<p class="text-center col-12">Keine Module für Ihre Rolle verfügbar.</p>';
    }
}

/**
 * Holt ungelesene Benachrichtigungen und zeigt sie als Toasts an.
 */
async function fetchAndShowNotifications() {
    const notifications = await getUnreadNotifications();

    if (notifications && notifications.length > 0) {
        notifications.forEach(notification => {
            // Verwende die neue showNotificationToast Funktion für Titel und Nachricht
            showNotificationToast(notification.title, notification.message, 'info', 6000);
            // Markiere die Benachrichtigung sofort als gelesen, um sie nicht erneut anzuzeigen.
            markNotificationAsRead(notification.id);
        });
    }
}

/**
 * Initialisiert das Dashboard: Holt Benutzerdaten und rendert die Module.
 */
async function initializeDashboard() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/core/login/index.html';
        return;
    }

    try {
        // Initialisiert den Header und gibt den Benutzernamen zurück
        const user = await initializeHeader();
        
        // Rendert die Modul-Kacheln basierend auf den Benutzerrollen
        if (user && user.roles) {
            renderModuleCards(user.roles);
        } else if (user && user.role) {
            renderModuleCards([user.role]);
        } else {
            console.error("Benutzerdaten oder Rollen konnten nicht geladen werden.");
            if (moduleContainer) {
                moduleContainer.innerHTML = '<p class="text-center col-12">Fehler beim Laden der Module.</p>';
            }
        }
        
        // Nach dem Rendern des Dashboards nach Benachrichtigungen suchen.
        await fetchAndShowNotifications();

    } catch (error) {
        console.error("Fehler bei der Initialisierung des Dashboards:", error);
        localStorage.removeItem('token');
        // window.location.href = '/core/login/index.html';
    }
}

// Initialisierung beim Laden des Skripts
initializeDashboard(); 