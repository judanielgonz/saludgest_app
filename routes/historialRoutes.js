const express = require('express');
const router = express.Router();
const { 
  obtenerPorCorreo,
  guardarEntrada,
  subirDocumento,
  descargarDocumento,
  actualizarEntrada,
  analyzeSymptoms 
} = require('../controllers/historialController');
const multer = require('multer');

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'Uploads/';
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB para el archivo
});

// Rutas
router.post('/generar-diagnostico', analyzeSymptoms);
router.get('/obtener-por-correo', obtenerPorCorreo);
router.post('/guardar-entrada', guardarEntrada);
router.put('/actualizar-entrada', actualizarEntrada);
router.post('/subir-documento', upload.single('documento'), (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No se proporcionó un archivo o el archivo no es un PDF' });
  }
  next();
}, subirDocumento);
router.get('/descargar-documento/:historialId/:documentoId', descargarDocumento);

module.exports = router;