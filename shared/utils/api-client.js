/**
 * Einheitlicher API-Client für alle Module
 * Löst Backend/Frontend-Inkonsistenzen und bietet einheitliche Fehlerbehandlung
 */

import { showToast } from '@shared/components/toast-notification/toast-notification.js';

/**
 * Standard-Konfiguration für API-Aufrufe
 */
const DEFAULT_CONFIG = {
    timeout: 15000, // 15 Sekunden Timeout für bessere Stabilität
    retries: 3,     // 3 Wiederholungsversuche
    retryDelay: 1000 // 1 Sekunde Verzögerung zwischen Versuchen
};

/**
 * Globaler API-Client mit einheitlicher Fehlerbehandlung
 */
class ApiClient {
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.baseURL = this.detectBaseURL();
        
        // Request-Interceptor für Authentifizierung
        this.token = this.getAuthToken();
    }

    /**
     * Erkennt automatisch die richtige Base-URL für Backend-Calls
     */
    detectBaseURL() {
        // In Development: Vite-Proxy verwendet
        if (import.meta.env.DEV) {
            return ''; // Vite-Proxy leitet /api weiter
        }
        
        // In Production: Direkter Backend-Zugriff
        return window.location.origin.replace(':5173', ':3000');
    }

    /**
     * Holt das Authentifizierungs-Token
     */
    getAuthToken() {
        return localStorage.getItem('token') || sessionStorage.getItem('token');
    }

    /**
     * Erstellt Standard-Headers für alle Requests
     */
    getHeaders(customHeaders = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...customHeaders
        };

        // Auth-Token hinzufügen falls vorhanden
        if (this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        return headers;
    }

    /**
     * Führt einen HTTP-Request mit Retry-Logic aus
     */
    async makeRequest(url, options = {}, attempt = 1) {
        const fullUrl = url.startsWith('/') ? `${this.baseURL}${url}` : url;
        
        const requestOptions = {
            headers: this.getHeaders(options.headers),
            timeout: this.config.timeout,
            ...options
        };

        try {
            console.log(`📡 API-Request: ${options.method || 'GET'} ${fullUrl}`);
            
            // Timeout-Controller für Anfrage
            const controller = new AbortController();
            let isCompleted = false;
            
            const timeoutId = setTimeout(() => {
                if (!isCompleted) {
                    controller.abort('Request timeout');
                }
            }, this.config.timeout);
            
            const response = await fetch(fullUrl, {
                ...requestOptions,
                signal: controller.signal
            });

            isCompleted = true;
            clearTimeout(timeoutId);

            // Response verarbeiten
            return await this.handleResponse(response, url, options, attempt);

        } catch (error) {
            return await this.handleError(error, url, options, attempt);
        }
    }

    /**
     * Behandelt HTTP-Responses einheitlich
     */
    async handleResponse(response, url, options, attempt) {
        // Erfolgreiche Antworten
        if (response.ok) {
            console.log(`✅ API-Success: ${response.status} ${url}`);
            
            // Leere Antworten behandeln
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            } else {
                return { success: true, data: await response.text() };
            }
        }

        // HTTP-Fehler behandeln
        throw new HttpError(response.status, await this.getErrorMessage(response), response);
    }

    /**
     * Extrahiert Fehlermeldungen aus Response
     */
    async getErrorMessage(response) {
        try {
            const errorData = await response.json();
            return errorData.message || errorData.error || `HTTP ${response.status}`;
        } catch {
            return `HTTP ${response.status} - ${response.statusText}`;
        }
    }

    /**
     * Behandelt Fehler mit Retry-Logic
     */
    async handleError(error, url, options, attempt) {
        console.error(`❌ API-Error (Versuch ${attempt}): ${url}`, error);

        // Spezielle Fehlerbehandlung
        if (error.name === 'AbortError') {
            const timeoutMessage = error.reason === 'Request timeout' 
                ? 'Anfrage-Timeout erreicht'
                : 'Anfrage wurde abgebrochen';
            throw new ApiError('REQUEST_TIMEOUT', timeoutMessage, error);
        }

        if (error instanceof HttpError) {
            // HTTP-Fehler (401, 403, 404, 500, etc.)
            this.handleHttpError(error);
            throw error;
        }

        // Netzwerk-Fehler → Retry-Logic (aber nicht bei Timeout-Fehlern)
        if (attempt < this.config.retries && this.shouldRetry(error) && error.name !== 'AbortError') {
            console.log(`🔄 Wiederhole Request in ${this.config.retryDelay}ms...`);
            await this.delay(this.config.retryDelay);
            return this.makeRequest(url, options, attempt + 1);
        }

        // Keine weiteren Versuche → Finaler Fehler
        throw new ApiError('NETWORK_ERROR', 'Netzwerk-Fehler nach mehreren Versuchen', error);
    }

    /**
     * Bestimmt ob ein Request wiederholt werden soll
     */
    shouldRetry(error) {
        // Keine Retries bei Auth-Fehlern oder Client-Fehlern
        if (error instanceof HttpError) {
            return error.status >= 500; // Nur Server-Fehler wiederholen
        }
        
        return true; // Netzwerk-Fehler immer wiederholen
    }

    /**
     * Behandelt HTTP-spezifische Fehler
     */
    handleHttpError(error) {
        switch (error.status) {
            case 401:
                this.handleAuthError();
                break;
            case 403:
                showToast('Keine Berechtigung für diese Aktion', 'error');
                break;
            case 404:
                showToast('Ressource nicht gefunden', 'warning');
                break;
            case 500:
                showToast('Serverfehler - Bitte versuchen Sie es später erneut', 'error');
                break;
            default:
                showToast(`Fehler: ${error.message}`, 'error');
        }
    }

    /**
     * Behandelt Authentifizierungs-Fehler
     */
    handleAuthError() {
        console.warn('🔑 Authentifizierung fehlgeschlagen - leite zur Login-Seite weiter');
        
        // Token entfernen
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        
        // Zur Login-Seite weiterleiten
        if (!window.location.pathname.includes('/login/')) {
            window.location.href = '/frontend/core/login/';
        }
    }

    /**
     * Utility: Verzögerung für Retry-Logic
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // === HTTP-Methoden ===

    async get(url, config = {}) {
        return this.makeRequest(url, { method: 'GET', ...config });
    }

    async post(url, data, config = {}) {
        return this.makeRequest(url, {
            method: 'POST',
            body: JSON.stringify(data),
            ...config
        });
    }

    async put(url, data, config = {}) {
        return this.makeRequest(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...config
        });
    }

    async delete(url, config = {}) {
        return this.makeRequest(url, { method: 'DELETE', ...config });
    }

    async patch(url, data, config = {}) {
        return this.makeRequest(url, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...config
        });
    }
}

/**
 * Custom Error-Klassen für bessere Fehlerbehandlung
 */
