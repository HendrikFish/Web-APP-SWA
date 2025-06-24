const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');

const { getMenueplan } = require('./controller/getMenueplan');
const { saveMenueplan } = require('./controller/saveMenueplan');

// @route   GET api/menueplan/:year/:week
// @desc    Holt den Menüplan für eine spezifische Woche
// @access  Private
router.get('/:year/:week', protect, getMenueplan);

// @route   POST api/menueplan/:year/:week
// @desc    Speichert den Menüplan für eine spezifische Woche
// @access  Private
router.post('/:year/:week', protect, saveMenueplan);

module.exports = router; 