const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const personaRoutes = require('./routes/personaRoutes');
const citaRoutes = require('./routes/citaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');
const alarmaRoutes = require('./routes/alarmaRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/saludgest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error al conectar a MongoDB:', err));

// Rutas
app.use('/api/pacientes', personaRoutes);
app.use('/api/citas', citaRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/mensajes', mensajeRoutes);
app.use('/api/alarmas', alarmaRoutes);

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Error en el servidor' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});