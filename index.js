const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const personaRoutes = require('./routes/personaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Para servir archivos estáticos (PDFs descargados)

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/saludgest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('Error al conectar a MongoDB:', err));

// Rutas
app.use('/api/pacientes', personaRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/mensajes', mensajeRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});