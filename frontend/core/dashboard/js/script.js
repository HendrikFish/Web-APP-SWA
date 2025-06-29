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
 * Erstellt eine Benachrichtigungs-Card für eine spezifische Admin-Benachrichtigung
 * @param {object} notification Die Benachrichtigungsdaten
 * @param {number} index Index für Animation-Delay
 * @returns {HTMLElement} Das Benachrichtigungs-Card-Element
 */
function createNotificationCard(notification, index = 0) {
    const card = document.createElement('div');
    card.className = 'fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const isMobile = window.innerWidth < 768;
    
    // Icon basierend auf Trigger-Typ
    const getNotificationIcon = (trigger) => {
        switch (trigger) {
            case 'onLogin': return 'bi-door-open-fill';
            case 'once': return 'bi-info-circle-fill';
            case 'interval': return 'bi-calendar-event-fill';
            default: return 'bi-bell-fill';
        }
    };
    
    const iconClass = getNotificationIcon(notification.trigger);
    
    // Badge-Text basierend auf Trigger-Typ
    const getBadgeText = (trigger) => {
        switch (trigger) {
            case 'onLogin': return 'Login';
            case 'once': return 'Neu';
            case 'interval': return 'Termin';
            default: return 'Info';
        }
    };
    
    const badgeText = getBadgeText(notification.trigger);
    
    const cardContent = `
        <div class="notification-card" data-trigger="${notification.trigger}" style="cursor: pointer;" onclick="handleNotificationClick('${notification.id}')">
            <div class="card-body">
                <span class="notification-badge">${badgeText}</span>
                ${isMobile ? `
                    <i class="notification-icon bi ${iconClass}"></i>
                    <div class="notification-content">
                        <h5 class="card-title">${notification.title}</h5>
                        <p class="card-text">${notification.message}</p>
                    </div>
                ` : `
                    <i class="notification-icon bi ${iconClass}"></i>
                    <h5 class="card-title">${notification.title}</h5>
                    <p class="card-text">${notification.message}</p>
                `}
            </div>
        </div>
    `;
    
    card.innerHTML = cardContent;
    return card;
}

/**
 * Behandelt Klicks auf Benachrichtigungs-Cards
 * @param {string} notificationId Die ID der geklickten Benachrichtigung
 */
function handleNotificationClick(notificationId) {
    // Card-Element finden
    const cardElement = document.querySelector(`[onclick="handleNotificationClick('${notificationId}')"]`).closest('.fade-in');
    const triggerType = cardElement?.querySelector('.notification-card')?.getAttribute('data-trigger');
    
    // Benachrichtigung als gelesen markieren (außer bei onLogin-Benachrichtigungen)
    if (triggerType !== 'onLogin') {
        markNotificationAsRead(notificationId);
        showToast('Benachrichtigung als gelesen markiert', 'success', 2000);
    } else {
        showToast('Login-Benachrichtigung zur Kenntnis genommen', 'info', 2000);
    }
    
    // Card aus dem DOM entfernen mit Animation
    if (cardElement) {
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            cardElement.remove();
        }, 300);
    }
}

// Globale Funktionen für onclick-Events verfügbar machen
window.handleNotificationClick = handleNotificationClick;

/**
 * Rendert die Modul-Kacheln auf der Dashboard-Seite basierend auf den Rollen des Benutzers.
 * @param {string[]} userRoles Die Rollen des aktuellen Benutzers.
 * @param {Array} notifications Array der Benachrichtigungen
 */
function renderModuleCards(userRoles, notifications = []) {
    if (!moduleContainer) return;

    moduleContainer.innerHTML = ''; 
    
    // Benachrichtigungs-Cards als erste Cards hinzufügen
    if (notifications.length > 0 && notificationsContainer) {
        notificationsContainer.innerHTML = ''; // Container leeren
        notifications.forEach((notification, index) => {
            const notificationCard = createNotificationCard(notification, index);
            if (notificationCard) {
                notificationsContainer.appendChild(notificationCard);
            }
        });
    }
    
    const accessibleModules = allModules.filter(module => 
        module.roles.some(role => userRoles.includes(role))
    );

    if (accessibleModules.length > 0) {
        accessibleModules.forEach((module, index) => {
            const cardElement = createModuleCard(module, index + notifications.length);
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
 * Holt relevante Benachrichtigungen für das Dashboard
 */
async function getDashboardNotifications() {
    try {
        const notifications = await getUnreadNotifications();
        return notifications || [];
    } catch (error) {
        console.error('Fehler beim Abrufen der Benachrichtigungen:', error);
        return [];
    }
}

/**
 * Holt Benachrichtigungen und zeigt sie als Toasts an (für manuellen Aufruf)
 */
async function fetchAndShowNotifications() {
    try {
        const notifications = await getUnreadNotifications();

        if (notifications && notifications.length > 0) {
            notifications.forEach(notification => {
                // Verwende die neue showNotificationToast Funktion für Titel und Nachricht
                showNotificationToast(notification.title, notification.message, 'info', 6000);
                // Markiere nur "once" und "interval" Benachrichtigungen als gelesen
                if (notification.trigger !== 'onLogin') {
                    markNotificationAsRead(notification.id);
                }
            });
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
        
        // Benachrichtigungen für das Dashboard abrufen
        const notifications = await getDashboardNotifications();
        
        // Rendert die Modul-Kacheln basierend auf den Benutzerrollen
        if (user && user.roles) {
            renderModuleCards(user.roles, notifications);
        } else if (user && user.role) {
            renderModuleCards([user.role], notifications);
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
                renderModuleCards(user.roles, notifications);
            } else if (user && user.role) {
                renderModuleCards([user.role], notifications);
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