const express = require('express');
const router = express.Router();
const db = require('../db');

const BASE_SELECT = `
  SELECT hr.id, hr.recurso_id, hr.proyecto_id, hr.horas, hr.mes, hr.anio,
         p.tipo, p.nombre, p.folio
  FROM horasRecurso hr
  LEFT JOIN proyectos p ON p.id = hr.proyecto_id
`;

router.get('/', (req, res) => {
  try {
    const { recurso_id, anio, mes } = req.query;
    let rows;

    if (recurso_id && anio && mes) {
      rows = db.prepare(BASE_SELECT + 'WHERE hr.recurso_id = ? AND hr.anio = ? AND hr.mes = ?')
        .all(recurso_id, anio, mes);
    } else if (anio && mes) {
      rows = db.prepare(BASE_SELECT + 'WHERE hr.anio = ? AND hr.mes = ?')
        .all(anio, mes);
    } else if (recurso_id) {
      rows = db.prepare(BASE_SELECT + 'WHERE hr.recurso_id = ?').all(recurso_id);
    } else {
      rows = db.prepare(BASE_SELECT).all();
    }

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener horas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/upsert', (req, res) => {
  try {
    const rows = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Se esperaba un array de registros' });
    }

    const upsert = db.prepare(`
      INSERT INTO horasRecurso (recurso_id, proyecto_id, mes, anio, horas)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(recurso_id, proyecto_id, anio, mes) DO UPDATE SET horas = excluded.horas
    `);

    db.transaction((rs) => { for (const r of rs) upsert.run(r.recurso_id, r.proyecto_id, r.mes, r.anio, r.horas); })(rows);

    res.json({ message: 'Upsert completado' });
  } catch (error) {
    console.error('Error en upsert:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.post('/', (req, res) => {
  try {
    const { recurso_id, proyecto_id, mes, anio, horas } = req.body;
    if (!recurso_id || !proyecto_id || !mes || !anio || horas === undefined) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }
    db.prepare('INSERT INTO horasRecurso (recurso_id, proyecto_id, mes, anio, horas) VALUES (?, ?, ?, ?, ?)')
      .run(recurso_id, proyecto_id, mes, anio, horas);
    res.status(201).json({ message: 'Registro agregado' });
  } catch (error) {
    console.error('Error al insertar horas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

router.delete('/', (req, res) => {
  try {
    const { recurso_id, proyecto_id } = req.query;
    if (!recurso_id || !proyecto_id) {
      return res.status(400).json({ error: 'recurso_id y proyecto_id son requeridos' });
    }
    db.prepare('DELETE FROM horasRecurso WHERE recurso_id = ? AND proyecto_id = ?')
      .run(recurso_id, proyecto_id);
    res.json({ message: 'Eliminado' });
  } catch (error) {
    console.error('Error al eliminar horas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
