const express = require('express');
const router = express.Router();
const personaController = require('../controllers/personaController');

router.post('/login', personaController.login);
router.post('/save-data', personaController.savePersona);
router.post('/registrar-medico', personaController.registrarMedico);
router.post('/asignar-medico', personaController.asignarMedico);
router.get('/medicos-disponibles', personaController.getMedicosDisponibles);
router.post('/registrar-disponibilidad', personaController.registrarDisponibilidad);
router.get('/disponibilidad', personaController.getDisponibilidad);
router.post('/agendar-cita', personaController.agendarCita);
router.get('/datos', personaController.getDatos);
router.post('/historial', personaController.registrarHistorial);
router.get('/', personaController.getPersonas);
router.put('/update', personaController.updatePersona);
router.get('/obtener-por-id', personaController.obtenerPorId);
router.get('/obtener-pacientes-asignados', personaController.obtenerPacientesAsignados);
router.get('/obtener-por-correo', personaController.obtenerPorCorreo);
router.get('/citas', personaController.obtenerCitas);
router.post('/eliminar-disponibilidad', personaController.eliminarDisponibilidad);
router.post('/actualizar-disponibilidad', personaController.actualizarDisponibilidad);
router.post('/otorgar-permiso', personaController.otorgarPermisoHistorial); // Nueva ruta

module.exports = router;