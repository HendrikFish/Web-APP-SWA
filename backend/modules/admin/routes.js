const express = require('express');
const router = express.Router();
const { protect, admin } = require('../../middleware/authMiddleware');

// Controller aus den neuen, organisierten Verzeichnissen importieren
const getAllUsers = require('./controller/user-management/getAllUsers.js');
const deleteUser = require('./controller/user-management/deleteUser.js');
const approveUser = require('./controller/user-management/approveUser.js');
const updateUser = require('./controller/user-management/updateUser.js');

const getCustomFields = require('./controller/field-config/getCustomFields.js');
const updateCustomFields = require('./controller/field-config/updateCustomFields.js');

const getModules = require('./controller/module-management/getModules.js');
const updateModules = require('./controller/module-management/updateModules.js');
const getRoles = require('./controller/module-management/getRoles.js');

// Routen für Benutzerverwaltung
router.route('/users').get(protect, admin, getAllUsers);
router.route('/users/:id').delete(protect, admin, deleteUser).put(protect, admin, updateUser);
router.route('/users/:id/approve').put(protect, admin, approveUser);

// Routen für die Konfiguration der Registrierungsfelder
router.route('/custom-fields').get(protect, admin, getCustomFields).put(protect, admin, updateCustomFields);

// Modul- und Rollenverwaltung
router.route('/modules').get(protect, admin, getModules).put(protect, admin, updateModules);
router.route('/roles').get(protect, admin, getRoles);

module.exports = router;