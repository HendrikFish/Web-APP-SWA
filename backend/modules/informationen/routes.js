const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');

// Controller importieren
const getInformationen = require('./controller/getInformationen');
const createInformation = require('./controller/createInformation');
const updateInformation = require('./controller/updateInformation');
const deleteInformation = require('./controller/deleteInformation');
const markAsRead = require('./controller/markAsRead');

/**
 * @route GET /api/informationen
 * @desc Informationen für eine Kalenderwoche abrufen
 * @access Private
 */
router.get('/', protect, getInformationen);

/**
 * @route POST /api/informationen
 * @desc Neue Information erstellen
 * @access Private
 */
router.post('/', protect, createInformation);

/**
 * @route PUT /api/informationen/:informationId
 * @desc Information bearbeiten
 * @access Private
 */
router.put('/:informationId', protect, updateInformation);

/**
 * @route DELETE /api/informationen/:informationId
 * @desc Information löschen (Soft Delete)
 * @access Private
 */
router.delete('/:informationId', protect, deleteInformation);

/**
 * @route PATCH /api/informationen/:informationId/read
 * @desc Information als gelesen markieren
 * @access Private
 */
router.patch('/:informationId/read', protect, markAsRead);

module.exports = router; 