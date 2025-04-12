const Alarma = require('../models/Alarma');
const Persona = require('../models/Persona');
const notificacionController = require('./notificacionController');

exports.registrarAlarma = async (req, res) => {
  const { correo, ...alarmaData } = req.body;
  try {
    const paciente = await Persona.findOne({ correo });
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }
    const alarma = new Alarma({
      persona_paciente_id: paciente._id,
      persona_medico_id: paciente.medico_asignado,
      ...alarmaData,
    });
    await alarma.save();

    // Enviar notificación al paciente
    await notificacionController.crearYEnviarNotificacion(
      paciente._id,
      'Alarma',
      `Recordatorio: ${alarma.mensaje} a las ${alarma.hora}`,
      'Push'
    );

    res.status(201).json({ success: true, alarma });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
//este codigo se llama alarmaController.js