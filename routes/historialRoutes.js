const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');

router.get('/obtener-por-correo', historialController.obtenerPorCorreo);
router.post('/guardar-entrada', historialController.guardarEntrada);
router.put('/actualizar-entrada', historialController.actualizarEntrada);

module.exports = router;