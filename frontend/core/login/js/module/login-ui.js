import { Tab } from 'bootstrap';
import { loginUser } from './login-api.js';
import { registerUser } from './register-api.js';
import customFieldsConfig from '@shared/config/custom-fields.json';
import { renderDynamicFormFields, collectDynamicFieldValues } from '@shared/components/dynamic-form/form-builder.js';

/**
 * Zeigt eine Feedback-Nachricht im Login-Formular an.
 * @param {string} message - Die anzuzeigende Nachricht.
 */
function showLoginFeedback(message) {
    const loginFeedback = document.getElementById('login-feedback');
    if (!loginFeedback) return;
    loginFeedback.textContent = message;
    loginFeedback.focus();
}

/**
 * Verarbeitet die Einreichung des Login-Formulars.
 * @param {Event} event
 */
async function handleLoginFormSubmit(event) {
    event.preventDefault();
    const loginForm = event.target;
    const submitButton = document.getElementById('login-submit-btn');

    submitButton.disabled = true;
    showLoginFeedback('');

    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const result = await loginUser(email, password);
        if (result.token) {
            localStorage.setItem('token', result.token);
            window.location.href = '/core/dashboard/index.html';
        } else {
            showLoginFeedback('Ein unerwarteter Fehler ist aufgetreten.');
        }
    } catch (error) {
        showLoginFeedback(error.message);
    } finally {
        submitButton.disabled = false;
    }
}

/**
 * Führt einen schnellen Login für einen bestimmten Benutzertyp durch.
 * @param {string} email 
 * @param {string} password 
 */
async function handleDevLogin(email, password) {
    try {
        const result = await loginUser(email, password);
        localStorage.setItem('token', result.token);
        window.location.href = '/core/dashboard/index.html';
    } catch (error) {
        // Optional: Feedback für den Entwickler im Fehlerfall
        const feedbackElement = document.querySelector('#login-panel .feedback-message');
        if (feedbackElement) {
            feedbackElement.textContent = `Dev-Login fehlgeschlagen: ${error.message}`;
            feedbackElement.className = 'feedback-message mt-3 text-center text-danger';
        } else {
            console.error("Dev-Login fehlgeschlagen:", error);
        }
    }
}

function setupLoginForm(form) {
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Feedback-Element finden oder erstellen
        let feedbackElement = form.querySelector('.feedback-message');
        if (!feedbackElement) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'feedback-message mt-3 text-center';
            form.appendChild(feedbackElement);
        }

        submitButton.disabled = true;
        feedbackElement.textContent = '';
        
        const email = form.querySelector('#email').value;
        const password = form.querySelector('#password').value;

        try {
            const result = await loginUser(email, password);
            localStorage.setItem('token', result.token);
            window.location.href = '/core/dashboard/index.html';
        } catch (error) {
            feedbackElement.textContent = error.message;
            feedbackElement.className = 'feedback-message mt-3 text-center text-danger';
        } finally {
            submitButton.disabled = false;
        }
    });
}

// ... (ganzer oberer Teil der Datei bleibt gleich)

function setupRegisterForm(form) {
    if (!form) return;

    // Den korrekten, im HTML existierenden Container verwenden
    const dynamicFieldsContainer = document.getElementById('dynamic-fields-container');
    if (dynamicFieldsContainer) {
        // customFieldsConfig ist direkt das Array, das wir brauchen
        renderDynamicFormFields(dynamicFieldsContainer, customFieldsConfig);
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const registerForm = document.getElementById('register-form');
        const successMessage = document.getElementById('register-success-message');

        const firstName = form.querySelector('#register-firstname').value;
        const lastName = form.querySelector('#register-lastname').value;
        const email = form.querySelector('#register-email').value;
        const password = form.querySelector('#register-password').value;
        
        const customFields = collectDynamicFieldValues(dynamicFieldsContainer);

        try {
            await registerUser(firstName, lastName, email, password, customFields);
            
            // Bei Erfolg das Formular ausblenden und die Erfolgsmeldung anzeigen
            registerForm.classList.add('d-none');
            successMessage.classList.remove('d-none');

        } catch (error) {
            // Einfache Fehleranzeige
            alert(`Fehler bei der Registrierung: ${error.message}`);
        }
    });
}

// ... (Rest der Datei bleibt gleich)

/**
 * Initialisiert die UI-Events für die Login-Seite.
 */
export function initializeLoginUI() {
    const loginForm = document.getElementById('login-form');
    setupLoginForm(loginForm);

    const registerForm = document.getElementById('register-form');
    setupRegisterForm(registerForm);

    // Bootstrap-Tabs initialisieren
    const triggerTabList = [].slice.call(document.querySelectorAll('#auth-tabs button'));
    triggerTabList.forEach(function (triggerEl) {
        const tabTrigger = new Tab(triggerEl);
        triggerEl.addEventListener('click', function (event) {
            event.preventDefault();
            tabTrigger.show();
        });
    });

    // DEV LOGIN Buttons
    const devLoginAdminBtn = document.getElementById('dev-login-admin-btn');
    if (devLoginAdminBtn) {
        devLoginAdminBtn.addEventListener('click', () => {
            handleDevLogin('admin@seniorenheim.de', 'Admin123!');
        });
    }

    const devLoginUserBtn = document.getElementById('dev-login-user-btn');
    if (devLoginUserBtn) {
        devLoginUserBtn.addEventListener('click', () => {
            handleDevLogin('nehilanthe@gmail.com', '91LiKWlh@MxI');
        });
    }
} 