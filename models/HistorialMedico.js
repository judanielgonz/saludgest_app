const mongoose = require('mongoose');

const HistorialMedicoSchema = new mongoose.Schema({
  persona_paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  persona_medico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
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
    },
  ],
  tratamientos: [
    {
      fecha: { type: Date, default: Date.now },
      descripcion: { type: String, required: true },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
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
      resultados: { type: Map, of: String },
      registrado_por: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
    },
  ],
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('HistorialMedico', HistorialMedicoSchema);