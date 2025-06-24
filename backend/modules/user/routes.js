const express = require('express');
const router = express.Router();

const getCurrentUser = require('./controller/getCurrentUser');

// Später wird hier eine Middleware zur Authentifizierung (JWT-Prüfung) eingefügt.
// z.B. router.get('/current', authMiddleware, getCurrentUser);

router.get('/current', getCurrentUser);

module.exports = router; 