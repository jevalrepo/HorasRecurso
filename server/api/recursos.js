const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  try {
    res.json(db.prepare("SELECT * FROM recursos").all());
  } catch (error) {
    console.error("Error al obtener recursos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.post("/", (req, res) => {
  try {
    const { recurso, porcProyecto, porcMtto, totalHoras, horasProyecto, horasMtto } = req.body;
    if (!recurso?.trim()) return res.status(400).json({ error: "El nombre es obligatorio" });
    const result = db.prepare(
      "INSERT INTO recursos (recurso, porcProyecto, porcMtto, totalHoras, horasProyecto, horasMtto) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(recurso.trim(), porcProyecto || 0, porcMtto || 0, totalHoras || 0, horasProyecto || 0, horasMtto || 0);
    res.status(201).json(db.prepare("SELECT * FROM recursos WHERE id = ?").get(result.lastInsertRowid));
  } catch (error) {
    console.error("Error al crear recurso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.put("/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { recurso, porcProyecto, porcMtto, totalHoras, horasProyecto, horasMtto } = req.body;
    db.prepare(
      "UPDATE recursos SET recurso=?, porcProyecto=?, porcMtto=?, totalHoras=?, horasProyecto=?, horasMtto=? WHERE id=?"
    ).run(recurso, porcProyecto, porcMtto, totalHoras, horasProyecto, horasMtto, id);
    res.json({ message: "Actualizado" });
  } catch (error) {
    console.error("Error al actualizar recurso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

router.delete("/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM recursos WHERE id = ?").run(req.params.id);
    res.json({ message: "Eliminado" });
  } catch (error) {
    if (/FOREIGN KEY/i.test(error.message)) {
      return res.status(409).json({ error: "FOREIGN KEY constraint failed" });
    }
    console.error("Error al eliminar recurso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
