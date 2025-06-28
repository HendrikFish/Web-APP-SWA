const path = require('path');
const dotenv = require('dotenv');

// Lade .env-Datei. Muss ganz am Anfang stehen.
dotenv.config({ path: path.resolve(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Stelle die Verbindung zur Datenbank her
connectDB();

// --- Initialisierung der Express-App ---
const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

// --- Globale Middleware ---
app.use(cors()); // Erlaubt Cross-Origin-Anfragen (wichtig für die Kommunikation mit dem Frontend)
app.use(express.json()); // Ermöglicht das Parsen von JSON im Request-Body
app.use(express.urlencoded({ extended: true })); // Ermöglicht das Parsen von URL-kodierten Daten

// --- Statische Routen (falls benötigt) ---
// Beispiel: app.use('/public', express.static('public'));

// --- API-Routen ---
// Hier werden die Module nach Core und Features getrennt eingebunden.

// --- Core-Module ---
const authRoutes = require('./modules/auth/routes.js');
const userRoutes = require('./modules/user/routes.js');
const adminRoutes = require('./modules/admin/routes.js');

// Middleware, um die Modul-Routen zu registrieren
// Kerngeschäftslogik (immer zuerst geladen)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// --- Feature-Module (Platzhalter) ---
// const zutatenRoutes = require('./modules/zutaten/routes');
// app.use('/api/zutaten', zutatenRoutes);

// === Feature-Module ===
const notificationRoutes = require('./modules/notifications/routes');
const zutatenRoutes = require('./modules/zutaten/routes');
const rezeptRoutes = require('./modules/rezepte/routes');
const einrichtungRoutes = require('./modules/einrichtung/routes');
const menueplanRoutes = require('./modules/menueplan/routes');
const portalRoutes = require('./modules/portal/routes');
const bewertungenRoutes = require('./modules/bewertungen/routes');
const bestellungenRoutes = require('./modules/bestellungen/routes');
const informationenRoutes = require('./modules/informationen/routes');

// Feature-Module (werden nach dem Kern geladen)
app.use('/api/notifications', notificationRoutes);
app.use('/api/user', userRoutes);
app.use('/api/zutaten', zutatenRoutes);
app.use('/api/rezepte', rezeptRoutes);
app.use('/api/einrichtungen', einrichtungRoutes);
app.use('/api/menueplan', menueplanRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/bewertungen', bewertungenRoutes);
app.use('/api/bestellungen', bestellungenRoutes);
app.use('/api/informationen', informationenRoutes);

// --- Health-Check-Route für wait-on ---
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// --- Fehlerbehandlung (Einfacher 404-Handler) ---
app.use((req, res) => {
    res.status(404).json({ message: 'Endpunkt nicht gefunden.' });
});

// --- Serverstart ---
app.listen(PORT, () => {
    console.log(`Backend-Server läuft auf http://localhost:${PORT}`);
}); 