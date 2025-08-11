// api/routes/proyectos.js
const express = require('express');
const router = express.Router();
const pool = require('../db.js');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, tipo, folio FROM proyectos');
    res.json(result.rows);
    console.log('Proyectos obtenidos:', result.rows);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
