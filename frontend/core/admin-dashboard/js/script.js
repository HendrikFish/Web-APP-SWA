/*
 * Siehe _FUNKTIONSWEISE-script.md für eine detaillierte Beschreibung der Architektur und Verantwortlichkeiten dieses Orchestrators.
 */

// Lade die spezifischen Dashboard-Stile
import '../css/style.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { initializeHeader } from '@shared/components/header/header.js';
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
 * Initialisiert das Admin-Dashboard.
 */
async function initializeAdminDashboard() {
    try {
        const user = await initializeHeader();
        if (!user || !user.role.includes('admin')) {
            window.location.href = '/core/dashboard/index.html';
            return;
        }

        adminFeatures = adminFeaturesConfig;
        const pendingUsers = await getUsersForApproval();
        
        const sidebar = document.getElementById('admin-sidebar').querySelector('.position-sticky');
        renderAdminNavigation(sidebar, adminFeatures, pendingUsers.length, handleNavigation);
        
        if (adminFeatures.length > 0) {
            handleNavigation(adminFeatures[0].id);
        }

    } catch (error) {
        console.error("Fehler beim Initialisieren des Admin Dashboards:", error);
        document.getElementById('admin-feature-container').innerHTML = `<div class="alert alert-danger">Ein schwerwiegender Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.</div>`;
    }
}

async function handleNavigation(featureId) {
    const titleEl = document.getElementById('admin-content-title');
    const containerEl = document.getElementById('admin-feature-container');
    const feature = adminFeatures.find(f => f.id === featureId);

    if (!titleEl || !containerEl || !feature) return;

    titleEl.textContent = feature.name;
    const featureContentId = `${feature.id}-content`;
    containerEl.innerHTML = `<div id="${featureContentId}"><p>Lade ${feature.name}...</p></div>`;
    const featureContentEl = document.getElementById(featureContentId);

    try {
        if (featureId === 'user-management') {
            const approved = allUsersCache.filter(u => u.isApproved);
            renderUserTable(featureContentEl, approved, 
                async (id) => { await deleteUser(id); initializeAdminDashboard(); },
                (user) => showEditModal(user, async (id, data) => {
                    await updateUser(id, data);
                    initializeAdminDashboard();
                })
            );
        } else if (featureId === 'user-approval') {
            const pending = allUsersCache.filter(u => !u.isApproved);
            const callbacks = {
                onApprove: async (id) => {
                    await approveUser(id);
                    initializeAdminDashboard();
                },
                onDelete: async (id) => {
                    if (confirm('Soll dieser Benutzer wirklich abgelehnt und gelöscht werden?')) {
                        await deleteUser(id);
                        initializeAdminDashboard();
                    }
                }
            };
            renderApprovalUI(featureContentEl, pending, callbacks);
        } else if (featureId === 'field-config') {
            { 
                try {
                    let currentFields = await getCustomFields();
                    const refreshList = async () => {
                        currentFields = await getCustomFields();
                        const listContainer = featureContentEl.querySelector('#field-list-container');
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
                    renderFieldConfigurator(featureContentEl, currentFields, callbacks);
                } catch(e) {
                    console.error("Fehler im 'field-config':", e);
                    featureContentEl.innerHTML = `<div class="alert alert-danger">Fehler beim Laden der Feld-Konfiguration: ${e.message}</div>`;
                }
            }
        } else if (featureId === 'notifications') {
            await initializeNotificationsFeature(featureContentEl);
        } else if (featureId === 'module-management') {
            const [modules, roles] = await Promise.all([
                getModules(),
                getRoles()
            ]);
            
            const callbacks = {
                onSave: async (updatedModules) => {
                    try {
                        await updateModules(updatedModules);
                        // Hier könnte eine Toast-Notification angezeigt werden
                        alert('Modulberechtigungen erfolgreich gespeichert!');
                        handleNavigation('module-management'); // Ansicht neu laden, um Änderungen zu bestätigen
                    } catch (error) {
                        console.error('Fehler beim Speichern der Modulberechtigungen:', error);
                        alert(`Fehler: ${error.message}`);
                    }
                }
            };
            
            renderModuleManagementUI(featureContentEl, modules, roles, callbacks);
        } else {
            featureContentEl.innerHTML = `<p>Feature "${feature.name}" wird bald implementiert.</p>`;
        }
    } catch (error) {
        featureContentEl.innerHTML = `<p class="text-danger">Fehler: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', initializeAdminDashboard); 