const express = require('express');
const router = express.Router();
const citaController = require('../controllers/citaController');

router.post('/agendar-cita', citaController.agendarCita);
router.get('/citas', citaController.getCitas);
router.post('/cancelar-cita', citaController.cancelarCita);

module.exports = router;