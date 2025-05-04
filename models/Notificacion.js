const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificacionSchema = new Schema({
  tipo: { type: String, required: true },
  contenido: { type: String, required: true },
  destinatario: { type: String, required: true },
  estado: { type: String, default: 'Pendiente' }, // No requerido, con valor por defecto
  fecha: { type: Date, default: Date.now }, // No requerido, con valor por defecto
  canal: { type: String, default: 'App' }, // No requerido, con valor por defecto
  persona_id: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
  deletedBy: [{ type: Schema.Types.ObjectId, ref: 'Persona' }], // Usuarios que han marcado esta notificación como borrada
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);