const mongoose = require('mongoose');

const HistorialMedicoSchema = new mongoose.Schema({
  persona_paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  persona_medico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona' },
  sintomas: [
    {
      fecha: { type: Date, default: Date.now },
      descripcion: { type: String, required: true },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    },
  ],
  diagnosticos: [
    {
      fecha: { type: Date, default: Date.now },
      descripcion: { type: String, required: true },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
      sintomas_relacionados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HistorialMedico.sintomas' }],
      documento_relacionado: { type: mongoose.Schema.Types.ObjectId, ref: 'HistorialMedico.documentos' }, // Nuevo campo para enlazar con resultado de análisis
    },
  ],
  tratamientos: [
    {
      fecha: { type: Date, default: Date.now },
      descripcion: { type: String, required: true },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
      diagnostico_relacionado: { type: mongoose.Schema.Types.ObjectId, ref: 'HistorialMedico.diagnosticos' },
    },
  ],
  medicamentos: [
    {
      nombre: { type: String, required: true },
      dosis: { type: String, required: true },
      frecuencia: { type: String, required: true },
      fecha_inicio: { type: Date, default: Date.now },
      fecha_fin: { type: Date },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
      tratamiento_relacionado: { type: mongoose.Schema.Types.ObjectId, ref: 'HistorialMedico.tratamientos' },
    },
  ],
  ordenes_analisis: [
    {
      orden_id: { type: String, required: true },
      fecha: { type: Date, default: Date.now },
      tipo: { type: String, required: true },
      estado: { type: String, default: 'Pendiente' },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona' },
    },
  ],
  resultados_analisis: [
    {
      orden_id: { type: String, required: true },
      fecha: { type: Date, default: Date.now },
      resultados: { type: String, required: true },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    },
  ],
  documentos: [
    {
      nombre: { type: String, required: true },
      ruta: { type: String, required: true },
      tipo: { type: String, enum: ['resultado_analisis', 'otro'], default: 'otro' },
      fecha: { type: Date, default: Date.now },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    },
  ],
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HistorialMedico', HistorialMedicoSchema);