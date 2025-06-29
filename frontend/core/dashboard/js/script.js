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
const userWelcomeName = document.getElementById('user-welcome-name');
const moduleContainer = document.getElementById('module-container');
const notificationsContainer = document.getElementById('notifications-container');

/**
 * Erstellt eine einzelne Modul-Kachel als Bootstrap-Card.
 * @param {object} module Das Modul-Objekt aus der Konfiguration.
 * @returns {HTMLAnchorElement} Das-DOM-Element für die Modul-Kachel.
 */
function createModuleCard(module, index = 0) {
    const card = document.createElement('div');
    card.className = 'fade-in';
    card.style.animationDelay = `${index * 0.1}s`;

    const isMobile = window.innerWidth < 768;
    const iconHtml = module.icon ? `<i class="module-icon bi ${module.icon}"></i>` : '';
    
    const cardContent = `
        <a href="${module.path}" class="module-card text-decoration-none text-dark">
            <div class="card-body">
                ${isMobile ? `
                    ${iconHtml}
                    <div class="card-content">
                        <h5 class="card-title">${module.name}</h5>
                        <p class="card-text">${module.description}</p>
                    </div>
                ` : `
                    ${iconHtml}
                    <h5 class="card-title">${module.name}</h5>
                    <p class="card-text">${module.description}</p>
                `}
            </div>
        </a>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

/**
 * Erstellt eine Benachrichtigungs-Card für Admin-Benachrichtigungen
 * @param {number} notificationCount Anzahl der ungelesenen Benachrichtigungen
 * @returns {HTMLElement} Das Benachrichtigungs-Card-Element
 */
function createNotificationCard(notificationCount) {
    if (notificationCount === 0) return null;
    
    const card = document.createElement('div');
    card.className = 'fade-in';
    
    const isMobile = window.innerWidth < 768;
    
    const cardContent = `
        <div class="notification-card" style="cursor: pointer;" onclick="showNotificationCenter()">
            <div class="card-body">
                <span class="notification-badge">${notificationCount}</span>
                ${isMobile ? `
                    <i class="notification-icon bi bi-bell-fill"></i>
                    <div class="notification-content">
                        <h5 class="card-title">Neue Benachrichtigungen</h5>
                        <p class="card-text">Sie haben ${notificationCount} ungelesene Benachrichtigung${notificationCount > 1 ? 'en' : ''}.</p>
                    </div>
                ` : `
                    <i class="notification-icon bi bi-bell-fill"></i>
                    <h5 class="card-title">Neue Benachrichtigungen</h5>
                    <p class="card-text">Sie haben ${notificationCount} ungelesene Benachrichtigung${notificationCount > 1 ? 'en' : ''}.</p>
                `}
            </div>
        </div>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

/**
 * Zeigt das Benachrichtigungszentrum (öffnet Modal oder zeigt Toast)
 */
function showNotificationCenter() {
    // Hier könnten Sie ein Modal öffnen oder direkt die Benachrichtigungen anzeigen
    fetchAndShowNotifications();
}

// Globale Funktionen für onclick-Events verfügbar machen
window.showNotificationCenter = showNotificationCenter;

/**
 * Rendert die Modul-Kacheln auf der Dashboard-Seite basierend auf den Rollen des Benutzers.
 * @param {string[]} userRoles Die Rollen des aktuellen Benutzers.
 * @param {number} notificationCount Anzahl der ungelesenen Benachrichtigungen
 */
function renderModuleCards(userRoles, notificationCount = 0) {
    if (!moduleContainer) return;

    moduleContainer.innerHTML = ''; 
    
    // Benachrichtigungs-Card als erste Card hinzufügen
    if (notificationCount > 0 && notificationsContainer) {
        const notificationCard = createNotificationCard(notificationCount);
        if (notificationCard) {
            notificationsContainer.appendChild(notificationCard);
        }
    }
    
    const accessibleModules = allModules.filter(module => 
        module.roles.some(role => userRoles.includes(role))
    );

    if (accessibleModules.length > 0) {
        accessibleModules.forEach((module, index) => {
            const cardElement = createModuleCard(module, index);
            moduleContainer.appendChild(cardElement);
        });
    } else {
        moduleContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-circle text-muted" style="font-size: 3rem;"></i>
                <h5 class="text-muted mt-3">Keine Module verfügbar</h5>
                <p class="text-muted">Für Ihre Rolle sind momentan keine Module freigeschaltet.</p>
            </div>
        `;
    }
}

/**
 * Holt ungelesene Benachrichtigungen und gibt die Anzahl zurück
 */
async function getNotificationCount() {
    try {
        const notifications = await getUnreadNotifications();
        return notifications ? notifications.length : 0;
    } catch (error) {
        console.error('Fehler beim Abrufen der Benachrichtigungsanzahl:', error);
        return 0;
    }
}

/**
 * Holt ungelesene Benachrichtigungen und zeigt sie als Toasts an.
 */
async function fetchAndShowNotifications() {
    try {
        const notifications = await getUnreadNotifications();

        if (notifications && notifications.length > 0) {
            notifications.forEach(notification => {
                // Verwende die neue showNotificationToast Funktion für Titel und Nachricht
                showNotificationToast(notification.title, notification.message, 'info', 6000);
                // Markiere die Benachrichtigung sofort als gelesen, um sie nicht erneut anzuzeigen.
                markNotificationAsRead(notification.id);
            });
            
            // Benachrichtigungs-Card ausblenden nach dem Anzeigen
            if (notificationsContainer) {
                setTimeout(() => {
                    notificationsContainer.innerHTML = '';
                }, 1000);
            }
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
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
        
        // Benutzername im Welcome-Bereich anzeigen
        if (user && user.firstName && userWelcomeName) {
            userWelcomeName.textContent = user.firstName;
        } else if (user && user.username && userWelcomeName) {
            userWelcomeName.textContent = user.username;
        }
        
        // Anzahl der ungelesenen Benachrichtigungen abrufen
        const notificationCount = await getNotificationCount();
        
        // Rendert die Modul-Kacheln basierend auf den Benutzerrollen
        if (user && user.roles) {
            renderModuleCards(user.roles, notificationCount);
        } else if (user && user.role) {
            renderModuleCards([user.role], notificationCount);
        } else {
            console.error("Benutzerdaten oder Rollen konnten nicht geladen werden.");
            if (moduleContainer) {
                moduleContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
                        <h5 class="text-warning mt-3">Fehler beim Laden</h5>
                        <p class="text-muted">Die Module konnten nicht geladen werden.</p>
                    </div>
                `;
            }
        }
        
        // Responsive Layout Updates bei Größenänderung
        window.addEventListener('resize', () => {
            if (user && user.roles) {
                renderModuleCards(user.roles, notificationCount);
            } else if (user && user.role) {
                renderModuleCards([user.role], notificationCount);
            }
        });

    } catch (error) {
        console.error("Fehler bei der Initialisierung des Dashboards:", error);
        showToast('Fehler beim Laden des Dashboards. Bitte versuchen Sie es erneut.', 'error');
        // localStorage.removeItem('token');
        // window.location.href = '/core/login/index.html';
    }
}

// Initialisierung beim Laden des Skripts
initializeDashboard(); 