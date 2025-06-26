const express = require('express');
const router = express.Router();

// Controller importieren
const { createBewertung } = require('./controller/createBewertung');
const { getBewertungen } = require('./controller/getBewertungen');
const { getAuswertung } = require('./controller/getAuswertung');
const { deleteBewertung } = require('./controller/deleteBewertung');

// Middleware
const { protect } = require('../../middleware/authMiddleware');

/**
 * @route POST /api/bewertungen
 * @desc Neue Bewertung erstellen
 * @access Private (angemeldete Benutzer)
 */
router.post('/', protect, createBewertung);

/**
 * @route GET /api/bewertungen/auswertung/:year/:week
 * @desc Auswertung und Statistiken für eine KW
 * @access Private (nur Admin/Küchenpersonal)
 */
router.get('/auswertung/:year/:week', protect, getAuswertung);

/**
 * @route GET /api/bewertungen/:year/:week
 * @desc Bewertungen für eine bestimmte KW abrufen
 * @access Private
 */
router.get('/:year/:week', protect, getBewertungen);

/**
 * @route DELETE /api/bewertungen/:bewertungId
 * @desc Bewertung löschen (nur eigene Bewertungen)
 * @access Private
 */
router.delete('/:bewertungId', protect, deleteBewertung);

/**
 * @route GET /api/bewertungen/zeitfenster
 * @desc Verfügbare Bewertungs-Zeitfenster (letzte 10 Tage)
 * @access Private
 */
router.get('/zeitfenster', protect, (req, res) => {
    try {
        const heute = new Date();
        const zehnTageZurueck = new Date();
        zehnTageZurueck.setDate(heute.getDate() - 10);

        const zeitfenster = {
            von: zehnTageZurueck.toISOString().split('T')[0],
            bis: heute.toISOString().split('T')[0],
            beschreibung: 'Bewertungen sind für die letzten 10 Tage bis heute möglich'
        };

        res.json({
            success: true,
            zeitfenster
        });
    } catch (error) {
        console.error('Fehler beim Abrufen des Zeitfensters:', error);
        res.status(500).json({
            success: false,
            message: 'Serverfehler beim Abrufen des Zeitfensters'
        });
    }
});

module.exports = router; 