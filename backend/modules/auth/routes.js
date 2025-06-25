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

// Routen
router.post('/login', asyncHandler(loginUser));
router.post('/register', asyncHandler(registerUser));

// Benachrichtigungs-Routen für den eingeloggten User
router.get('/notifications', protect, asyncHandler(getUnreadNotifications));
router.post('/notifications/read', protect, asyncHandler(markNotificationAsRead));

module.exports = router; 