export class ApiError extends Error {
    constructor(code, message, originalError = null) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

export class HttpError extends Error {
    constructor(status, message, response = null) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.response = response;
        this.timestamp = new Date().toISOString();
    }
}

// Globaler API-Client (Singleton)
export const apiClient = new ApiClient();

/**
 * Convenience-Wrapper für häufige API-Pattern
 */
export const api = {
    // Standard CRUD-Operationen
    get: (url, config) => apiClient.get(url, config),
    post: (url, data, config) => apiClient.post(url, data, config),
    put: (url, data, config) => apiClient.put(url, data, config),
    delete: (url, config) => apiClient.delete(url, config),
    patch: (url, data, config) => apiClient.patch(url, data, config),

    // Spezielle Wrapper für JSON-Dateien
    async loadJsonData(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error(`Fehler beim Laden von ${path}:`, error);
            throw new ApiError('JSON_LOAD_ERROR', `Konnte ${path} nicht laden`, error);
        }
    },

    // Batch-Requests für Parallelisierung
    async batch(requests) {
        try {
            const results = await Promise.allSettled(requests);
            
            return results.map((result, index) => {
                if (result.status === 'fulfilled') {
                    return { success: true, data: result.value, index };
                } else {
                    console.error(`Batch-Request ${index} fehlgeschlagen:`, result.reason);
                    return { success: false, error: result.reason, index };
                }
            });
        } catch (error) {
            throw new ApiError('BATCH_ERROR', 'Batch-Request fehlgeschlagen', error);
        }
    }
};

// Default export für einfache Verwendung
export default api; 