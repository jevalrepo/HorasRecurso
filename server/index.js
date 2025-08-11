const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use("/api/recursos", require("./api/recursos"));
app.use("/api/proyectos", require("./api/proyectos"));
app.use("/api/horas-recurso", require("./api/horasRecurso"));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor backend corriendo en puerto ${PORT}`));
