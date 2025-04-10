const Persona = require('../models/Persona');
const HistorialMedico = require('../models/HistorialMedico');
const Cita = require('../models/Cita');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  const { correo, contrasena } = req.body;
  try {
    const persona = await Persona.findOne({ correo });
    if (!persona || !await bcrypt.compare(contrasena, persona.contraseña)) {
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
    res.json({ success: true, tipoUsuario: persona.rol.toLowerCase(), medicoAsignado: persona.medico_asignado?.toString() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.savePersona = async (req, res) => {
  const { nombre_completo, correo, contrasena, telefono, rol } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const persona = new Persona({
      rol: rol || 'Paciente',
      nombre_completo,
      correo,
      telefono,
      contraseña: hashedPassword,
    });
    await persona.save();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.registrarMedico = async (req, res) => {
  const { nombre_completo, correo, contrasena, telefono, especialidad } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const persona = new Persona({
      rol: 'Médico',
      nombre_completo,
      correo,
      telefono,
      contraseña: hashedPassword,
      especialidad,
    });
    await persona.save();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.asignarMedico = async (req, res) => {
  const { pacienteCorreo, medicoCorreo } = req.body;
  try {
    const paciente = await Persona.findOne({ correo: pacienteCorreo });
    const medico = await Persona.findOne({ correo: medicoCorreo });
    if (!paciente || !medico) return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    if (medico.rol !== 'Médico') return res.status(400).json({ success: false, error: 'El usuario seleccionado no es un médico' });
    paciente.medico_asignado = medico._id;
    medico.pacientes_asignados.push(paciente._id);
    await paciente.save();
    await medico.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMedicosDisponibles = async (req, res) => {
  try {
    const medicos = await Persona.find({ rol: 'Médico' });
    res.json({ success: true, medicos });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.registrarDisponibilidad = async (req, res) => {
  const { correo, dia, horario } = req.body;
  try {
    const medico = await Persona.findOne({ correo });
    if (!medico) return res.status(404).json({ success: false, error: 'Médico no encontrado' });
    if (medico.rol !== 'Médico') return res.status(400).json({ success: false, error: 'El usuario no es un médico' });

    // Separar hora_inicio y hora_fin del horario (formato: "HH:MM - HH:MM")
    const [horaInicio, horaFin] = horario.split(' - ').map(h => h.trim());
    
    // Añadir la disponibilidad al médico
    medico.disponibilidad.push({
      dia,
      horarios: [{ inicio: horaInicio, fin: horaFin }]
    });
    await medico.save();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getDisponibilidad = async (req, res) => {
  try {
    // Buscar todos los médicos con disponibilidad
    const medicos = await Persona.find(
      { rol: 'Médico', disponibilidad: { $ne: [] } },
      { nombre_completo: 1, correo: 1, especialidad: 1, disponibilidad: 1, _id: 1 }
    );

    // Formatear la respuesta para que sea más fácil de usar en el frontend
    const disponibilidad = medicos.map(medico => ({
      id: medico._id.toString(),
      nombre: medico.nombre_completo,
      correo: medico.correo,
      especialidad: medico.especialidad || 'No especificada',
      disponibilidad: medico.disponibilidad.map(disp => ({
        dia: disp.dia,
        horario: disp.horarios.map(h => `${h.inicio} - ${h.fin}`)[0] // Tomamos el primer horario
      }))
    }));

    res.status(200).json(disponibilidad);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.agendarCita = async (req, res) => {
  const { pacienteCorreo, medicoCorreo, dia, horario } = req.body;
  try {
    // Buscar el paciente y el médico por correo
    const paciente = await Persona.findOne({ correo: pacienteCorreo });
    const medico = await Persona.findOne({ correo: medicoCorreo });
    if (!paciente || !medico) {
      return res.status(404).json({ success: false, error: 'Paciente o médico no encontrado' });
    }

    // Separar hora_inicio y hora_fin del horario
    const [horaInicio, horaFin] = horario.split(' - ').map(h => h.trim());

    // Verificar que la disponibilidad aún exista
    const disponibilidad = medico.disponibilidad.find(
      disp => disp.dia === dia && disp.horarios.some(h => h.inicio === horaInicio && h.fin === horaFin)
    );
    if (!disponibilidad) {
      return res.status(400).json({ success: false, error: 'Horario no disponible' });
    }

    // Verificar si ya existe una cita en ese horario para el médico
    const citaExistente = await Cita.findOne({
      persona_medico_id: medico._id,
      fecha: new Date(dia),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
    });
    if (citaExistente) {
      return res.status(400).json({ success: false, error: 'El médico ya tiene una cita en ese horario' });
    }

    // Eliminar la disponibilidad usada
    medico.disponibilidad = medico.disponibilidad.map(disp => {
      if (disp.dia === dia) {
        disp.horarios = disp.horarios.filter(h => h.inicio !== horaInicio || h.fin !== horaFin);
      }
      return disp;
    }).filter(disp => disp.horarios.length > 0); // Eliminar días sin horarios
    await medico.save();

    // Guardar la cita
    const cita = new Cita({
      persona_paciente_id: paciente._id,
      persona_medico_id: medico._id,
      fecha: new Date(dia),
      hora_inicio: horaInicio,
      hora_fin: horaFin,
      estado: 'Programada',
      creada_en: new Date(),
      ultima_actualizacion: new Date(),
    });
    await cita.save();

    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDatos = async (req, res) => {
  const { correo } = req.query;
  try {
    const persona = await Persona.findOne({ correo });
    const historial = await HistorialMedico.findOne({ persona_paciente_id: persona._id });
    res.json([{ ...persona.toObject(), historial_medico: historial || {} }]);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.registrarHistorial = async (req, res) => {
  const { correo, historial } = req.body;
  try {
    const paciente = await Persona.findOne({ correo });
    let historialMedico = await HistorialMedico.findOne({ persona_paciente_id: paciente._id });
    if (!historialMedico) {
      historialMedico = new HistorialMedico({ persona_paciente_id: paciente._id, persona_medico_id: paciente.medico_asignado });
    }
    historialMedico = Object.assign(historialMedico, historial);
    await historialMedico.save();
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getPersonas = async (req, res) => {
  const { rol } = req.query;
  try {
    const personas = await Persona.find({ rol });
    res.json(personas);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updatePersona = async (req, res) => {
  const { correo, ...updates } = req.body;
  try {
    const persona = await Persona.findOneAndUpdate({ correo }, updates, { new: true });
    res.json({ success: true, persona });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.obtenerPorId = async (req, res) => {
  const { id } = req.query;
  try {
    const persona = await Persona.findById(id);
    if (!persona) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, persona });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.obtenerPacientesAsignados = async (req, res) => {
  const { medicoId } = req.query;
  try {
    const pacientes = await Persona.find({ medico_asignado: medicoId });
    res.json({ success: true, pacientes });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.obtenerPorCorreo = async (req, res) => {
  const { correo } = req.query;
  try {
    const persona = await Persona.findOne({ correo });
    if (!persona) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }
    res.json({ success: true, persona });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.obtenerCitas = async (req, res) => {
  const { correo, tipoUsuario } = req.query;
  try {
    // Buscar al usuario por correo
    const persona = await Persona.findOne({ correo });
    if (!persona) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    let citas;
    if (tipoUsuario === 'paciente') {
      citas = await Cita.find({ persona_paciente_id: persona._id })
        .populate('persona_paciente_id')
        .populate('persona_medico_id');
    } else if (tipoUsuario === 'medico') {
      citas = await Cita.find({ persona_medico_id: persona._id })
        .populate('persona_paciente_id')
        .populate('persona_medico_id');
    } else {
      return res.status(400).json({ success: false, message: 'Tipo de usuario no válido' });
    }

    // Si no hay citas, devolver una lista vacía
    if (!citas || citas.length === 0) {
      return res.json({ success: true, citas: [] });
    }

    // Formatear las citas para incluir los datos poblados
    const citasFormateadas = citas.map(cita => ({
      _id: cita._id,
      fecha: cita.fecha.toISOString().split('T')[0], // Formato yyyy-MM-dd
      hora_inicio: cita.hora_inicio,
      hora_fin: cita.hora_fin,
      persona_paciente_id: {
        _id: cita.persona_paciente_id._id,
        nombre_completo: cita.persona_paciente_id.nombre_completo,
      },
      persona_medico_id: {
        _id: cita.persona_medico_id._id,
        nombre_completo: cita.persona_medico_id.nombre_completo,
      },
    }));

    res.json({ success: true, citas: citasFormateadas });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};