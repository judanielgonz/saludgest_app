const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const personaRoutes = require('./routes/personaRoutes');
const historialRoutes = require('./routes/historialRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');

dotenv.config(); // Cargar variables de entorno

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Para servir archivos estáticos (PDFs descargados)

// Conectar a MongoDB
connectDB();

// Rutas
app.use('/api/pacientes', personaRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/mensajes', mensajeRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});