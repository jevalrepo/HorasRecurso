const express = require('express');
const router = express.Router();
const db = require('../db.js');

router.get('/', (req, res) => {
  try {
    res.json(db.prepare('SELECT id, nombre, tipo, folio FROM proyectos ORDER BY nombre').all());
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', (req, res) => {
  try {
    const { nombre, tipo, folio } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    const result = db.prepare('INSERT INTO proyectos (nombre, tipo, folio) VALUES (?, ?, ?)')
      .run(nombre.trim(), tipo || null, folio || null);
    res.status(201).json(db.prepare('SELECT * FROM proyectos WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { nombre, tipo, folio } = req.body;
    db.prepare('UPDATE proyectos SET nombre=?, tipo=?, folio=? WHERE id=?')
      .run(nombre, tipo || null, folio || null, req.params.id);
    res.json({ message: 'Actualizado' });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM proyectos WHERE id = ?').run(req.params.id);
    res.json({ message: 'Eliminado' });
  } catch (error) {
    if (/FOREIGN KEY/i.test(error.message)) {
      return res.status(409).json({ error: 'FOREIGN KEY constraint failed' });
    }
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
