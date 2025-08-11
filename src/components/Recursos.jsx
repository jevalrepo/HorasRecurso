// src/components/Recursos.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  createRow,
} from "material-react-table";
import { Box, Typography, Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { getDataRecursos, getHorasRecursoPorId } from "../data/dataRecursos";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import HorasRecurso from "./HorasRecurso";
import ResumenHorasRecurso from "./ResumenHorasRecurso";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { supabase } from "../lib/supabaseClient";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const swalBase = {
  background: "#0e111b",
  color: "#fff",
  confirmButtonColor: "#7C4DFF",
  cancelButtonColor: "#424a64",
};

const toPercentNumber = (v) => {
  if (typeof v === "number") return v;
  if (v == null) return 0;
  const n = parseFloat(
    String(v)
      .trim()
      .replace(",", ".")
      .replace(/[^\d.-]/g, "")
  );
  return Number.isFinite(n) ? n : 0;
};
const clamp01_100 = (n) => Math.max(0, Math.min(100, n));

const Recursos = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [horasRecursoSeleccionado, setHorasRecursoSeleccionado] = useState([]);
  const [refreshResumenKey, setRefreshResumenKey] = useState(0);

  // 🔄 recarga el dataset desde tu helper
  const refresh = async () => {
    const data = await getDataRecursos();
    setTableData(data);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const selectedRecursoId = Number(Object.keys(rowSelection)[0]);
  const selectedRecurso = tableData.find((r) => r.id === selectedRecursoId);

  useEffect(() => {
    (async () => {
      if (!selectedRecursoId) return;
      const horas = await getHorasRecursoPorId(selectedRecursoId);
      setHorasRecursoSeleccionado(horas);
    })();
  }, [selectedRecursoId]);

  const horasPlanas = useMemo(() => {
    if (!horasRecursoSeleccionado?.length) return [];

    const meses = [0, 1, 2].map((offset) => {
      const fecha = dayjs().add(offset, "month");
      return { mes: fecha.month() + 1, anio: fecha.year() };
    });

    const resultado = [];
    for (const proyecto of horasRecursoSeleccionado) {
      meses.forEach((m, i) => {
        const horas = proyecto[`horas_${i}`];
        if (horas !== "" && horas !== null && horas !== undefined) {
          resultado.push({
            mes: m.mes,
            anio: m.anio,
            tipo: proyecto.tipo,
            horas: parseFloat(horas),
          });
        }
      });
    }
    return resultado;
  }, [horasRecursoSeleccionado]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Id",
        size: 1,
        enableEditing: false,
        muiTableBodyCellProps: { align: "left", sx: { whiteSpace: "normal" } },
      },
      {
        accessorKey: "recurso",
        header: "Recurso",
        size: 290,
        enableEditing: true, // ✅
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left", sx: { whiteSpace: "normal" } },
        muiTableBodyCellEditTextFieldProps: {
          required: true,
          inputProps: { maxLength: 150 },
        },
      },
      {
        accessorKey: "proyecto",
        header: "Proyecto",
        size: 10,
        enableEditing: true, // ✅ %
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
        muiTableBodyCellEditTextFieldProps: {
          type: "number",
          inputProps: { min: 0, max: 100, step: 1 },
        },
      },
      {
        accessorKey: "mtto",
        header: "Mtto",
        size: 10,
        enableEditing: true, // ✅ %
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
        muiTableBodyCellEditTextFieldProps: {
          type: "number",
          inputProps: { min: 0, max: 100, step: 1 },
        },
      },
      {
        accessorKey: "horasProyectos",
        header: "Hrs Proyectos",
        size: 10,
        enableEditing: false, // ❌
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
      },
      {
        accessorKey: "horasMtto",
        header: "Hrs Mtto",
        size: 10,
        enableEditing: false, // ❌
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
      },
      {
        accessorKey: "totalHoras",
        header: "Total de Horas",
        size: 10,
        enableEditing: true, // ✅
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
        muiTableBodyCellEditTextFieldProps: {
          type: "number",
          inputProps: { min: 0, step: 1 },
        },
      },
    ],
    []
  );

  // ✅ guardar edición
  // Guardar edición
  const handleSaveEdit = async ({ row, values, table }) => {
    try {
      const id = row.original.id;

      const recurso = (values.recurso || "").trim();
      const porcProyecto = clamp01_100(toPercentNumber(values.proyecto)); // 👈 limpia '%'
      const porcMtto = clamp01_100(toPercentNumber(values.mtto)); // 👈 limpia '%'
      const totalHoras = Number(values.totalHoras) || 0;

      if (!recurso) {
        return Swal.fire({
          icon: "error",
          title: "El nombre es obligatorio",
          ...swalBase,
        });
      }

      // recalculo consistente
      const horasProyecto = Math.round((totalHoras * porcProyecto) / 100);
      const horasMtto = Math.round((totalHoras * porcMtto) / 100);

      const payload = {
        recurso,
        porcProyecto,
        porcMtto,
        totalHoras,
        horasProyecto,
        horasMtto,
      };

      const { error } = await supabase
        .from("recursos")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      await refresh();
      table.setEditingRow(null);

      Swal.fire({
        icon: "success",
        title: "Cambios guardados",
        timer: 1200,
        showConfirmButton: false,
        ...swalBase,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: e.message,
        ...swalBase,
      });
    }
  };

  // Crear fila
  const handleSaveCreate = async ({ values, table }) => {
    try {
      const recurso = (values.recurso || "").trim();
      const porcProyecto = clamp01_100(toPercentNumber(values.proyecto));
      const porcMtto = clamp01_100(toPercentNumber(values.mtto));
      const totalHoras = Number(values.totalHoras) || 0;

      if (!recurso) {
        return Swal.fire({
          icon: "error",
          title: "El nombre es obligatorio",
          ...swalBase,
        });
      }

      const horasProyecto = Math.round((totalHoras * porcProyecto) / 100);
      const horasMtto = Math.round((totalHoras * porcMtto) / 100);

      const payload = {
        recurso,
        porcProyecto,
        porcMtto,
        totalHoras,
        horasProyecto,
        horasMtto,
      };

      const { error } = await supabase.from("recursos").insert(payload);
      if (error) throw error;

      await refresh();
      table.setCreatingRow(null);

      Swal.fire({
        icon: "success",
        title: "Recurso creado",
        timer: 1200,
        showConfirmButton: false,
        ...swalBase,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "No se pudo crear",
        text: e.message,
        ...swalBase,
      });
    }
  };

  // 🗑️ eliminar fila
  const handleDelete = async ({ row }) => {
    const id = row.original.id;
    const nombre = row.original.recurso;

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Eliminar recurso",
      html: `¿Eliminar <b>"${nombre}"</b>? También debes considerar sus asignaciones de horas.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      ...swalBase,
    });
    if (!isConfirmed) return;

    try {
      const { error } = await supabase.from("recursos").delete().eq("id", id);
      if (error) {
        // si hay FK en horasrecurso sin ON DELETE CASCADE, explica
        const friendly = /foreign key/i.test(error.message)
          ? 'Este recurso tiene horas en "horasrecurso". Elimina o reasigna esas horas primero (o configura ON DELETE CASCADE).'
          : error.message;
        throw new Error(friendly);
      }
      await refresh();
      Swal.fire({
        icon: "success",
        title: "Recurso eliminado",
        timer: 1100,
        showConfirmButton: false,
        ...swalBase,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: e.message,
        ...swalBase,
      });
    }
  };

  const table = useMaterialReactTable({
  columns,
  data: tableData,
  localization: MRT_Localization_ES,

  // 🔧 edición inline (fila)
  editingMode: "row",
  editDisplayMode: "row",
  createDisplayMode: "row",
  enableEditing: true,

  // barras / toggles
  enableTopToolbar: true,
  enableBottomToolbar: false,
  enableColumnActions: false,
  enableColumnFilters: false,
  enableDensityToggle: false, // oculto, pero dejamos todo en "compacto" por estilos
  enableFullScreenToggle: false,
  enableHiding: false,

  // selección
  enableRowSelection: true,
  enableMultiRowSelection: false,

  // --- 👇 CLAVES PARA DENSIDAD COMPACTA ---
  // tamaño "small" del <Table> (reduce paddings base)
  muiTableProps: {
    size: "small",
    sx: {
      // padding global de celdas
      "& .MuiTableCell-root": { py: 0.25, px: 0.75 },
      // header un pelín más alto que body
      "& thead .MuiTableCell-root": {
        py: 0.5,
        fontSize: "0.78rem",
      },
      // body aún más compacto
      "& tbody .MuiTableCell-root": {
        fontSize: "0.78rem",
        lineHeight: 1.15,
      },
      // altura efectiva de fila (por si hay iconos/checkbox altos)
      "& .MuiTableRow-root": { height: 28 },
      // icon buttons/checkbox compactos
      "& .MuiIconButton-root": { padding: 0.25 },
      "& .MuiCheckbox-root": { padding: 0.25 },
    },
  },

  muiTableContainerProps: { sx: { overflowX: "auto" } },

  // columnas utilitarias
  displayColumnDefOptions: {
    "mrt-row-select": {
      size: 30, // ancho mínimo para checkbox
      enableHiding: false,
      visibleInShowHideMenu: false,
      header: "",
      muiTableHeadCellProps: { sx: { px: 0.5 } },
      muiTableBodyCellProps: { sx: { px: 0.5 } },
    },
    "mrt-row-actions": {
      size: 56,
      header: "",
      muiTableHeadCellProps: { sx: { px: 0.5 } },
      muiTableBodyCellProps: { sx: { px: 0.25 } },
    },
  },

  initialState: {
    columnVisibility: { "mrt-row-select": false, id: false },
    // si tu versión de MRT soporta density en estado, esto fuerza compact:
    // density: 'compact',
  },

  getRowId: (row) => row.id,

  // comportamiento fila (selección por click)
  muiTableBodyRowProps: ({ row, table }) => ({
    onClick: (e) => {
      if (
        e.target.closest("[data-mrt-row-actions]") ||
        e.target.closest('button, a, input, textarea, select, [role="button"]')
      ) {
        return;
      }
      const st = table.getState();
      const isEditingThis =
        st.editingRow?.id === row.id || st.creatingRow?.id === row.id;
      if (isEditingThis) return;

      row.getToggleSelectedHandler()(e);
    },
    sx: {
      cursor: "pointer",
      backgroundColor: "#0e111b",
      "&:nth-of-type(even)": { backgroundColor: "#0e111b" },
      "&.Mui-selected": { backgroundColor: "#21283dff" },
      "&.Mui-selected:hover": { backgroundColor: "#5d5f74ff" },
      "&:hover": { backgroundColor: "#5d5f74ff" },
      // asegúrate de que las celdas dentro de la fila mantengan padding compacto
      "& td, & th": { py: 0.25, px: 0.75 },
    },
  }),

  // guardar/cancelar
  onEditingRowSave: handleSaveEdit,
  onCreatingRowSave: handleSaveCreate,

  // acciones por fila (iconos pequeños)
  renderRowActions: ({ row, table }) => (
    <>
      <IconButton
        size="small"
        color="primary"
        onClick={(e) => {
          e.stopPropagation();
          table.setEditingRow(row);
        }}
        sx={{ mr: 0.5 }}
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color="error"
        onClick={(e) => {
          e.stopPropagation();
          handleDelete({ row });
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  ),

  // botón crear arriba a la derecha
  renderTopToolbarCustomActions: ({ table }) => (
    <Button
      size="small"
      variant="contained"
      onClick={() =>
        table.setCreatingRow(
          createRow(table, {
            recurso: "",
            proyecto: 0,
            mtto: 0,
            horasProyectos: 0,
            horasMtto: 0,
            totalHoras: 0,
          })
        )
      }
      sx={{ py: 0.5, px: 1.25 }}
    >
      Agregar recurso
    </Button>
  ),

  positionToolbarAlertBanner: "bottom",
  muiTopToolbarProps: {
    sx: {
      backgroundColor: "#0e111b",
      color: "#ffffff",
      borderBottom: "1px solid #444",
      fontWeight: "bold",
      fontSize: "0.8rem",
      minHeight: 36, // toolbar compacta
      "& .MuiInputBase-root": { fontSize: "0.8rem" },
      "& .MuiIconButton-root": { padding: 0.25 },
    },
  },

  muiTableHeadCellProps: {
    align: "center",
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
      py: 0.25, // 👈 compacto
      px: 0.75,
      fontSize: "0.78rem",
      lineHeight: 1.15,
      whiteSpace: "nowrap",
    },
  },

  muiBottomToolbarProps: {
    sx: {
      backgroundColor: "#0e111b",
      color: "#ffffff",
      borderTop: "1px solid #444",
      fontWeight: "bold",
      fontSize: "0.8rem",
      minHeight: 36,
      justifyContent: "center",
    },
  },

  // checkboxes compactos
  muiSelectCheckboxProps: { size: "small" },

  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
});


  if (loading) return <Typography>Cargando datos...</Typography>;

  return (
    <>
      <MaterialReactTable table={table} />

      {selectedRecurso && (
        <Box mt={4}>
          {/* <Typography variant="h6" color="white" gutterBottom>
            Proyectos/Mttos
          </Typography> */}
          <HorasRecurso
            recursoId={selectedRecurso.id}
            onRefreshResumen={() => setRefreshResumenKey((k) => k + 1)}
          />
          <ResumenHorasRecurso
            key={refreshResumenKey}
            recursoId={selectedRecurso.id}
          />
        </Box>
      )}
    </>
  );
};

export default Recursos;
