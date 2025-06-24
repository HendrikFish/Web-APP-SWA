const express = require('express');

const getZutatenController = require('./controller/getZutaten.js');
const getZutatenStammdatenController = require('./controller/getZutatenStammdaten.js');
const getVorschlaegeController = require('./controller/getVorschlaege.js');
const createZutatController = require('./controller/createZutat.js');
const updateZutatController = require('./controller/updateZutat.js');
const deleteZutatController = require('./controller/deleteZutat.js');
const exportZutatenController = require('./controller/exportZutaten.js');
const importZutatenController = require('./controller/importZutaten.js');

const router = express.Router();

// Hilfsfunktion, um den Handler zu extrahieren, egal wie er exportiert wurde
const getHandler = (controller) => {
    if (typeof controller === 'function') {
        return controller;
    }
    // Nimmt den ersten Key aus dem exportierten Objekt
    return controller[Object.keys(controller)[0]];
};

// GET-Routen
router.get('/', getHandler(getZutatenController));
router.get('/stammdaten', getHandler(getZutatenStammdatenController));
router.get('/vorschlaege', getHandler(getVorschlaegeController));
router.get('/export', getHandler(exportZutatenController));

// POST-Routen
router.post('/', getHandler(createZutatController));
router.post('/import', getHandler(importZutatenController));

// PUT-Routen
router.put('/:id', getHandler(updateZutatController));

// DELETE-Routen
router.delete('/:id', getHandler(deleteZutatController));

module.exports = router;