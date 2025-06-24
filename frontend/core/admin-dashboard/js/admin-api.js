/*
 * Siehe _FUNKTIONSWEISE-admin-api.md für eine detaillierte Beschreibung der Architektur und Verantwortlichkeiten.
 */

/**
 * @module admin-api
 * @description Zentrales Modul für alle API-Aufrufe im Admin-Dashboard.
 * Bündelt die Kommunikation mit dem Backend für verschiedene Admin-Features.
 */

// Private Hilfsfunktion für alle authentifizierten Anfragen
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/core/login/index.html';
        throw new Error('Nicht authentifiziert');
    }

    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
    };

    const response = await fetch(url, config);

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/core/login/index.html';
        throw new Error('Sitzung abgelaufen oder nicht autorisiert.');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Netzwerkfehler: ${response.status}` }));
        throw new Error(errorData.message);
    }

    // Für 'DELETE' Anfragen, die oft keinen Body haben
    if (response.status === 204) {
        return {};
    }

    return response.json();
}

/**
 * Ruft die Liste aller Benutzer vom Backend ab.
 * @returns {Promise<Array>} Ein Promise, das zu einem Array von Benutzerobjekten auflöst.
 * @throws {Error} Wirft einen Fehler, wenn die Anfrage fehlschlägt.
 */
export async function fetchAllUsers() {
    return fetchWithAuth('/api/admin/users');
}

/**
 * Sendet eine Anfrage zum Löschen eines Benutzers an das Backend.
 * @param {string} userId - Die ID des zu löschenden Benutzers.
 * @returns {Promise<object>} - Das Ergebnis der Anfrage.
 */
export async function deleteUser(userId) {
    return fetchWithAuth(`/api/admin/users/${userId}`, { method: 'DELETE' });
}

/**
 * Sendet eine Anfrage zum Genehmigen eines Benutzers an das Backend.
 * @param {string} userId - Die ID des zu genehmigenden Benutzers.
 * @returns {Promise<object>} - Das Ergebnis der Anfrage.
 */
export async function approveUser(userId) {
    return fetchWithAuth(`/api/admin/users/${userId}/approve`, { method: 'PUT' });
}

/**
 * Sendet eine Anfrage zum Aktualisieren von Benutzerdaten an das Backend.
 * @param {string} userId - Die ID des zu aktualisierenden Benutzers.
 * @param {object} userData - Die neuen Benutzerdaten.
 * @returns {Promise<object>} - Das Ergebnis der Anfrage.
 */
export async function updateUser(userId, userData) {
    return fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
}

export async function getCustomFields() {
    return fetchWithAuth('/api/admin/custom-fields');
}

export async function updateCustomFields(fields) {
    return fetchWithAuth('/api/admin/custom-fields', {
        method: 'PUT',
        body: JSON.stringify(fields),
    });
}

// --- Notifications API ---

/**
 * Ruft alle Benachrichtigungen vom Backend ab.
 * @returns {Promise<Array>} Eine Liste aller Benachrichtigungen.
 */
export async function getAllNotifications() {
    return fetchWithAuth('/api/notifications');
}

/**
 * Erstellt eine neue Benachrichtigung.
 * @param {object} notificationData - Die Daten der neuen Benachrichtigung.
 * @returns {Promise<object>} Die erstellte Benachrichtigung.
 */
export async function createNotification(notificationData) {
    return fetchWithAuth('/api/notifications', {
        method: 'POST',
        body: JSON.stringify(notificationData),
    });
}

/**
 * Aktualisiert eine bestehende Benachrichtigung.
 * @param {string} notificationId - Die ID der zu aktualisierenden Benachrichtigung.
 * @param {object} notificationData - Die neuen Daten.
 * @returns {Promise<object>} Die aktualisierte Benachrichtigung.
 */
export async function updateNotification(notificationId, notificationData) {
    return fetchWithAuth(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        body: JSON.stringify(notificationData),
    });
}

/**
 * Löscht eine Benachrichtigung.
 * @param {string} notificationId - Die ID der zu löschenden Benachrichtigung.
 * @returns {Promise<object>} Ein leeres Objekt bei Erfolg.
 */
export async function deleteNotification(notificationId) {
    return fetchWithAuth(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
    });
}

// --- Module Management API ---

/**
 * Ruft die Konfiguration aller Module ab.
 * @returns {Promise<Array>} Eine Liste aller Modul-Konfigurationsobjekte.
 */
export async function getModules() {
    return fetchWithAuth('/api/admin/modules');
}

/**
 * Aktualisiert die Konfiguration aller Module.
 * @param {Array<object>} modulesData - Die vollständige, neue Konfiguration.
 * @returns {Promise<object>} Die Erfolgsmeldung vom Server.
 */
export async function updateModules(modulesData) {
    return fetchWithAuth('/api/admin/modules', {
        method: 'PUT',
        body: JSON.stringify(modulesData),
    });
}

/**
 * Ruft alle verfügbaren Benutzerrollen ab.
 * @returns {Promise<Array<string>>} Eine Liste aller Rollen-Strings.
 */
export async function getRoles() {
    return fetchWithAuth('/api/admin/roles');
}