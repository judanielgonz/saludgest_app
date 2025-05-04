const Notificacion = require('../models/Notificacion');

exports.obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId; // Obtenemos usuarioId del query parameter

    if (!usuarioId) {
      return res.status(400).json({ success: false, error: 'usuarioId es requerido' });
    }

    const notificaciones = await Notificacion.find({
      persona_id: usuarioId, // Filtramos por el usuario
      deletedBy: { $ne: usuarioId }, // Excluimos las marcadas como borradas por este usuario
    }).sort({ fecha: -1 }); // Ordenamos por fecha, más recientes primero

    res.status(200).json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener notificaciones' });
  }
};

exports.marcarTodasBorradas = async (req, res) => {
  try {
    const usuarioId = req.body.usuarioId; // Obtenemos usuarioId del body

    if (!usuarioId) {
      return res.status(400).json({ success: false, error: 'usuarioId es requerido' });
    }

    // Actualizamos todas las notificaciones del usuario
    const result = await Notificacion.updateMany(
      { 
        persona_id: usuarioId, // Solo las notificaciones del usuario
        deletedBy: { $ne: usuarioId } // Que no hayan sido marcadas como borradas por este usuario
      },
      { $addToSet: { deletedBy: usuarioId } } // Agregamos el usuario al array deletedBy
    );

    res.status(200).json({ success: true, message: 'Todas las notificaciones han sido marcadas como borradas' });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como borradas:', error);
    res.status(500).json({ success: false, error: 'Error al marcar las notificaciones como borradas' });
  }
};