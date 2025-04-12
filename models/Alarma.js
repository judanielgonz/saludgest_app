const mongoose = require('mongoose');

const AlarmaSchema = new mongoose.Schema({
  persona_paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  persona_medico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona' },
  tipo: { type: String, required: true },
  actividad: { medicamento_id: String, dosis: String },
  hora: { type: String, required: true },
  frecuencia: { type: String, required: true },
  mensaje: { type: String, required: true },
  estado: { type: String, default: 'Activa' },
  confirmaciones: [{ fecha: Date, confirmado: Boolean, accion: String }],
  creada_en: { type: Date, default: Date.now },
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Alarma', AlarmaSchema);

//este codigo se llama Alarma.js