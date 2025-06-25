const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

const connectDB = async () => {
    // Mache es robuster: Akzeptiere MONGODB_URI (üblich bei Atlas) oder MONGO_URI
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

    // Sicherheitsprüfung: Wenn kein Connection String gefunden wird, den Serverstart verhindern.
    if (!MONGO_URI) {
        logger.error('FATAL-ERROR: Weder MONGODB_URI noch MONGO_URI ist in der .env-Datei definiert.');
        process.exit(1);
    }

    try {
        // Erweiterte Mongoose-Konfiguration für Production
        const conn = await mongoose.connect(MONGO_URI, {
            // Connection Pool Settings
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            bufferCommands: false, // Disable mongoose buffering
            
            // Retry Logic
            retryWrites: true,
            retryReads: true,
            
            // Heartbeat
            heartbeatFrequencyMS: 10000,
            
            // Compression
            compressors: ['zlib'],
            zlibCompressionLevel: 6
        });

        logger.info(`MongoDB erfolgreich verbunden: ${conn.connection.host}`, {
            type: 'DATABASE',
            host: conn.connection.host,
            database: conn.connection.name,
            readyState: conn.connection.readyState
        });

        // Event-Listener für Verbindungsstatus
        setupConnectionEventListeners();

    } catch (error) {
        logger.error(`Fehler bei der MongoDB-Verbindung: ${error.message}`, {
            type: 'DATABASE',
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
};

/**
 * Setup Event-Listener für MongoDB-Verbindung
 */
const setupConnectionEventListeners = () => {
    mongoose.connection.on('connected', () => {
        logger.info('Mongoose verbunden mit MongoDB', { type: 'DATABASE' });
    });

    mongoose.connection.on('error', (err) => {
        logger.error(`Mongoose Verbindungsfehler: ${err}`, { 
            type: 'DATABASE',
            error: err.message 
        });
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('Mongoose von MongoDB getrennt', { type: 'DATABASE' });
    });

    // Graceful close on app termination
    process.on('SIGINT', async () => {
        try {
            await mongoose.connection.close();
            logger.info('MongoDB-Verbindung durch App-Beendigung geschlossen', { type: 'DATABASE' });
            process.exit(0);
        } catch (err) {
            logger.error(`Fehler beim Schließen der MongoDB-Verbindung: ${err}`, { type: 'DATABASE' });
            process.exit(1);
        }
    });
};

module.exports = connectDB; 