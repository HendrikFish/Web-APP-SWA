const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User.js');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Suchen des Tokens im Authorization-Header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Token aus dem Header extrahieren ('Bearer TOKEN')
            token = req.headers.authorization.split(' ')[1];

            // Token verifizieren
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Benutzer-ID aus dem Token nehmen, den Benutzer in der DB finden (ohne Passwort)
            // und an das Request-Objekt anhängen für die weitere Verwendung
            req.user = await User.findById(decoded.id).select('-password');

            next(); // Weiter zur nächsten Middleware/Controller
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Nicht autorisiert, Token fehlgeschlagen');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Nicht autorisiert, kein Token');
    }
});

// Neue Admin-Middleware
const admin = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'co-admin')) {
        next();
    } else {
        res.status(403); // 403 Forbidden ist passender als 401 Unauthorized
        throw new Error('Nicht als Administrator autorisiert.');
    }
};

module.exports = { protect, admin }; 