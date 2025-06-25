/**
 * Globale Error-Middleware für Backend
 * Verhindert Server-Abstürze und bietet einheitliche Fehlerbehandlung
 */

/**
 * Globaler Error-Handler für Express
 * Fängt alle unbehandelten Fehler ab und verhindert Server-Abstürze
 */
const errorHandler = (err, req, res, next) => {
    console.error('🚨 Backend-Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });

    // Default-Fehlerinfo
    let error = { ...err };
    error.message = err.message;

    // Spezifische Fehlerbehandlung
    if (err.name === 'CastError') {
        const message = 'Ungültige ID-Format';
        error = { message, status: 400 };
    }

    if (err.code === 11000) {
        const message = 'Duplikat-Eintrag bereits vorhanden';
        error = { message, status: 400 };
    }

    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = { message, status: 400 };
    }

    if (err.name === 'JsonWebTokenError') {
        const message = 'Ungültiges Token';
        error = { message, status: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Token abgelaufen';
        error = { message, status: 401 };
    }

    // Response senden
    res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Server-Fehler',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

/**
 * Middleware für 404-Fehler (nicht gefundene Routen)
 */
const notFound = (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} nicht gefunden`);
    res.status(404);
    next(error);
};

/**
 * Async-Handler Wrapper für Route-Handler
 * Eliminiert try/catch-Blöcke in Controllern
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Validierungs-Middleware für Request-Daten
 */
const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        try {
            const { error } = schema.validate(req[property]);
            if (error) {
                return res.status(400).json({
                    success: false,
                    error: 'Validierungs-Fehler',
                    details: error.details.map(d => d.message)
                });
            }
            next();
        } catch (err) {
            next(err);
        }
    };
};

/**
 * Rate-Limiting Middleware für API-Endpunkte
 */
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Aufräumen alter Einträge
        if (requests.has(key)) {
            const userRequests = requests.get(key).filter(time => time > windowStart);
            requests.set(key, userRequests);
        }
        
        const userRequests = requests.get(key) || [];
        
        if (userRequests.length >= max) {
            return res.status(429).json({
                success: false,
                error: 'Zu viele Anfragen - Bitte versuchen Sie es später erneut',
                retryAfter: Math.ceil(windowMs / 1000)
            });
        }
        
        userRequests.push(now);
        requests.set(key, userRequests);
        next();
    };
};

/**
 * Graceful Shutdown Handler
 */
const setupGracefulShutdown = (server) => {
    process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM erhalten - Starte graceful shutdown...');
        server.close(() => {
            console.log('✅ Server erfolgreich heruntergefahren');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('🛑 SIGINT erhalten - Starte graceful shutdown...');
        server.close(() => {
            console.log('✅ Server erfolgreich heruntergefahren');
            process.exit(0);
        });
    });

    // Unbehandelte Promise-Rejections abfangen
    process.on('unhandledRejection', (err, promise) => {
        console.error('🚨 Unbehandelte Promise-Rejection:', err);
        // Server nicht herunterfahren, nur loggen
    });

    // Unbehandelte Exceptions abfangen
    process.on('uncaughtException', (err) => {
        console.error('🚨 Unbehandelte Exception:', err);
        // Server nicht herunterfahren, nur loggen
    });
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    validateRequest,
    createRateLimit,
    setupGracefulShutdown
}; 