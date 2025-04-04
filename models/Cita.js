const mongoose = require('mongoose');

const citaSchema = new mongoose.Schema({
  persona_paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  persona_medico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  fecha: { type: Date, required: true },
  hora_inicio: { type: String, required: true },
  hora_fin: { type: String, required: true },
  estado: { type: String, default: 'Programada' },
  creada_en: { type: Date, default: Date.now },
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Cita', citaSchema);