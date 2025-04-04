const mongoose = require('mongoose');

const HistorialMedicoSchema = new mongoose.Schema({
  persona_paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  persona_medico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  sintomas: [{ fecha: Date, descripcion: String, registrado_por: String }],
  diagnosticos: [{ fecha: Date, descripcion: String, registrado_por: String }],
  tratamientos: [{ fecha: Date, descripcion: String, registrado_por: String }],
  medicamentos: [{ nombre: String, dosis: String, frecuencia: String, fecha_inicio: Date, fecha_fin: Date, registrado_por: String }],
  ordenes_analisis: [{ orden_id: String, fecha: Date, tipo: String, estado: String }],
  resultados_analisis: [{ orden_id: String, fecha: Date, resultados: Object, registrado_por: String }],
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HistorialMedico', HistorialMedicoSchema);