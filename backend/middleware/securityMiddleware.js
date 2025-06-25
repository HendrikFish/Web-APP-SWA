/**
 * Erweiterte Sicherheits-Middleware für SmartWorkArt Backend
 * Implementiert Best Practices für Production-Sicherheit
 */

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');

/**
 * Security Headers Middleware
 * Implementiert wichtige HTTP-Security-Headers
 */
const securityHeaders = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"],
                fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
            },
        },
        crossOriginEmbedderPolicy: false, // Für Cross-Origin-Requests
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    });
};

/**
 * Rate Limiting für API-Endpunkte
 */
const createApiRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = null) => {
    return rateLimit({
        windowMs,
        max,
        message: message || {
            success: false,
            error: 'Zu viele Anfragen von dieser IP-Adresse',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) => {
            console.log(`🚨 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
            res.status(429).json({
                success: false,
                error: 'Zu viele Anfragen - Bitte versuchen Sie es später erneut',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
    });
};

/**
 * Aggressive Rate Limiting für Login-Endpunkt
 */
const loginRateLimit = createApiRateLimit(
    15 * 60 * 1000, // 15 Minuten
    5, // Nur 5 Login-Versuche
    'Zu viele Login-Versuche von dieser IP-Adresse'
);

/**
 * Rate Limiting für Registrierung
 */
const registerRateLimit = createApiRateLimit(
    60 * 60 * 1000, // 1 Stunde
    3, // Nur 3 Registrierungen pro Stunde
    'Zu viele Registrierungsversuche von dieser IP-Adresse'
);

/**
 * Slow Down Middleware - macht Requests langsamer bei vielen Anfragen
 */
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 Minuten
    delayAfter: 50, // Nach 50 Requests pro Window
    delayMs: 500, // Verzögerung um 500ms pro Request
    maxDelayMs: 20000, // Maximale Verzögerung 20 Sekunden
});

/**
 * Input Sanitization Middleware
 */
const sanitizeInput = (req, res, next) => {
    // XSS-Protection: Entferne gefährliche Zeichen
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        return str
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Script-Tags entfernen
            .replace(/javascript:/gi, '') // JavaScript-URLs entfernen
            .replace(/on\w+\s*=/gi, ''); // Event-Handler entfernen
    };

    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (typeof obj[key] === 'string') {
                    sanitized[key] = sanitizeString(obj[key]);
                } else if (typeof obj[key] === 'object') {
                    sanitized[key] = sanitizeObject(obj[key]);
                } else {
                    sanitized[key] = obj[key];
                }
            }
        }
        
        return sanitized;
    };

    // Sanitize request body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }

    next();
};

/**
 * IP-Whitelist für Admin-Funktionen (optional)
 */
const adminIPWhitelist = (allowedIPs = []) => {
    return (req, res, next) => {
        if (allowedIPs.length === 0) {
            return next(); // Keine Whitelist konfiguriert
        }

        const clientIP = req.ip || req.connection.remoteAddress;
        
        if (!allowedIPs.includes(clientIP)) {
            console.log(`🚨 Admin-Zugriff von nicht-whitelisted IP verweigert: ${clientIP}`);
            return res.status(403).json({
                success: false,
                error: 'Zugriff von dieser IP-Adresse nicht erlaubt'
            });
        }

        next();
    };
};

/**
 * Request-Logging für Security-Monitoring
 */
const securityLogger = (req, res, next) => {
    const logData = {
        timestamp: new Date().toISOString(),
        ip: req.ip,
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        referer: req.get('Referer')
    };

    // Sensitive Endpoints loggen
    const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/user/'];
    const isSensitive = sensitiveEndpoints.some(endpoint => req.url.includes(endpoint));

    if (isSensitive) {
        console.log('🔒 Security Log:', JSON.stringify(logData));
    }

    next();
};

/**
 * Passwort-Stärke-Validierung
 */
const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Passwort muss mindestens ${minLength} Zeichen lang sein`);
    }
    if (!hasUpperCase) {
        errors.push('Passwort muss mindestens einen Großbuchstaben enthalten');
    }
    if (!hasLowerCase) {
        errors.push('Passwort muss mindestens einen Kleinbuchstaben enthalten');
    }
    if (!hasNumbers) {
        errors.push('Passwort muss mindestens eine Zahl enthalten');
    }
    if (!hasSpecialChar) {
        errors.push('Passwort muss mindestens ein Sonderzeichen enthalten');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Middleware für Passwort-Validierung
 */
const passwordValidation = (req, res, next) => {
    if (req.body.password) {
        const validation = validatePasswordStrength(req.body.password);
        
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Passwort erfüllt nicht die Sicherheitsanforderungen',
                details: validation.errors
            });
        }
    }
    
    next();
};

module.exports = {
    securityHeaders,
    createApiRateLimit,
    loginRateLimit,
    registerRateLimit,
    speedLimiter,
    sanitizeInput,
    adminIPWhitelist,
    securityLogger,
    validatePasswordStrength,
    passwordValidation
}; 