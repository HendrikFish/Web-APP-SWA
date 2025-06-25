/**
 * Professionelles Logging-System für SmartWorkArt
 * Ersetzt console.log mit strukturierten, konfigurierbaren Logs
 */

const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.logDir = path.join(__dirname, '../logs');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.maxFiles = 5;
        
        this.levels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3
        };

        this.colors = {
            error: '\x1b[31m', // Rot
            warn: '\x1b[33m',  // Gelb
            info: '\x1b[36m',  // Cyan
            debug: '\x1b[35m', // Magenta
            reset: '\x1b[0m'
        };

        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.logLevel];
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const pid = process.pid;
        
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            pid,
            message,
            ...meta
        };

        // Console-Output (mit Farben in Development)
        const colorizedLevel = process.env.NODE_ENV === 'development' 
            ? `${this.colors[level]}${level.toUpperCase()}${this.colors.reset}`
            : level.toUpperCase();

        const consoleMessage = `[${timestamp}] ${colorizedLevel}: ${message}`;
        
        return {
            logEntry,
            consoleMessage
        };
    }

    writeToFile(level, logEntry) {
        const logFile = path.join(this.logDir, `${level}.log`);
        const logLine = JSON.stringify(logEntry) + '\n';
        
        try {
            // Überprüfe Dateigröße und rotiere wenn nötig
            if (fs.existsSync(logFile)) {
                const stats = fs.statSync(logFile);
                if (stats.size > this.maxFileSize) {
                    this.rotateLogFile(logFile);
                }
            }
            
            fs.appendFileSync(logFile, logLine, 'utf8');
        } catch (error) {
            console.error('Fehler beim Schreiben der Log-Datei:', error);
        }
    }

    rotateLogFile(logFile) {
        const ext = path.extname(logFile);
        const basename = path.basename(logFile, ext);
        const dir = path.dirname(logFile);

        // Verschiebe bestehende Dateien
        for (let i = this.maxFiles - 1; i > 0; i--) {
            const oldFile = path.join(dir, `${basename}.${i}${ext}`);
            const newFile = path.join(dir, `${basename}.${i + 1}${ext}`);
            
            if (fs.existsSync(oldFile)) {
                if (i === this.maxFiles - 1) {
                    fs.unlinkSync(oldFile); // Lösche älteste Datei
                } else {
                    fs.renameSync(oldFile, newFile);
                }
            }
        }

        // Verschiebe aktuelle Datei
        const rotatedFile = path.join(dir, `${basename}.1${ext}`);
        fs.renameSync(logFile, rotatedFile);
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const { logEntry, consoleMessage } = this.formatMessage(level, message, meta);
        
        // Console-Output
        console.log(consoleMessage);
        
        // In Datei schreiben (nur in Production oder wenn explizit aktiviert)
        if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
            this.writeToFile(level, logEntry);
            
            // Auch in combined.log schreiben
            this.writeToFile('combined', logEntry);
        }
    }

    error(message, meta = {}) {
        this.log('error', message, meta);
    }

    warn(message, meta = {}) {
        this.log('warn', message, meta);
    }

    info(message, meta = {}) {
        this.log('info', message, meta);
    }

    debug(message, meta = {}) {
        this.log('debug', message, meta);
    }

    // Spezielle Methoden für verschiedene Log-Typen
    
    security(message, meta = {}) {
        this.error(message, { 
            type: 'SECURITY',
            ...meta 
        });
    }

    api(req, res, responseTime) {
        const logData = {
            type: 'API',
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        if (res.statusCode >= 500) {
            this.error(`API Error: ${req.method} ${req.originalUrl}`, logData);
        } else if (res.statusCode >= 400) {
            this.warn(`API Warning: ${req.method} ${req.originalUrl}`, logData);
        } else {
            this.info(`API: ${req.method} ${req.originalUrl}`, logData);
        }
    }

    database(operation, collection, meta = {}) {
        this.debug(`Database: ${operation} on ${collection}`, {
            type: 'DATABASE',
            operation,
            collection,
            ...meta
        });
    }

    auth(action, user, meta = {}) {
        this.info(`Auth: ${action}`, {
            type: 'AUTH',
            action,
            userId: user?.id || 'unknown',
            email: user?.email || 'unknown',
            ...meta
        });
    }

    performance(operation, duration, meta = {}) {
        const level = duration > 1000 ? 'warn' : 'info';
        this.log(level, `Performance: ${operation} took ${duration}ms`, {
            type: 'PERFORMANCE',
            operation,
            duration,
            ...meta
        });
    }
}

// Singleton-Instanz
const logger = new Logger();

/**
 * Express-Middleware für API-Logging
 */
const apiLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Response abfangen um Response-Time zu messen
    const originalSend = res.send;
    res.send = function(data) {
        const responseTime = Date.now() - startTime;
        logger.api(req, res, responseTime);
        originalSend.call(this, data);
    };
    
    next();
};

/**
 * Middleware für unbehandelte Fehler
 */
const errorLogger = (err, req, res, next) => {
    logger.error('Unbehandelter Fehler', {
        type: 'UNHANDLED_ERROR',
        error: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip
    });
    
    next(err);
};

module.exports = {
    logger,
    apiLogger,
    errorLogger
}; 