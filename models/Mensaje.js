const mongoose = require('mongoose');

const MensajeSchema = new mongoose.Schema({
  persona_paciente_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  persona_medico_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Persona', required: true },
  hilo: [{
    emisor: { type: String, required: true },
    fecha: { type: Date, default: Date.now },
    contenido: { type: String, required: true },
    leido: { type: Boolean, default: false },
  }],
  ultima_actualizacion: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Mensaje', MensajeSchema);

//este codigo se llama Mensaje.js