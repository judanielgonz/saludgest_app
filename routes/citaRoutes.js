const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

router.post('/agendar-cita', citaController.agendarCita);
router.get('/citas', citaController.getCitas);

module.exports = router;

//este codigo se llama citaRoutes.js