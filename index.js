const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const personaRoutes = require('./routes/personaRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/saludgest', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Rutas
app.use('/api/pacientes', personaRoutes);
app.use('/api/mensajes', mensajeRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});