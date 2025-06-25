const express = require('express');
const router = express.Router();

const { getPortalStammdaten } = require('./controller/getPortalStammdaten');

// Portal-Stammdaten Route
router.get('/stammdaten', getPortalStammdaten);

module.exports = router; 