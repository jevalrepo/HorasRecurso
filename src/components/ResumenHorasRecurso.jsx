import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import { Typography } from "@mui/material";
import { Box } from "@mui/material";

//import { getCellColor } from "../../utils/getCellColor.js";

const getCellStyle = (value) => {
  const [num1, num2] = value.split("/").map((v) => parseFloat(v.trim()));
  if (isNaN(num1) || isNaN(num2)) return {};

  let backgroundColor = "transparent";

  if (num1 < num2) {
    backgroundColor = "rgba(242, 139, 130, 0.8)"; // rojo
  } else if (num1 >= num2) {
    backgroundColor = "rgba(185, 246, 202, 0.8)"; // verde
  }

  return {
    backgroundColor,
    borderRadius: "4px",
    px: 1,
    py: 0.5,
    display: "inline-block",
  };
};



const ResumenHorasRecurso = ({ recursoId }) => {
  const [horas, setHoras] = useState([]);
  const [recurso, setRecurso] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: horasData } = await supabase
        .from("horasrecurso")
        .select(
          `
    id,
    recurso_id,
    proyecto_id,
    mes,
    anio,
    horas,
    proyectos (
      tipo
    )
  `
        )
        .eq("recurso_id", recursoId);

      const { data: recursoData } = await supabase
        .from("recursos")
        .select("*")
        .eq("id", recursoId)
        .single();

      setHoras(horasData || []);
      setRecurso(recursoData || null);
    };

    fetchData();
  }, [recursoId]);

  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const hoy = new Date();
  const mesActualIndex = hoy.getMonth();
  const mesesFiltrados = [
    meses[mesActualIndex],
    meses[(mesActualIndex + 1) % 12],
    meses[(mesActualIndex + 2) % 12],
  ];

  const resumenData = useMemo(() => {
    if (!recurso || !horas.length) return [];

    const hoy = new Date();
    const mesActualIndex = hoy.getMonth();
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];

    const mesesFiltrados = [0, 1, 2].map((offset) => {
      const index = (mesActualIndex + offset) % 12;
      return {
        nombre: meses[index],
        numero: index + 1,
      };
    });

    return mesesFiltrados.map(({ nombre, numero }) => {
      const horasProyecto = horas
        .filter((h) => h.mes === numero && h.proyectos?.tipo === "Proyecto")
        .reduce((sum, h) => sum + (h.horas || 0), 0);

      const horasMtto = horas
        .filter((h) => h.mes === numero && h.proyectos?.tipo === "Mtto")
        .reduce((sum, h) => sum + (h.horas || 0), 0);

      return {
        mes: nombre,
        proyecto: `${horasProyecto} / ${recurso.horasProyecto ?? 0}`,
        mtto: `${horasMtto} / ${recurso.horasMtto ?? 0}`,
        total: `${horasProyecto + horasMtto} / ${recurso.totalHoras ?? 0}`,
      };
    });
  }, [horas, recurso]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "mes",
        header: "Mes",
        size: 100,
        muiTableBodyCellProps: {
          align: "left",
          sx: { whiteSpace: "normal", backgroundColor: "#0e111b" },
        },
      },
      {
        accessorKey: "proyecto",
        header: "Horas Proyectos",
        size: 150,
        muiTableBodyCellProps: {
          align: "left",
          sx: {
            whiteSpace: "normal",
            backgroundColor: "#0e111b",
          },
        }, 
        Cell: ({ cell }) => (
          <Box component="span" sx={getCellStyle(cell.getValue())}>
            {cell.getValue()}
          </Box>
        ),
      },
      {
        accessorKey: "mtto",
        header: "Horas Mtto",
        size: 150,
        muiTableBodyCellProps: {
          align: "left",
          sx: {
            whiteSpace: "normal",
            backgroundColor: "#0e111b",
          },
        },
        Cell: ({ cell }) => (
          <Box component="span" sx={getCellStyle(cell.getValue())}>
            {cell.getValue()}
          </Box>
        ),
      },
      {
        accessorKey: "total",
        header: "Total Horas",
        size: 150,
        muiTableBodyCellProps: {
          align: "left",
          sx: {
            whiteSpace: "normal",
            backgroundColor: "#0e111b",
          },
        },
        Cell: ({ cell }) => (
          <Box component="span" sx={getCellStyle(cell.getValue())}>
            {cell.getValue()}
          </Box>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
  columns,
  data: resumenData,
  enableEditing: false,
  enableColumnActions: false,
  enableColumnFilters: false,
  enableSorting: false,
  enableTopToolbar: false,
  enableBottomToolbar: false,
  enablePagination: false,
  localization: MRT_Localization_ES,

  // ==== 👇 COMPACTO ====
  muiTableProps: {
    size: "small",
    sx: {
      "& .MuiTableCell-root": { py: 0.25, px: 0.75 },
      "& thead .MuiTableCell-root": { py: 0.5, fontSize: "0.78rem" },
      "& tbody .MuiTableCell-root": { fontSize: "0.78rem", lineHeight: 1.15 },
      "& .MuiTableRow-root": { height: 28 },
    },
  },

  muiTableContainerProps: { sx: { overflowX: "auto" } },

  muiTableHeadCellProps: {
    sx: {
      backgroundColor: "#21283dff",
      color: "#ffffff",
      fontWeight: "bold",
      borderColor: "#2c2c2c",
      py: 0.5,
      px: 0.75,
      fontSize: "0.78rem",
      lineHeight: 1.1,
      whiteSpace: "nowrap",
    },
  },

  muiTableBodyCellProps: {
    sx: {
      color: "#e0e0e0ff",
      borderColor: "#2c2c2cff",
      py: 0.25,     // compacto
      px: 0.75,     // compacto
      fontSize: "0.78rem",
      lineHeight: 1.15,
      whiteSpace: "nowrap",
    },
  },
});


  if (!recurso) return null;

  return (
    <>
      <Typography textAlign="left" variant="h6" color="white" mt={8} gutterBottom>
        Resumen de horas totales
      </Typography>
      <MaterialReactTable table={table} />
    </>
  );
};

export default ResumenHorasRecurso;
