const Notificacion = require('../models/Notificacion');

exports.obtenerNotificaciones = async (req, res) => {
  try {
    const notificaciones = await Notificacion.find({ estado: 'Entregada' });
    res.status(200).json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener notificaciones' });
  }
};