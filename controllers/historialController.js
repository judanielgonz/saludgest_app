const HistorialMedico = require('../models/HistorialMedico');
const Persona = require('../models/Persona');

exports.obtenerPorCorreo = async (req, res) => {
  const { correo } = req.query;
  try {
    const persona = await Persona.findOne({ correo });
    if (!persona) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const historial = await HistorialMedico.find({ persona_paciente_id: persona._id })
      .populate('persona_paciente_id')
      .populate('persona_medico_id')
      .populate('sintomas.registrado_por')
      .populate('diagnosticos.registrado_por')
      .populate('tratamientos.registrado_por')
      .populate('medicamentos.registrado_por')
      .populate('resultados_analisis.registrado_por');

    res.json({ success: true, historial });
  } catch (error) {
    console.error('Error en obtenerPorCorreo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.guardarEntrada = async (req, res) => {
  const { correo, tipo, datos } = req.body;
  const pacienteCorreo = datos.pacienteCorreo; // Correo del paciente cuyo historial se modifica
  try {
    if (!correo || !tipo || !datos || !pacienteCorreo) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }

    // Buscar al usuario que registra la entrada (puede ser médico o paciente)
    const registrador = await Persona.findOne({ correo });
    if (!registrador) {
      return res.status(404).json({ success: false, message: 'Usuario registrador no encontrado' });
    }

    // Buscar al paciente cuyo historial se modificará
    const paciente = await Persona.findOne({ correo: pacienteCorreo });
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    let historial = await HistorialMedico.findOne({ persona_paciente_id: paciente._id });
    if (!historial) {
      if (!paciente.medico_asignado) {
        return res.status(400).json({ success: false, message: 'El paciente no tiene un médico asignado' });
      }
      historial = new HistorialMedico({
        persona_paciente_id: paciente._id,
        persona_medico_id: paciente.medico_asignado,
      });
    }

    const entrada = {
      fecha: new Date(),
      registrado_por: registrador._id,
      ...datos,
    };

    switch (tipo) {
      case 'sintomas':
        if (!datos.descripcion) {
          return res.status(400).json({ success: false, message: 'La descripción del síntoma es requerida' });
        }
        historial.sintomas.push(entrada);
        break;
      case 'diagnosticos':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar diagnósticos' });
        }
        if (!datos.descripcion) {
          return res.status(400).json({ success: false, message: 'La descripción del diagnóstico es requerida' });
        }
        historial.diagnosticos.push(entrada);
        break;
      case 'tratamientos':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar tratamientos' });
        }
        if (!datos.descripcion) {
          return res.status(400).json({ success: false, message: 'La descripción del tratamiento es requerida' });
        }
        historial.tratamientos.push(entrada);
        break;
      case 'medicamentos':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar medicamentos' });
        }
        if (!datos.nombre || !datos.dosis || !datos.frecuencia) {
          return res.status(400).json({ success: false, message: 'Nombre, dosis y frecuencia son requeridos para medicamentos' });
        }
        historial.medicamentos.push(entrada);
        break;
      case 'ordenes_analisis':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar órdenes de análisis' });
        }
        if (!datos.orden_id || !datos.tipo) {
          return res.status(400).json({ success: false, message: 'Orden ID y tipo son requeridos para órdenes de análisis' });
        }
        historial.ordenes_analisis.push(entrada);
        break;
      case 'resultados_analisis':
        if (!datos.orden_id || !datos.resultados) {
          return res.status(400).json({ success: false, message: 'Orden ID y resultados son requeridos para resultados de análisis' });
        }
        historial.resultados_analisis.push(entrada);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de entrada no válido' });
    }

    historial.ultima_actualizacion = new Date();
    await historial.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error en guardarEntrada:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.actualizarEntrada = async (req, res) => {
  const { historialId, tipo, entradaId, datos, correo } = req.body;
  try {
    const persona = await Persona.findOne({ correo });
    if (!persona) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const historial = await HistorialMedico.findById(historialId);
    if (!historial) {
      return res.status(404).json({ success: false, message: 'Historial no encontrado' });
    }

    let entrada;
    switch (tipo) {
      case 'sintomas':
        entrada = historial.sintomas.id(entradaId);
        break;
      case 'diagnosticos':
        entrada = historial.diagnosticos.id(entradaId);
        break;
      case 'tratamientos':
        entrada = historial.tratamientos.id(entradaId);
        break;
      case 'medicamentos':
        entrada = historial.medicamentos.id(entradaId);
        break;
      case 'ordenes_analisis':
        entrada = historial.ordenes_analisis.id(entradaId);
        break;
      case 'resultados_analisis':
        entrada = historial.resultados_analisis.id(entradaId);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de entrada no válido' });
    }

    if (!entrada) {
      return res.status(404).json({ success: false, message: 'Entrada no encontrada' });
    }

    if (entrada.registrado_por.toString() !== persona._id.toString()) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta entrada' });
    }

    Object.assign(entrada, datos);
    historial.ultima_actualizacion = new Date();
    await historial.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error en actualizarEntrada:', error);
    res.status(400).json({ success: false, error: error.message });
  }
};