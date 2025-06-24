const express = require('express');
const router = express.Router();

// Controller importieren
const loginUser = require('./controller/loginUser');
const registerUser = require('./controller/registerUser');
const getUnreadNotifications = require('./controller/getUnreadNotifications');
const markNotificationAsRead = require('./controller/markNotificationAsRead');

// Middleware
const { protect } = require('../../middleware/authMiddleware');

// Routen
router.post('/login', loginUser);
router.post('/register', registerUser);

// Benachrichtigungs-Routen für den eingeloggten User
router.get('/notifications', protect, getUnreadNotifications);
router.post('/notifications/read', protect, markNotificationAsRead);

module.exports = router; 