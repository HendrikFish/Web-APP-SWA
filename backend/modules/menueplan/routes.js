const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');

const { getMenueplan } = require('./controller/getMenueplan');
const { saveMenueplan } = require('./controller/saveMenueplan');
const getMenueplanForEinrichtung = require('./controller/getMenueplanForEinrichtung');
const updateEinrichtungsSnapshot = require('./controller/updateEinrichtungsSnapshot');

// @route   GET api/menueplan?einrichtung=ID&year=YYYY&week=WW
// @desc    Holt den Menüplan für eine spezifische Einrichtung und Woche (Menü-Portal)
// @access  Private
router.get('/', protect, getMenueplanForEinrichtung);

// @route   GET api/menueplan/:year/:week
// @desc    Holt den Menüplan für eine spezifische Woche (Menüplan-Editor)
// @access  Private
router.get('/:year/:week', protect, getMenueplan);

// @route   POST api/menueplan/:year/:week
// @desc    Speichert den Menüplan für eine spezifische Woche
// @access  Private
router.post('/:year/:week', protect, saveMenueplan);

// @route   PUT api/menueplan/:year/:week/snapshot
// @desc    Aktualisiert den Einrichtungs-Snapshot eines bestehenden Menüplans
// @access  Private
router.put('/:year/:week/snapshot', protect, updateEinrichtungsSnapshot);

module.exports = router; 