const express = require('express');
const router = express.Router();

// Importiert alle Controller-Funktionen aus der zentralen index.js
const {
    getEinrichtungStammdaten,
    createEinrichtung,
    getEinrichtungen,
    getEinrichtung,
    updateEinrichtung,
    deleteEinrichtung
} = require('./controller');

// Definition der API-Routen für Einrichtungen
router.get('/stammdaten', getEinrichtungStammdaten);
router.post('/', createEinrichtung);
router.get('/', getEinrichtungen);
router.get('/:id', getEinrichtung);
router.put('/:id', updateEinrichtung);
router.delete('/:id', deleteEinrichtung);

module.exports = router; 