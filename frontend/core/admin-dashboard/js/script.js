/*
 * Siehe _FUNKTIONSWEISE-script.md für eine detaillierte Beschreibung der Architektur und Verantwortlichkeiten dieses Orchestrators.
 */

// Lade die spezifischen Dashboard-Stile
import '../css/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import { initializeBreadcrumbNavbar } from '@shared/components/breadcrumb-navbar/breadcrumb-navbar.js';
import adminFeaturesConfig from '@shared/config/admin-features-config.json';
import { renderAdminNavigation } from './features/admin-navigation/admin-navigation-ui.js';

// UI-Funktionen und Index-Dateien importieren
import { renderApprovalUI } from './features/user-approval/user-approval-ui.js';
import { renderUserTable, showEditModal } from './features/user-management/user-management-ui.js';
import { renderNotificationsUI, showNotificationModal } from './features/notifications/notifications-ui.js';
import { renderFieldConfigurator, renderFieldList } from './features/field-configurator/field-configurator-ui.js';
import { renderModuleManagementUI } from './features/module-management/module-management-ui.js';

// Einziger Ort für API-Funktionen
import {
    fetchAllUsers,
    approveUser,
    deleteUser,
    updateUser,
    getCustomFields,
    updateCustomFields,
    getAllNotifications,
    createNotification,
    updateNotification,
    deleteNotification,
    getModules,
    updateModules,
    getRoles
} from './admin-api.js';

// Globale Variablen
let adminFeatures = [];
let allUsersCache = [];

// DOM-Elemente
const sidebarContainer = document.getElementById('admin-sidebar');
const contentContainer = document.getElementById('admin-feature-container');
const contentTitle = document.getElementById('admin-content-title');
const mobileAccordionContainer = document.getElementById('mobileAdminAccordion');

// Hilfsfunktionen für Features
async function loadAdminFeatures() {
    // ...
}

async function getUsersForApproval() {
    allUsersCache = await fetchAllUsers(); // Cache für spätere Verwendung füllen
    return allUsersCache.filter(user => !user.isApproved);
}

/**
 * Lädt die UI für die Benachrichtigungsverwaltung.
 * Holt die Daten und richtet die Callbacks für CRUD-Operationen ein.
 */
async function initializeNotificationsFeature(container) {
    const loadNotifications = async () => {
        try {
            const notifications = await getAllNotifications();
            const callbacks = {
                onAdd: () => showNotificationModal(null, async (data) => {
                    await createNotification(data);
                    loadNotifications();
                }),
                onEdit: (n) => showNotificationModal(n, async (data) => {
                    await updateNotification(data.id, data);
                    loadNotifications();
                }),
                onDelete: async (id) => {
                    if (confirm('Soll diese Benachrichtigung wirklich gelöscht werden?')) {
                        await deleteNotification(id);
                        loadNotifications();
                    }
                }
            };
            renderNotificationsUI(container, notifications, callbacks);
        } catch (error) {
            container.innerHTML = `<p class="text-danger">Fehler: ${error.message}</p>`;
        }
    };
    await loadNotifications();
}


/**
 * Erstellt das mobile Akkordeon-Menü
 */
