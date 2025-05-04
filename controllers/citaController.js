const Cita = require('../models/Cita');
const Persona = require('../models/Persona');

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

exports.cancelarCita = async (req, res) => {
  const { citaId, usuarioCorreo, tipoUsuario } = req.body;
  try {
    if (!citaId || !usuarioCorreo || !tipoUsuario) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos (citaId, usuarioCorreo, tipoUsuario)' });
    }

    const cita = await Cita.findById(citaId);
    if (!cita) {
      return res.status(404).json({ success: false, message: 'Cita no encontrada' });
    }

    const paciente = await Persona.findById(cita.persona_paciente_id);
    const medico = await Persona.findById(cita.persona_medico_id);

    if (!paciente || !medico) {
      return res.status(404).json({ success: false, message: 'Paciente o médico no encontrado' });
    }

    if (tipoUsuario === 'paciente' && paciente.correo !== usuarioCorreo) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta cita' });
    }
    if (tipoUsuario === 'medico' && medico.correo !== usuarioCorreo) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para cancelar esta cita' });
    }

    await Cita.deleteOne({ _id: citaId });

    res.status(200).json({ success: true, message: 'Cita cancelada con éxito' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};