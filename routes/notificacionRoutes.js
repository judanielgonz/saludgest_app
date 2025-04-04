const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');

router.get('/', notificacionController.getNotificaciones);

module.exports = router;