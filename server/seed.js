// Ejecutar una sola vez para cargar datos iniciales: node seed.js
const db = require('./db');

const recursos = [
  { recurso: 'JORGE EDUARDO VALDEZ GONZALEZ', porcProyecto: 0, porcMtto: 100, horasProyecto: 0, horasMtto: 0, totalHoras: 0 },
  { recurso: 'WILMER JESUS HERNANDEZ CASTILLO', porcProyecto: 0, porcMtto: 100, horasProyecto: 0, horasMtto: 0, totalHoras: 0 },
  { recurso: 'JOSE LUIS GARCIA LERMA', porcProyecto: 0, porcMtto: 100, horasProyecto: 0, horasMtto: 0, totalHoras: 0 },
  { recurso: 'TOMAS OSWALDO VARELA REYES', porcProyecto: 0, porcMtto: 100, horasProyecto: 0, horasMtto: 0, totalHoras: 0 },
  { recurso: 'ERIC CARRILLO HUERTA', porcProyecto: 0, porcMtto: 100, horasProyecto: 0, horasMtto: 0, totalHoras: 0 },
  { recurso: 'DIEGO ARTURO ESPRONCEDA', porcProyecto: 0, porcMtto: 100, horasProyecto: 0, horasMtto: 0, totalHoras: 0 },
];

const proyectos = [
  { nombre: 'Generación Asincrónica de Reportes', tipo: 'Mtto', folio: 'F-183696' },
  { nombre: 'Identificación de duplicidad de números de serie en Flotillas Autos', tipo: 'Mtto', folio: 'F-188095' },
  { nombre: 'Renovaciones MSI fase 2 - Banca', tipo: 'Mtto', folio: 'F-183306' },
  { nombre: 'Multianuales Pago Anual – Variaciones en Prima', tipo: 'Mtto', folio: 'F-186173' },
  { nombre: 'Captura y cambio de CR, y funcionario', tipo: 'Mtto', folio: 'F-188438' },
  { nombre: 'Config. de IDRep_KIT de Bienvenida _RBPR', tipo: 'Mtto', folio: 'F-188300' },
];

const insertRecurso = db.prepare(
  'INSERT OR IGNORE INTO recursos (recurso, porcProyecto, porcMtto, horasProyecto, horasMtto, totalHoras) VALUES (?, ?, ?, ?, ?, ?)'
);
const insertProyecto = db.prepare(
  'INSERT OR IGNORE INTO proyectos (nombre, tipo, folio) VALUES (?, ?, ?)'
);

const seedAll = db.transaction(() => {
  for (const r of recursos) {
    insertRecurso.run(r.recurso, r.porcProyecto, r.porcMtto, r.horasProyecto, r.horasMtto, r.totalHoras);
  }
  for (const p of proyectos) {
    insertProyecto.run(p.nombre, p.tipo, p.folio);
  }
});

seedAll();
console.log('Seed completado: recursos y proyectos insertados.');
