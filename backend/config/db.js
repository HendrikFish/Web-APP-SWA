const mongoose = require('mongoose');

const connectDB = async () => {
    // Mache es robuster: Akzeptiere MONGODB_URI (üblich bei Atlas) oder MONGO_URI
    const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

    // Sicherheitsprüfung: Wenn kein Connection String gefunden wird, den Serverstart verhindern.
    if (!MONGO_URI) {
        console.error('FATAL-ERROR: Weder MONGODB_URI noch MONGO_URI ist in der .env-Datei definiert.');
        // Prozess mit Fehler beenden
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(MONGO_URI, {
            // Mongoose 6 verwendet diese Optionen standardmäßig, daher sind sie nicht mehr notwendig,
            // aber es schadet nicht, sie für die Kompatibilität drin zu lassen.
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB verbunden: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Fehler bei der MongoDB-Verbindung: ${error.message}`);
        // Prozess mit Fehler beenden
        process.exit(1);
    }
};

module.exports = connectDB; 