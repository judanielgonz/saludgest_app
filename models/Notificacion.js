const mongoose = require('mongoose');

const NotificacionSchema = new mongoose.Schema({
  persona_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  tipo: { type: String, required: true },
  contenido: { type: String, required: true },
  fecha_envio: { type: Date, default: Date.now },
  estado: { type: String, default: 'Entregada' },
  canal: { type: String, enum: ['Push', 'Email'], required: true },
});

module.exports = mongoose.model('Notificacion', NotificacionSchema);

//este codigo se llama Notificacion.js