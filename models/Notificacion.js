const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificacionSchema = new Schema({
  tipo: { type: String, required: true },
  contenido: { type: String, required: true },
  destinatario: { type: String, required: true },
  estado: { type: String, required: true },
  fecha: { type: Date, required: true },
  canal: { type: String, required: true },
  persona_id: { type: Schema.Types.ObjectId, ref: 'Persona', required: true },
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);