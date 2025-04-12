const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensajeController');

router.get('/obtener', mensajeController.getMensajes); // Cambiamos a /obtener y usamos query params
router.post('/enviar', mensajeController.enviarMensaje);

module.exports = router;

//este codigo se llama mensajeRoutes.js