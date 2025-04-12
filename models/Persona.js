const mongoose = require('mongoose');

const PersonaSchema = new mongoose.Schema({
  rol: { type: String, enum: ['Paciente', 'Médico', 'Admin', 'Secretario'], required: true },
  nombre_completo: { type: String, required: true },
  correo: { type: String, required: true, unique: true },
  telefono: { type: String, required: true },
  contraseña: { type: String, required: true },
  fecha_registro: { type: Date, default: Date.now },
  medico_asignado: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', default: null },
  especialidad: { type: String },
  disponibilidad: [{ dia: String, horarios: [{ inicio: String, fin: String }] }],
  pacientes_asignados: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Persona' }],
  preferencias_notificaciones: { email: Boolean, push: Boolean },
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Persona', PersonaSchema);