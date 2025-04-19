const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');
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

router.get('/obtener-por-correo', historialController.obtenerPorCorreo);
router.post('/guardar-entrada', historialController.guardarEntrada);
router.put('/actualizar-entrada', historialController.actualizarEntrada);
router.post('/subir-documento', upload.single('documento'), (req, res, next) => {
  // Middleware para manejar errores de multer
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No se proporcionó un archivo o el archivo no es un PDF' });
  }
  next();
}, historialController.subirDocumento);
router.get('/descargar-documento/:historialId/:documentoId', historialController.descargarDocumento);

module.exports = router;