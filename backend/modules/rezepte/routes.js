const express = require('express');
const { protect } = require('../../middleware/authMiddleware.js');
const { getRezeptStammdaten } = require('./controller/getRezeptStammdaten.js');
const { getRezepte } = require('./controller/getRezepte.js');
const { createRezept } = require('./controller/createRezept.js');
const { updateRezept } = require('./controller/updateRezept.js');
const { deleteRezept } = require('./controller/deleteRezept.js');

const router = express.Router();

// Route zum Abrufen der Stammdaten (Kategorien etc.)
router.get('/stammdaten', getRezeptStammdaten);

// Standard-Routen für die Rezept-Verwaltung
router.get('/', getRezepte);
router.post('/', protect, createRezept);
router.put('/:id', protect, updateRezept);
router.delete('/:id', protect, deleteRezept);

module.exports = router; 