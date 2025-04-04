const Mensaje = require('../models/Mensaje');
const Persona = require('../models/Persona');

exports.getMensajes = async (req, res) => {
  const { pacienteId, medicoId } = req.query; // Cambiamos a query params para obtener mensajes entre dos usuarios específicos
  try {
    // Buscar el documento de mensajes entre el paciente y el médico
    const mensaje = await Mensaje.findOne({
      persona_paciente_id: pacienteId,
      persona_medico_id: medicoId,
    });

    if (!mensaje) {
      return res.json({ success: true, mensajes: [] }); // Si no hay mensajes, devolver un arreglo vacío
    }

    res.json({ success: true, mensajes: mensaje.hilo });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.enviarMensaje = async (req, res) => {
  const { emisorId, receptorId, contenido } = req.body; // Cambiamos los parámetros para usar emisorId y receptorId
  try {
    // Obtener el emisor y el receptor
    const emisor = await Persona.findById(emisorId);
    const receptor = await Persona.findById(receptorId);

    if (!emisor || !receptor) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Determinar quién es el paciente y quién es el médico
    let paciente, medico;
    if (emisor.rol === 'Paciente' && receptor.rol === 'Médico') {
      paciente = emisor;
      medico = receptor;
    } else if (emisor.rol === 'Médico' && receptor.rol === 'Paciente') {
      paciente = receptor;
      medico = emisor;
    } else {
      return res.status(403).json({ success: false, message: 'El chat solo es permitido entre un paciente y un médico' });
    }

    // Validar que el médico sea el asignado al paciente
    if (paciente.medico_asignado?.toString() !== medico._id.toString()) {
      return res.status(403).json({ success: false, message: 'El médico no está asignado a este paciente' });
    }

    // Buscar o crear el documento de mensajes entre el paciente y el médico
    let mensaje = await Mensaje.findOne({
      persona_paciente_id: paciente._id,
      persona_medico_id: medico._id,
    });

    if (!mensaje) {
      mensaje = new Mensaje({
        persona_paciente_id: paciente._id,
        persona_medico_id: medico._id,
        hilo: [],
      });
    }

    // Añadir el mensaje al hilo
    mensaje.hilo.push({
      emisor: emisor._id.toString(), // Guardamos el ID del emisor
      contenido,
      fecha: new Date(),
      leido: false,
    });

    mensaje.ultima_actualizacion = new Date();
    await mensaje.save();

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};