function renderMobileAccordion(container, features, pendingCount) {
    if (!container) return;
    
    container.innerHTML = '';
    
    features.forEach((feature, index) => {
        const accordionItem = document.createElement('div');
        accordionItem.className = 'mobile-admin-accordion fade-in';
        accordionItem.style.animationDelay = `${index * 0.1}s`;
        
        const featureDescription = getFeatureDescription(feature.id);
        const badgeHtml = (feature.id === 'user-approval' && pendingCount > 0) 
            ? `<span class="feature-badge">${pendingCount}</span>` 
            : '';
        
        accordionItem.innerHTML = `
            <div class="mobile-nav-item">
                <button class="mobile-nav-button collapsed" 
                        data-feature-id="${feature.id}"
                        aria-expanded="false">
                    <i class="bi ${feature.icon} me-3"></i>
                    <div class="flex-grow-1">
                        <div class="d-flex align-items-center">
                            <span class="fw-bold">${feature.name}</span>
                            ${badgeHtml}
                        </div>
                        <small class="text-muted d-block">${featureDescription}</small>
                    </div>
                    <i class="bi bi-chevron-down toggle-icon"></i>
                </button>
                <div class="mobile-nav-content collapsed" id="mobile-content-${feature.id}">
                    <div class="text-center py-3">
                        <div class="loading-spinner"></div>
                        <p class="mt-2 mb-0 text-muted">Lade ${feature.name}...</p>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(accordionItem);
    });
    
    // Event-Listener für mobile Navigation (manuelles Toggle)
    container.addEventListener('click', (event) => {
        const button = event.target.closest('.mobile-nav-button');
        if (!button) return;
        
        event.preventDefault();
        
        const featureId = button.getAttribute('data-feature-id');
        const contentElement = document.getElementById(`mobile-content-${featureId}`);
        const toggleIcon = button.querySelector('.toggle-icon');
        
        if (!contentElement) return;
        
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        
        if (isExpanded) {
            // Schließen
            button.setAttribute('aria-expanded', 'false');
            button.classList.add('collapsed');
            contentElement.classList.add('collapsed');
            toggleIcon.style.transform = 'rotate(0deg)';
        } else {
            // Öffnen
            button.setAttribute('aria-expanded', 'true');
            button.classList.remove('collapsed');
            contentElement.classList.remove('collapsed');
            toggleIcon.style.transform = 'rotate(180deg)';
            
            // Content laden wenn noch nicht geladen
            if (contentElement.innerHTML.includes('loading-spinner')) {
                loadFeatureContent(featureId, contentElement);
            }
        }
    });
}

/**
 * Gibt eine Beschreibung für ein Feature zurück
 */
function getFeatureDescription(featureId) {
    const descriptions = {
        'user-approval': 'Neue Benutzeranmeldungen genehmigen oder ablehnen',
        'user-management': 'Bestehende Benutzer verwalten und bearbeiten',
        'field-config': 'Registrierungsformular-Felder konfigurieren',
        'notifications': 'System-Benachrichtigungen erstellen und verwalten',
        'module-management': 'Module und Rollen-Zugriffe verwalten'
    };
    return descriptions[featureId] || 'Admin-Funktion';
}

/**
 * Lädt den Inhalt für ein spezifisches Feature
 */
async function loadFeatureContent(featureId, container) {
    if (!container) return;
    
    try {
        const feature = adminFeatures.find(f => f.id === featureId);
        if (!feature) return;
        
        // Zeige Loading-State
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="loading-spinner"></div>
                <p class="mt-2 mb-0 text-muted">Lade ${feature.name}...</p>
            </div>
        `;
        
        // Gleiche Logik wie für Desktop, aber in Container
        await loadFeatureForContainer(featureId, container);
        
    } catch (error) {
        console.error(`Fehler beim Laden von ${featureId}:`, error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle me-2"></i>
                Fehler beim Laden der Funktion. Bitte versuchen Sie es erneut.
            </div>
        `;
    }
}

/**
 * Zentrale Funktion zum Laden von Feature-Inhalten
 */
async function loadFeatureForContainer(featureId, container) {
    // Gleiche Logik wie in handleNavigation, aber für beliebigen Container
    
    if (featureId === 'user-management') {
        const approved = allUsersCache.filter(u => u.isApproved);
        renderUserTable(container, approved, 
            async (id) => { 
                await deleteUser(id); 
                await refreshAllData(); 
            },
            (user) => showEditModal(user, async (id, data) => {
                await updateUser(id, data);
                await refreshAllData();
            })
        );
    } else if (featureId === 'user-approval') {
        const pending = allUsersCache.filter(u => !u.isApproved);
        const callbacks = {
            onApprove: async (id) => {
                await approveUser(id);
                await refreshAllData();
            },
            onDelete: async (id) => {
                if (confirm('Soll dieser Benutzer wirklich abgelehnt und gelöscht werden?')) {
                    await deleteUser(id);
                    await refreshAllData();
                }
            }
        };
        renderApprovalUI(container, pending, callbacks);
    } else if (featureId === 'field-config') {
        try {
            let currentFields = await getCustomFields();
            const refreshList = async () => {
                currentFields = await getCustomFields();
                const listContainer = container.querySelector('#field-list-container');
                if (listContainer) {
                    renderFieldList(listContainer, currentFields);
                }
            };
            const callbacks = {
                onSave: async (fieldData, oldId) => {
                    let updatedFields;
                    if (oldId) {
                        const index = currentFields.findIndex(f => f.id === oldId);
                        if (index !== -1) currentFields[index] = fieldData;
                        updatedFields = [...currentFields];
                    } else {
                        if (currentFields.some(f => f.id === fieldData.id)) {
                            alert('Fehler: Diese Feld-ID existiert bereits.');
                            return;
                        }
                        updatedFields = [...currentFields, fieldData];
                    }
                    if (updatedFields) {
                        await updateCustomFields(updatedFields);
                        await refreshList();
                    }
                },
                onDelete: async (fieldIdToDelete) => {
                    const updatedFields = currentFields.filter(f => f.id !== fieldIdToDelete);
                    await updateCustomFields(updatedFields);
                    await refreshList();
                },
                getFields: () => currentFields
            };
            renderFieldConfigurator(container, currentFields, callbacks);
        } catch(e) {
            console.error("Fehler im 'field-config':", e);
            container.innerHTML = `<div class="alert alert-danger">Fehler beim Laden der Feld-Konfiguration: ${e.message}</div>`;
        }
    } else if (featureId === 'notifications') {
        const loadNotifications = async () => {
            try {
                const notifications = await getAllNotifications();
                const callbacks = {
                    onAdd: () => showNotificationModal(null, async (data) => {
                        await createNotification(data);
                        loadNotifications();
                    }),
                    onEdit: (n) => showNotificationModal(n, async (data) => {
                        await updateNotification(data.id, data);
                        loadNotifications();
                    }),
                    onDelete: async (id) => {
                        if (confirm('Soll diese Benachrichtigung wirklich gelöscht werden?')) {
                            await deleteNotification(id);
                            loadNotifications();
                        }
                    }
                };
                renderNotificationsUI(container, notifications, callbacks);
            } catch (error) {
                container.innerHTML = `<p class="text-danger">Fehler: ${error.message}</p>`;
            }
        };
        await loadNotifications();
    } else if (featureId === 'module-management') {
        const [modules, roles] = await Promise.all([getModules(), getRoles()]);
        const callbacks = {
            onSave: async (updatedModules) => {
                await updateModules(updatedModules);
                await refreshAllData();
            }
        };
        renderModuleManagementUI(container, modules, roles, callbacks);
    }
}

/**
 * Aktualisiert alle Daten und UI-Elemente
 */
async function refreshAllData() {
    try {
        allUsersCache = await fetchAllUsers();
        const pendingUsers = await getUsersForApproval();
        
        // Desktop Navigation aktualisieren
        if (sidebarContainer) {
            const sidebar = sidebarContainer.querySelector('.position-sticky');
            if (sidebar) {
                renderAdminNavigation(sidebar, adminFeatures, pendingUsers.length, handleNavigation);
            }
        }
        
        // Mobile Accordion aktualisieren
        if (mobileAccordionContainer) {
            renderMobileAccordion(mobileAccordionContainer, adminFeatures, pendingUsers.length);
        }
    } catch (error) {
        console.error('Fehler beim Aktualisieren der Daten:', error);
    }
}

/**
 * Überprüft ob mobile oder desktop Ansicht aktiv ist
 */
function isMobileView() {
    return window.innerWidth < 768;
}

/**
 * Initialisiert das Admin-Dashboard.
 */
async function initializeAdminDashboard() {
    try {
        // Breadcrumb-Navbar initialisieren (enthält bereits User-Management)
        const user = await initializeBreadcrumbNavbar();
        if (!user || !user.role.includes('admin')) {
            window.location.href = '/core/dashboard/index.html';
            return;
        }

        adminFeatures = adminFeaturesConfig;
        allUsersCache = await fetchAllUsers();
        const pendingUsers = await getUsersForApproval();
        
        // Desktop Navigation
        if (sidebarContainer) {
            const sidebar = sidebarContainer.querySelector('.position-sticky');
            if (sidebar) {
                renderAdminNavigation(sidebar, adminFeatures, pendingUsers.length, handleNavigation);
            }
        }
        
        // Mobile Accordion
        if (mobileAccordionContainer) {
            renderMobileAccordion(mobileAccordionContainer, adminFeatures, pendingUsers.length);
        }
        
        // Erstes Feature für Desktop laden
        if (adminFeatures.length > 0 && !isMobileView()) {
            handleNavigation(adminFeatures[0].id);
        }
        
        // Responsive Event Listener
        window.addEventListener('resize', () => {
            // Optional: UI bei Größenänderung anpassen
        });

    } catch (error) {
        console.error("Fehler beim Initialisieren des Admin Dashboards:", error);
        
        // Fehler in beiden Layouts anzeigen
        const errorMsg = `<div class="alert alert-danger">Ein schwerwiegender Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.</div>`;
        
        if (contentContainer) {
            contentContainer.innerHTML = errorMsg;
        }
        if (mobileAccordionContainer) {
            mobileAccordionContainer.innerHTML = errorMsg;
        }
    }
}

async function handleNavigation(featureId) {
    const titleEl = document.getElementById('admin-content-title');
    const containerEl = document.getElementById('admin-feature-container');
    const feature = adminFeatures.find(f => f.id === featureId);

    if (!titleEl || !containerEl || !feature) return;

    titleEl.textContent = feature.name;
    const featureContentId = `${feature.id}-content`;
    containerEl.innerHTML = `<div id="${featureContentId}">
        <div class="text-center py-4">
            <div class="loading-spinner"></div>
            <p class="mt-2 mb-0 text-muted">Lade ${feature.name}...</p>
        </div>
    </div>`;
    const featureContentEl = document.getElementById(featureContentId);

    try {
        await loadFeatureForContainer(featureId, featureContentEl);
    } catch (error) {
        console.error(`Fehler beim Laden von ${featureId}:`, error);
        featureContentEl.innerHTML = `<div class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Fehler beim Laden der ${feature.name}. Bitte versuchen Sie es später erneut.
        </div>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeAdminDashboard); 