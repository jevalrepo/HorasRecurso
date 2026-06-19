const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'database.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS recursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recurso TEXT NOT NULL,
    porcProyecto REAL DEFAULT 0,
    porcMtto REAL DEFAULT 0,
    horasProyecto REAL DEFAULT 0,
    horasMtto REAL DEFAULT 0,
    totalHoras REAL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS proyectos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    tipo TEXT,
    folio TEXT
  );

  CREATE TABLE IF NOT EXISTS horasRecurso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recurso_id INTEGER NOT NULL,
    proyecto_id INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    anio INTEGER NOT NULL,
    horas REAL NOT NULL,
    FOREIGN KEY (recurso_id) REFERENCES recursos(id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_horas_unique
    ON horasRecurso(recurso_id, proyecto_id, anio, mes);
`);

module.exports = db;
