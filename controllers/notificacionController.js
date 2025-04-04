const Notificacion = require('../models/Notificacion');

exports.getNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find();
    res.json(notificaciones);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};