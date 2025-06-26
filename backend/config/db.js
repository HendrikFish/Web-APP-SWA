const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('🔍 Verbinde mit MongoDB Atlas...');
        console.log('🔑 MONGODB_URI:', process.env.MONGODB_URI ? 'gesetzt' : 'NICHT GESETZT');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000, // 10 Sekunden timeout
            bufferCommands: true, // Erlaube Buffering für bessere Entwicklererfahrung
        });

        console.log(`✅ MongoDB erfolgreich verbunden: ${conn.connection.host}`);
        console.log(`📊 Datenbank: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Fehler bei der MongoDB-Verbindung: ${error.message}`);
        console.log('💡 Tipp: Überprüfe deine IP-Whitelist in MongoDB Atlas!');
        console.log('💡 Link: https://www.mongodb.com/docs/atlas/security-whitelist/');
        process.exit(1);
    }
};

module.exports = connectDB; 