import React, { useState } from "react";
import HorasRecurso from "./components/HorasRecurso.jsx";
import Recursos from "./components/Recursos.jsx";
import { ThemeProvider, CssBaseline, Button, Box } from "@mui/material";
import CatalogoProyectos from "./components/Catalogos/CatalogoProyectos.jsx";
import { Typography } from "@mui/material";

import darkTheme from "./theme/darkTheme.jsx";

function App() {
  const [openProyectos, setOpenProyectos] = useState(false);

  return (
    <main>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Box sx={{ width: "100%", p: 2 }}>
          {/* Header + botón para abrir el modal */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            {/* <h2 style={{ margin: 0 }}>Distribución de Horas x Mes</h2> */}
            <Typography variant="h6" color="white" mt={2} gutterBottom>
              
            </Typography>
            <Button alignItems="right" variant="contained" onClick={() => setOpenProyectos(true)}>
              Abrir catálogo de proyectos
            </Button>
          </Box>

          {/* Tu tabla principal */}
          <Recursos />
        </Box>

        {/* Modal con la tabla del catálogo */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <CatalogoProyectos
            open={openProyectos}
            onClose={() => setOpenProyectos(false)}
          />
        </Box>
      </ThemeProvider>
    </main>
  );
}

export default App;
