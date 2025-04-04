const Cita = require('../models/Cita');
const Persona = require('../models/Persona');
const notificacionController = require('./notificacionController');

exports.agendarCita = async (req, res) => {
  const { pacienteCorreo, medicoCorreo, fecha, hora_inicio, hora_fin } = req.body;
  try {
    const paciente = await Persona.findOne({ correo: pacienteCorreo });
    const medico = await Persona.findOne({ correo: medicoCorreo });
    if (!paciente || !medico) {
      return res.status(404).json({ success: false, message: 'Paciente o médico no encontrado' });
    }
    const cita = new Cita({
      persona_paciente_id: paciente._id,
      persona_medico_id: medico._id,
      fecha,
      hora_inicio,
      hora_fin,
    });
    await cita.save();

    // Enviar notificación al paciente
    await notificacionController.crearYEnviarNotificacion(
      paciente._id,
      'Cita',
      `Tienes una cita programada con ${medico.nombre_completo} el ${fecha} de ${hora_inicio} a ${hora_fin}`,
      'Push'
    );

    // Enviar notificación al médico
    await notificacionController.crearYEnviarNotificacion(
      medico._id,
      'Cita',
      `Tienes una cita programada con ${paciente.nombre_completo} el ${fecha} de ${hora_inicio} a ${hora_fin}`,
      'Push'
    );

    res.status(201).json({ success: true, cita });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getCitas = async (req, res) => {
  try {
    const citas = await Cita.find().populate('persona_paciente_id persona_medico_id');
    res.json(citas);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};