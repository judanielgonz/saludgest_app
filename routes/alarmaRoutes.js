const express = require('express');
const router = express.Router();
const alarmaController = require('../controllers/alarmaController');

router.post('/', alarmaController.registrarAlarma);

module.exports = router;

//este codigo se llama alarmaRoutes.js