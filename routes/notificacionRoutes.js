const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');

// Definimos la ruta como '/' porque el prefijo '/api/notificaciones' se añade en index.js
router.get('/', notificacionController.obtenerNotificaciones);

module.exports = router;