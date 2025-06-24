const express = require('express');
const router = express.Router();

// Controller importieren
const getAllNotifications = require('./controller/getAllNotifications');
const createNotification = require('./controller/createNotification');
const updateNotification = require('./controller/updateNotification');
const deleteNotification = require('./controller/deleteNotification');

// ToDo: Middleware für Authentifizierung und Admin-Prüfung hinzufügen
// const { protect, admin } = require('../../middleware/authMiddleware');

// Routen definieren
// Später: router.route('/').get(protect, admin, getAllNotifications).post(protect, admin, createNotification);
router.route('/')
    .get(getAllNotifications)
    .post(createNotification);

// Später: router.route('/:id').put(protect, admin, updateNotification).delete(protect, admin, deleteNotification);
router.route('/:id')
    .put(updateNotification)
    .delete(deleteNotification);

module.exports = router; 