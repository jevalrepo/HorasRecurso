// server/routes/horasRecurso.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // Asegúrate de que este sea tu pool de PostgreSQL

// POST: insertar horas para recurso
router.post('/', async (req, res) => {
  try {
    const { recurso_id, proyecto_id, mes, anio, horas } = req.body;

    if (!recurso_id || !proyecto_id || !mes || !anio || horas === undefined) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    await pool.query(
      'INSERT INTO horasRecurso (recurso_id, proyecto_id, mes, anio, horas) VALUES ($1, $2, $3, $4, $5)',
      [recurso_id, proyecto_id, mes, anio, horas]
    );

    res.status(201).json({ message: 'Registro agregado' });
  } catch (error) {
    console.error('Error al insertar horas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
