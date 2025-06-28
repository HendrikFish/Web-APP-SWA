const express = require('express');
const router = express.Router();

// Controller importieren
const { getBestellungen } = require('./controller/getBestellungen');
const { saveBestellungen } = require('./controller/saveBestellungen');

// Middleware
const { protect } = require('../../middleware/authMiddleware');

/**
 * @route GET /api/bestellungen/:year/:week
 * @desc Bestellungen für eine spezifische Kalenderwoche laden
 * @access Private (angemeldete Benutzer)
 */
router.get('/:year/:week', protect, getBestellungen);

/**
 * @route POST /api/bestellungen/:year/:week
 * @desc Bestellungen für eine spezifische Kalenderwoche speichern
 * @access Private (angemeldete Benutzer)
 */
router.post('/:year/:week', protect, saveBestellungen);

module.exports = router; 