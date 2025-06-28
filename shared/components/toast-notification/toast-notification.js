/**
 * Toast-Notification Komponente
 * Zeigt Bootstrap-basierte Toast-Nachrichten für Benutzer-Feedback an
 */

// Importiere CSS für die Toast-Komponente
import './toast-notification.css';

// Statischer Import von Bootstrap Toast
import { Toast } from 'bootstrap';

/**
 * Zeigt eine Toast-Nachricht an
 * @param {string} message - Die anzuzeigende Nachricht
 * @param {string} type - Der Toast-Typ: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Anzeigedauer in Millisekunden (default: 4000)
 */
export function showToast(message, type = 'info', duration = 4000) {
    // Stelle sicher, dass der Toast-Container existiert
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '10500';
        document.body.appendChild(toastContainer);
    }

    // Bestimme Icon und Farbe basierend auf dem Typ
    const typeConfig = {
        success: { 
            icon: 'bi-check-circle-fill', 
            bgClass: 'bg-success',
            textClass: 'text-white'
        },
        error: { 
            icon: 'bi-x-circle-fill', 
            bgClass: 'bg-danger',
            textClass: 'text-white'
        },
        warning: { 
            icon: 'bi-exclamation-triangle-fill', 
            bgClass: 'bg-warning',
            textClass: 'text-dark'
        },
        info: { 
            icon: 'bi-info-circle-fill', 
            bgClass: 'bg-info',
            textClass: 'text-white'
        }
    };

    const config = typeConfig[type] || typeConfig.info;
    const toastId = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Erstelle das Toast-Element
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${config.bgClass} ${config.textClass} border-0`;
    toastElement.id = toastId;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    toastElement.setAttribute('data-bs-autohide', duration > 0 ? 'true' : 'false');
    if (duration > 0) {
        toastElement.setAttribute('data-bs-delay', duration.toString());
    }

    toastElement.innerHTML = `
        <div class="d-flex">
            <div class="toast-body d-flex align-items-center">
                <i class="bi ${config.icon} me-2"></i>
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                    data-bs-dismiss="toast" aria-label="Schließen"></button>
        </div>
    `;

    // Toast zum Container hinzufügen
    toastContainer.appendChild(toastElement);

    // Bootstrap Toast initialisieren und anzeigen
    try {
        const bsToast = new Toast(toastElement);
        bsToast.show();

        // Event-Listener für das Entfernen aus dem DOM nach dem Ausblenden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    } catch (error) {
        console.error('Fehler beim Initialisieren des Toast:', error);
        // Fallback: Entferne Toast nach der angegebenen Zeit
        setTimeout(() => {
            toastElement.remove();
        }, duration);
    }

    return toastId;
}

/**
 * Entfernt einen spezifischen Toast vorzeitig
 * @param {string} toastId - Die ID des zu entfernenden Toast
 */
export function hideToast(toastId) {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
        try {
            const bsToast = Toast.getInstance(toastElement);
            if (bsToast) {
                bsToast.hide();
            }
        } catch (error) {
            // Fallback: Einfach das Element entfernen
            toastElement.remove();
        }
    }
}

/**
 * Entfernt alle aktuell angezeigten Toasts
 */
export function clearAllToasts() {
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
        const toasts = toastContainer.querySelectorAll('.toast');
        toasts.forEach(toast => {
            try {
                const bsToast = Toast.getInstance(toast);
                if (bsToast) {
                    bsToast.hide();
                }
            } catch (error) {
                toast.remove();
            }
        });
    }
} 