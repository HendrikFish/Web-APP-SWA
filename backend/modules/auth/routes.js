const express = require('express');
const router = express.Router();

// Controller importieren
const loginUser = require('./controller/loginUser');
const registerUser = require('./controller/registerUser');
const getUnreadNotifications = require('./controller/getUnreadNotifications');
const markNotificationAsRead = require('./controller/markNotificationAsRead');

// Middleware
const { protect } = require('../../middleware/authMiddleware');
const { asyncHandler } = require('../../middleware/errorMiddleware');

// Routen - ohne asyncHandler da Controller selbst alle Exceptions abfangen
router.post('/login', loginUser);
router.post('/register', registerUser);

// Benachrichtigungs-Routen für den eingeloggten User
router.get('/notifications', protect, asyncHandler(getUnreadNotifications));
router.post('/notifications/read', protect, asyncHandler(markNotificationAsRead));

module.exports = router; 