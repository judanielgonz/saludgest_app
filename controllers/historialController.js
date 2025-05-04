const HistorialMedico = require('../models/HistorialMedico');
const Persona = require('../models/Persona');
const Notificacion = require('../models/Notificacion');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Configuración del directorio de uploads
const uploadDir = path.join(__dirname, '../Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const obtenerPorCorreo = async (req, res) => {
  const { correo } = req.query;
  try {
    const persona = await Persona.findOne({ correo });
    if (!persona) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    if (persona.rol === 'Médico') {
      const historial = await HistorialMedico.find({ persona_paciente_id: { $ne: persona._id } })
        .populate('persona_paciente_id')
        .populate('persona_medico_id')
        .populate('sintomas.registrado_por')
        .populate('diagnosticos.registrado_por')
        .populate('tratamientos.registrado_por')
        .populate('medicamentos.registrado_por')
        .populate('resultados_analisis.registrado_por')
        .populate('documentos.registrado_por');

      const historialFiltrado = historial.filter(h => {
        const paciente = h.persona_paciente_id;
        return paciente.medico_asignado === persona._id.toString() || 
               paciente.medicos_con_permiso.includes(persona.correo);
      });

      res.json({ success: true, historial: historialFiltrado });
    } else {
      const historial = await HistorialMedico.find({ persona_paciente_id: persona._id })
        .populate('persona_paciente_id')
        .populate('persona_medico_id')
        .populate('sintomas.registrado_por')
        .populate('diagnosticos.registrado_por')
        .populate('tratamientos.registrado_por')
        .populate('medicamentos.registrado_por')
        .populate('resultados_analisis.registrado_por')
        .populate('documentos.registrado_por');

      res.json({ success: true, historial });
    }
  } catch (error) {
    console.error('Error en obtenerPorCorreo:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const guardarEntrada = async (req, res) => {
  const { correo, tipo, datos, pacienteCorreo } = req.body;

  try {
    if (!correo || !tipo || !pacienteCorreo) {
      return res.status(400).json({ success: false, message: 'Faltan datos requeridos' });
    }

    const registrador = await Persona.findOne({ correo });
    if (!registrador) {
      return res.status(404).json({ success: false, message: 'Usuario registrador no encontrado' });
    }

    const paciente = await Persona.findOne({ correo: pacienteCorreo });
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    let historial = await HistorialMedico.findOne({ persona_paciente_id: paciente._id });
    if (!historial) {
      historial = new HistorialMedico({
        persona_paciente_id: paciente._id,
        persona_medico_id: paciente.medico_asignado || null,
      });
    }

    const entrada = {
      fecha: new Date(),
      registrado_por: registrador._id,
      ...datos,
    };

    let notificacionMensaje = '';
    let notificacionTipo = '';

    switch (tipo) {
      case 'sintomas':
        if (registrador.rol !== 'Paciente' && registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo pacientes y médicos pueden registrar síntomas' });
        }
        if (!datos.descripcion) {
          return res.status(400).json({ success: false, message: 'La descripción del síntoma es requerida' });
        }
        historial.sintomas.push(entrada);
        notificacionTipo = 'Actualización de Historial';
        notificacionMensaje = `El paciente ${paciente.nombre_completo} ha añadido un síntoma en su historial: ${datos.descripcion}`;
        break;
      case 'diagnosticos':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar diagnósticos' });
        }
        if (!paciente.medico_asignado) {
          return res.status(400).json({ success: false, message: 'El paciente debe tener un médico asignado para registrar diagnósticos' });
        }
        if (!datos.descripcion) {
          return res.status(400).json({ success: false, message: 'La descripción del diagnóstico es requerida' });
        }
        if (datos.sintoma_id) {
          const sintomaExiste = historial.sintomas.some(s => s._id.toString() === datos.sintoma_id);
          if (!sintomaExiste) {
            return res.status(400).json({ success: false, message: 'El síntoma especificado no existe en el historial' });
          }
          entrada.sintomas_relacionados = [datos.sintoma_id];
        }
        if (datos.documento_id) {
          const documentoExiste = historial.documentos.some(d => d._id.toString() === datos.documento_id);
          if (!documentoExiste) {
            return res.status(400).json({ success: false, message: 'El documento especificado no existe en el historial' });
          }
          entrada.documento_relacionado = datos.documento_id;
        }
        historial.diagnosticos.push(entrada);
        notificacionTipo = 'Actualización de Historial';
        notificacionMensaje = `El paciente ${paciente.nombre_completo} ha añadido un diagnóstico en su historial: ${datos.descripcion}`;
        break;
      case 'tratamientos':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar tratamientos' });
        }
        if (!paciente.medico_asignado) {
          return res.status(400).json({ success: false, message: 'El paciente debe tener un médico asignado para registrar tratamientos' });
        }
        if (!datos.descripcion) {
          return res.status(400).json({ success: false, message: 'La descripción del tratamiento es requerida' });
        }
        if (datos.diagnostico_id) {
          const diagnosticoExiste = historial.diagnosticos.some(d => d._id.toString() === datos.diagnostico_id);
          if (!diagnosticoExiste) {
            return res.status(400).json({ success: false, message: 'El diagnóstico especificado no existe en el historial' });
          }
          entrada.diagnostico_relacionado = datos.diagnostico_id;
        }
        historial.tratamientos.push(entrada);
        notificacionTipo = 'Actualización de Historial';
        notificacionMensaje = `El paciente ${paciente.nombre_completo} ha añadido un tratamiento en su historial: ${datos.descripcion}`;
        break;
      case 'medicamentos':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar medicamentos' });
        }
        if (!paciente.medico_asignado) {
          return res.status(400).json({ success: false, message: 'El paciente debe tener un médico asignado para registrar medicamentos' });
        }
        if (!datos.nombre || !datos.dosis || !datos.frecuencia) {
          return res.status(400).json({ success: false, message: 'Nombre, dosis y frecuencia son requeridos para medicamentos' });
        }
        if (datos.tratamiento_id) {
          const tratamientoExiste = historial.tratamientos.some(t => t._id.toString() === datos.tratamiento_id);
          if (!tratamientoExiste) {
            return res.status(400).json({ success: false, message: 'El tratamiento especificado no existe en el historial' });
          }
          entrada.tratamiento_relacionado = datos.tratamiento_id;
        }
        historial.medicamentos.push(entrada);
        notificacionTipo = 'Actualización de Historial';
        notificacionMensaje = `El paciente ${paciente.nombre_completo} ha añadido un medicamento en su historial: ${datos.nombre}, Dosis: ${datos.dosis}, Frecuencia: ${datos.frecuencia}`;
        break;
      case 'ordenes_analisis':
        if (registrador.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden registrar órdenes de análisis' });
        }
        if (!paciente.medico_asignado) {
          return res.status(400).json({ success: false, message: 'El paciente debe tener un médico asignado para registrar órdenes de análisis' });
        }
        if (!datos.orden_id || !datos.tipo) {
          return res.status(400).json({ success: false, message: 'Orden ID y tipo son requeridos para órdenes de análisis' });
        }
        historial.ordenes_analisis.push(entrada);
        notificacionTipo = 'Actualización de Historial';
        notificacionMensaje = `El paciente ${paciente.nombre_completo} ha añadido una orden de análisis en su historial: ${datos.tipo} (ID: ${datos.orden_id})`;
        break;
      case 'resultados_analisis':
        if (!datos.orden_id || !datos.resultados) {
          return res.status(400).json({ success: false, message: 'Orden ID y resultados son requeridos para resultados de análisis' });
        }
        historial.resultados_analisis.push(entrada);
        notificacionTipo = 'Actualización de Historial';
        notificacionMensaje = `El paciente ${paciente.nombre_completo} ha añadido un resultado de análisis en su historial para la orden ID: ${datos.orden_id}`;
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de entrada no válido' });
    }

    // Notificación para el paciente
    if (notificacionTipo && notificacionMensaje) {
      const notificacion = new Notificacion({
        tipo: notificacionTipo,
        contenido: notificacionMensaje,
        destinatario: pacienteCorreo,
        estado: 'Entregada',
        fecha: new Date(),
        canal: 'app',
        persona_id: paciente._id,
        deletedBy: [],
      });
      await notificacion.save();
    }

    // Notificaciones para médicos asignados y con permiso si el registrador es paciente
    if (registrador.rol === 'Paciente' && (tipo === 'sintomas' || tipo === 'resultados_analisis')) {
      // Médico asignado
      if (paciente.medico_asignado) {
        const medicoAsignado = await Persona.findById(paciente.medico_asignado);
        if (medicoAsignado) {
          const notificacionMedico = new Notificacion({
            tipo: 'Actualización de Historial',
            contenido: `El paciente ${paciente.nombre_completo} ha añadido un ${tipo === 'sintomas' ? 'síntoma' : 'resultado de análisis'} en su historial: ${datos.descripcion || datos.resultados}`,
            destinatario: medicoAsignado.correo,
            estado: 'Entregada',
            fecha: new Date(),
            canal: 'app',
            persona_id: medicoAsignado._id,
            deletedBy: [],
          });
          await notificacionMedico.save();
        }
      }

      // Médicos con permiso
      if (paciente.medicos_con_permiso && paciente.medicos_con_permiso.length > 0) {
        const medicosConPermiso = await Persona.find({
          correo: { $in: paciente.medicos_con_permiso },
          rol: 'Médico',
        });
        for (const medico of medicosConPermiso) {
          // Evitar duplicar notificación si el médico con permiso es también el asignado
          if (paciente.medico_asignado && medico._id.toString() === paciente.medico_asignado.toString()) {
            continue;
          }
          const notificacionMedico = new Notificacion({
            tipo: 'Actualización de Historial',
            contenido: `El paciente ${paciente.nombre_completo} ha añadido un ${tipo === 'sintomas' ? 'síntoma' : 'resultado de análisis'} en su historial: ${datos.descripcion || datos.resultados}`,
            destinatario: medico.correo,
            estado: 'Entregada',
            fecha: new Date(),
            canal: 'app',
            persona_id: medico._id,
            deletedBy: [],
          });
          await notificacionMedico.save();
        }
      }
    }

    historial.ultima_actualizacion = new Date();
    await historial.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error en guardarEntrada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const subirResultadoAnalisis = async (req, res) => {
  const { correo, pacienteCorreo, orden_id } = req.body;
  const file = req.file;

  try {
    if (!correo || !pacienteCorreo || !orden_id || !file) {
      return res.status(400).json({ success: false, message: 'Faltan datos o archivo requeridos' });
    }

    const registrador = await Persona.findOne({ correo });
    if (!registrador) {
      return res.status(404).json({ success: false, message: 'Usuario registrador no encontrado' });
    }

    if (registrador.rol !== 'Paciente' && registrador.rol !== 'Médico') {
      return res.status(403).json({ success: false, message: 'Solo pacientes y médicos pueden subir resultados de análisis' });
    }

    const paciente = await Persona.findOne({ correo: pacienteCorreo });
    if (!paciente) {
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    let historial = await HistorialMedico.findOne({ persona_paciente_id: paciente._id });
    if (!historial) {
      return res.status(400).json({ success: false, message: 'El paciente no tiene historial médico' });
    }

    const orden = historial.ordenes_analisis.find(o => o.orden_id === orden_id);
    if (!orden) {
      return res.status(404).json({ success: false, message: 'Orden de análisis no encontrada' });
    }

    const documento = {
      nombre: file.originalname,
      ruta: file.path,
      tipo: 'resultado_analisis',
      fecha: new Date(),
      registrado_por: registrador._id,
    };
    historial.documentos.push(documento);

    const nuevoResultado = {
      fecha: new Date(),
      orden_id: orden_id,
      resultados: file.originalname,
      registrado_por: registrador._id,
    };
    historial.resultados_analisis.push(nuevoResultado);

    historial.ordenes_analisis = historial.ordenes_analisis.filter(o => o.orden_id !== orden_id);

    // Notificación para el paciente
    const notificacion = new Notificacion({
      tipo: 'Actualización de Historial',
      contenido: `El paciente ${paciente.nombre_completo} ha añadido un resultado de análisis en su historial para la orden ID: ${orden_id}`,
      destinatario: pacienteCorreo,
      estado: 'Entregada',
      fecha: new Date(),
      canal: 'app',
      persona_id: paciente._id,
      deletedBy: [],
    });
    await notificacion.save();

    // Notificaciones para médicos asignados y con permiso si el registrador es paciente
    if (registrador.rol === 'Paciente') {
      // Médico asignado
      if (paciente.medico_asignado) {
        const medicoAsignado = await Persona.findById(paciente.medico_asignado);
        if (medicoAsignado) {
          const notificacionMedico = new Notificacion({
            tipo: 'Actualización de Historial',
            contenido: `El paciente ${paciente.nombre_completo} ha subido un resultado de análisis en su historial para la orden ID: ${orden_id}`,
            destinatario: medicoAsignado.correo,
            estado: 'Entregada',
            fecha: new Date(),
            canal: 'app',
            persona_id: medicoAsignado._id,
            deletedBy: [],
          });
          await notificacionMedico.save();
        }
      }

      // Médicos con permiso
      if (paciente.medicos_con_permiso && paciente.medicos_con_permiso.length > 0) {
        const medicosConPermiso = await Persona.find({
          correo: { $in: paciente.medicos_con_permiso },
          rol: 'Médico',
        });
        for (const medico of medicosConPermiso) {
          // Evitar duplicar notificación si el médico con permiso es también el asignado
          if (paciente.medico_asignado && medico._id.toString() === paciente.medico_asignado.toString()) {
            continue;
          }
          const notificacionMedico = new Notificacion({
            tipo: 'Actualización de Historial',
            contenido: `El paciente ${paciente.nombre_completo} ha subido un resultado de análisis en su historial para la orden ID: ${orden_id}`,
            destinatario: medico.correo,
            estado: 'Entregada',
            fecha: new Date(),
            canal: 'app',
            persona_id: medico._id,
            deletedBy: [],
          });
          await notificacionMedico.save();
        }
      }
    }

    historial.ultima_actualizacion = new Date();
    await historial.save();

    res.json({ success: true, message: 'Resultado de análisis subido y orden eliminada con éxito', documento });
  } catch (error) {
    console.error('Error en subirResultadoAnalisis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const subirDocumento = async (req, res) => {
  const { correo, pacienteCorreo } = req.body;
  const file = req.file;

  try {
    if (!correo || !pacienteCorreo || !file) {
      return res.status(400).json({ success: false, message: 'Faltan datos o archivo requeridos' });
    }

    const registrador = await Persona.findOne({ correo });
    if (!registrador) {
      return res.status(404).json({ success: false, message: 'Usuario registrador no encontrado' });
    }

    if (registrador.rol !== 'Médico') {
      return res.status(403).json({ success: false, message: 'Solo los médicos pueden subir documentos' });
    }

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

    const documento = {
      nombre: file.originalname,
      ruta: file.path,
      tipo: 'otro',
      fecha: new Date(),
      registrado_por: registrador._id,
    };

    historial.documentos.push(documento);

    const notificacion = new Notificacion({
      tipo: 'Actualización de Historial',
      contenido: `El paciente ${paciente.nombre_completo} ha añadido un documento en su historial: ${file.originalname}`,
      destinatario: pacienteCorreo,
      estado: 'Entregada',
      fecha: new Date(),
      canal: 'app',
      persona_id: paciente._id,
      deletedBy: [],
    });
    await notificacion.save();

    historial.ultima_actualizacion = new Date();
    await historial.save();

    res.json({ success: true, message: 'Documento subido con éxito', documento });
  } catch (error) {
    console.error('Error en subirDocumento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const descargarDocumento = async (req, res) => {
  const { historialId, documentoId } = req.params;

  try {
    const historial = await HistorialMedico.findById(historialId);
    if (!historial) {
      return res.status(400).json({ success: false, message: 'Historial no encontrado' });
    }

    const documento = historial.documentos.id(documentoId);
    if (!documento) {
      return res.status(404).json({ success: false, message: 'Documento no encontrado' });
    }

    const filePath = path.resolve(documento.ruta);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado en el servidor' });
    }

    res.download(filePath, documento.nombre, (err) => {
      if (err) {
        console.error('Error al descargar el archivo:', err);
        res.status(500).json({ success: false, error: 'Error al descargar el archivo' });
      }
    });
  } catch (error) {
    console.error('Error en descargarDocumento:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const actualizarEntrada = async (req, res) => {
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
    res.status(500).json({ success: false, error: error.message });
  }
};

const eliminarEntrada = async (req, res) => {
  const { historialId, tipo, entradaId, correo } = req.body;
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
        if (entrada) {
          historial.sintomas.pull(entradaId);
        }
        break;
      case 'diagnosticos':
        if (persona.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden eliminar diagnósticos' });
        }
        entrada = historial.diagnosticos.id(entradaId);
        if (entrada) {
          historial.diagnosticos.pull(entradaId);
        }
        break;
      case 'tratamientos':
        if (persona.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden eliminar tratamientos' });
        }
        entrada = historial.tratamientos.id(entradaId);
        if (entrada) {
          historial.tratamientos.pull(entradaId);
        }
        break;
      case 'medicamentos':
        if (persona.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden eliminar medicamentos' });
        }
        entrada = historial.medicamentos.id(entradaId);
        if (entrada) {
          historial.medicamentos.pull(entradaId);
        }
        break;
      case 'ordenes_analisis':
        if (persona.rol !== 'Médico') {
          return res.status(403).json({ success: false, message: 'Solo los médicos pueden eliminar órdenes de análisis' });
        }
        entrada = historial.ordenes_analisis.id(entradaId);
        if (entrada) {
          historial.ordenes_analisis.pull(entradaId);
        }
        break;
      case 'resultados_analisis':
        entrada = historial.resultados_analisis.id(entradaId);
        if (entrada) {
          historial.resultados_analisis.pull(entradaId);
        }
        break;
      default:
        return res.status(400).json({ success: false, message: 'Tipo de entrada no válido' });
    }

    if (!entrada) {
      return res.status(404).json({ success: false, message: 'Entrada no encontrada' });
    }

    if (entrada.registrado_por.toString() !== persona._id.toString()) {
      return res.status(403).json({ success: false, message: 'No tienes permiso para eliminar esta entrada' });
    }

    historial.ultima_actualizacion = new Date();
    await historial.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Error en eliminarEntrada:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const analyzeSymptoms = async (req, res) => {
  try {
    const { symptomsText } = req.body;

    const prompt = `
      Eres un asistente médico de IA especializado en diagnóstico. Analiza los síntomas proporcionados y genera una respuesta estructurada con posibles diagnósticos y recomendaciones de tratamiento. Responde en español y usa un lenguaje claro y profesional. Si los síntomas sugieren una condición grave, recomienda consultar a un médico de inmediato. No uses enlaces externos ni referencias a blogs.

      **Paciente:** Adulto de 30 años, género desconocido (ajusta según esta información limitada).
      **Síntomas:** ${symptomsText}

      **Instrucciones adicionales:**
      - No agrupes diagnósticos en una sola entrada. Por ejemplo, en lugar de "Infección respiratoria viral (Gripe, Resfriado común)", lista cada diagnóstico por separado: "Gripe (50%)", "Resfriado común (15%)", etc.
      - Elige un diagnóstico principal específico, incluso si tienes que estimar basándote en los síntomas.
      - En las recomendaciones, evita texto introductorio redundante y enfócate en instrucciones específicas.

      **Formato de respuesta obligatorio:**
      Síntomas detectados:
      - [Síntoma 1]
      - [Síntoma 2]

      Posibles diagnósticos:
      - [Diagnóstico 1] ([probabilidad estimada en %])
      - [Diagnóstico 2] ([probabilidad estimada en %])

      Diagnóstico principal: [Diagnóstico más probable]

      Recomendaciones de tratamiento:
      - [Recomendación 1]
      - [Recomendación 2]
    `;

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const geminiResponse = response.data.candidates[0].content.parts[0].text;
    console.log('Respuesta cruda de Google Gemini:', geminiResponse);

    const lines = geminiResponse.split('\n').filter(line => line.trim() !== '');
    let symptoms = [];
    let possibleDiagnoses = [];
    let diagnosis = 'Desconocido';
    let treatment = '';

    let currentSection = '';
    for (const line of lines) {
      if (line.includes('Síntomas detectados:')) {
        currentSection = 'symptoms';
        continue;
      } else if (line.includes('Posibles diagnósticos:')) {
        currentSection = 'diagnoses';
        continue;
      } else if (line.includes('Diagnóstico principal:')) {
        currentSection = 'diagnosis';
        continue;
      } else if (line.includes('Recomendaciones de tratamiento:')) {
        currentSection = 'treatment';
        continue;
      }

      if (currentSection === 'symptoms' && line.startsWith('-')) {
        symptoms.push(line.replace('- ', '').trim());
      } else if (currentSection === 'diagnoses' && line.startsWith('-')) {
        const match = line.match(/- (.+?) \((\d+%)\)/);
        if (match) {
          possibleDiagnoses.push({
            diagnosis: match[1].trim(),
            probability: parseFloat(match[2].replace('%', '')) / 100,
          });
        } else {
          possibleDiagnoses.push({
            diagnosis: line.replace('- ', '').trim(),
            probability: 0,
          });
        }
      } else if (currentSection === 'diagnosis') {
        diagnosis = line.replace('Diagnóstico principal: ', '').trim();
      } else if (currentSection === 'treatment' && line.startsWith('-')) {
        treatment += line.replace('- ', '').trim() + '\n';
      }
    }

    if (symptoms.length === 0) {
      symptoms = symptomsText.toLowerCase().split(',').map(s => s.trim());
    }

    if (diagnosis === 'Desconocido' && possibleDiagnoses.length > 0) {
      possibleDiagnoses.sort((a, b) => b.probability - a.probability);
      diagnosis = possibleDiagnoses[0].diagnosis;
    }

    if (!treatment) {
      treatment = 'Consulta a un médico para un diagnóstico preciso.';
    }

    const fullDiagnosisText = `
Síntomas detectados:
${symptoms.map(s => `- ${s}`).join('\n')}

Posibles diagnósticos:
${possibleDiagnoses.map(d => `- ${d.diagnosis} (${(d.probability * 100).toFixed(0)}%)`).join('\n')}

Diagnóstico principal: ${diagnosis}

Recomendaciones de tratamiento:
${treatment.trim().split('\n').map(t => `- ${t}`).join('\n')}
    `.trim();

    res.json({
      symptoms,
      possibleDiagnoses,
      diagnosis,
      treatment: treatment.trim(),
      fullDiagnosisText,
    });
  } catch (error) {
    console.error('Error al analizar síntomas:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Error al procesar los síntomas' });
  }
};

module.exports = {
  obtenerPorCorreo,
  guardarEntrada,
  subirResultadoAnalisis,
  subirDocumento,
  descargarDocumento,
  actualizarEntrada,
  eliminarEntrada,
  analyzeSymptoms
};