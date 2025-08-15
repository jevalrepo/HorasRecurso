// src/components/Recursos.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  MaterialReactTable,
  useMaterialReactTable,
  createRow,
} from "material-react-table";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
} from "@mui/material";
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

dayjs.locale("es");

const swalBase = {
  background: "#0e111b",
  color: "#fff",
  confirmButtonColor: "#7C4DFF",
  cancelButtonColor: "#424a64",
};

const DEFAULT_CAP = 162;

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

/** Genera opciones: mes actual + próximos 3 */
/** Genera opciones: mes actual + próximos 2 */
const buildMonthOptions = () =>
  [0, 1, 2].map((offset) => {
    const d = dayjs().add(offset, "month");
    const label =
      d.format("MMMM YYYY").charAt(0).toUpperCase() +
      d.format("MMMM YYYY").slice(1);
    return {
      label,
      mes: d.month() + 1, // 1..12
      anio: d.year(),
      key: `${d.year()}-${d.month() + 1}`,
    };
  });

/** 🔎 Sumas por (anio, mes) para cada recurso, separadas por tipo */
const getAggHorasMesPorRecurso = async ({ anio, mes }) => {
  const { data, error } = await supabase
    .from("horasrecurso")
    .select(
      `
      recurso_id,
      horas,
      proyecto:proyecto_id ( tipo )
    `
    )
    .eq("anio", anio)
    .eq("mes", mes);

  if (error) throw error;

  const acc = new Map(); // recurso_id -> { proyecto, mtto }
  for (const row of data || []) {
    const tipo = row.proyecto?.tipo || "Proyecto";
    const key = row.recurso_id;
    if (!acc.has(key)) acc.set(key, { proyecto: 0, mtto: 0 });
    if (tipo.toLowerCase().startsWith("m")) {
      acc.get(key).mtto += Number(row.horas || 0);
    } else {
      acc.get(key).proyecto += Number(row.horas || 0);
    }
  }
  return acc;
};

const Recursos = () => {
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rowSelection, setRowSelection] = useState({});
  const [horasRecursoSeleccionado, setHorasRecursoSeleccionado] = useState([]);
  const [refreshResumenKey, setRefreshResumenKey] = useState(0);

  const refreshRecursosKeepSelection = async () => {
    const currentId = selectedRecursoId; // recuerda quién está seleccionado
    await refresh(); // recarga y recalcula todo (usa el mes seleccionado)
    if (currentId) {
      setRowSelection({ [currentId]: true }); // re-selecciona la misma fila
    }
    setRefreshResumenKey((k) => k + 1); // refresca también el resumen inferior
  };

  // Mes seleccionado (UI)
  const monthOptions = useMemo(buildMonthOptions, []);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const opt = monthOptions[0];
    return { anio: opt.anio, mes: opt.mes, key: opt.key, label: opt.label };
  });

  // 🔄 recarga el dataset desde tu helper + sumas del mes elegido
  const refresh = async (opts = selectedMonth) => {
    // 1) recursos base (incluye tus campos auto: horasProyecto/horasMtto/totalHoras/porcentajes)
    const recursos = await getDataRecursos();

    // 2) sumas del (anio, mes) seleccionado
    const horasAgg = await getAggHorasMesPorRecurso({
      anio: opts.anio,
      mes: opts.mes,
    });

    // 3) fusiona para mostrar X / capacidad en la tabla
    const merged = recursos.map((r) => {
      const sums = horasAgg.get(r.id) ?? { proyecto: 0, mtto: 0 };

      const total = Number(r.totalHoras) || DEFAULT_CAP;
      const porcProy = clamp01_100(toPercentNumber(r.proyecto));
      const porcMtto = clamp01_100(toPercentNumber(r.mtto));

      const capProyecto = Math.round((total * porcProy) / 100);
      const capMtto = Math.round((total * porcMtto) / 100);

      // 👇 suma real asignada del mes elegido
      const totalAsignadoMes = (sums.proyecto || 0) + (sums.mtto || 0);

      return {
        ...r,
        sumProyectoMesActual: sums.proyecto,
        sumMttoMesActual: sums.mtto,
        capacidadProyecto: capProyecto,
        capacidadMtto: capMtto,
        totalAsignadoMes, // <- nuevo
      };
    });

    setTableData(merged);
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        enableEditing: true,
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
        enableEditing: true, // %
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
        enableEditing: true, // %
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
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
        Cell: ({ row }) => {
          const s = row.original.sumProyectoMesActual ?? 0; // suma real del mes elegido
          const cap = row.original.capacidadProyecto ?? 0; // 👈 capacidad por %
          const calcAuto = row.original.horasProyecto ?? 0; // valor auto por %
          return (
            <Tooltip
              title={`Mes: ${selectedMonth.label} • Calculado por %: ${calcAuto}`}
            >
              <span>{`${s} / ${cap}`}</span> {/* si 0% -> X / 0 */}
            </Tooltip>
          );
        },
      },

      {
        accessorKey: "horasMtto",
        header: "Hrs Mtto",
        size: 10,
        enableEditing: false,
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal" },
        },
        Cell: ({ row }) => {
          const s = row.original.sumMttoMesActual ?? 0;
          const cap = row.original.capacidadMtto ?? 0; // 👈 capacidad por %
          const calcAuto = row.original.horasMtto ?? 0;
          return (
            <Tooltip
              title={`Mes: ${selectedMonth.label} • Calculado por %: ${calcAuto}`}
            >
              <span>{`${s} / ${cap}`}</span>
            </Tooltip>
          );
        },
      },

      {
  accessorKey: "totalHoras",
  header: "Total de Horas",
  size: 10,
  enableEditing: true,
  muiTableBodyCellProps: ({ row }) => {
    const asignadas = row.original.totalAsignadoMes ?? 0;
    const total = row.original.totalHoras ?? DEFAULT_CAP;

    let bgColor = "";
    let textColor = "#fff"; // texto blanco para contraste
    const porcentaje = (asignadas / total) * 100;

    if (porcentaje >= 100) {
      bgColor = "#1b5e20"; // verde oscuro
    } else if (porcentaje >= 70) {
      bgColor = "#fbc02d"; // amarillo
      textColor = "#000";  // negro para contraste en amarillo
    } else {
      bgColor = "#b71c1c"; // rojo oscuro
    }

    return {
      align: "center",
      sx: {
        backgroundColor: bgColor,
        color: textColor,
        whiteSpace: "normal",
      },
    };
  },
  Cell: ({ row }) => {
    const asignadas = row.original.totalAsignadoMes ?? 0;
    const total = row.original.totalHoras ?? DEFAULT_CAP;
    return <span>{`${asignadas} / ${total}`}</span>;
  },
  muiTableBodyCellEditTextFieldProps: {
    type: "number",
    inputProps: { min: 0, step: 1 },
  },
},

    ],
    [selectedMonth.label]
  );

  // ✅ guardar edición
  const handleSaveEdit = async ({ row, values, table }) => {
    try {
      const id = row.original.id;

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

      await refresh(); // respeta el mes seleccionado
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
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,

    // selección
    enableRowSelection: true,
    enableMultiRowSelection: false,

    // --- compacto ---
    muiTableProps: {
      size: "small",
      sx: {
        "& .MuiTableCell-root": { py: 0.25, px: 0.75 },
        "& thead .MuiTableCell-root": {
          py: 0.5,
          fontSize: "0.78rem",
        },
        "& tbody .MuiTableCell-root": {
          fontSize: "0.78rem",
          lineHeight: 1.15,
        },
        "& .MuiTableRow-root": { height: 28 },
        "& .MuiIconButton-root": { padding: 0.25 },
        "& .MuiCheckbox-root": { padding: 0.25 },
      },
    },

    muiTableContainerProps: { sx: { overflowX: "auto" } },

    displayColumnDefOptions: {
      "mrt-row-select": {
        size: 30,
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
    },

    getRowId: (row) => row.id,

    muiTableBodyRowProps: ({ row, table }) => ({
      onClick: (e) => {
        if (
          e.target.closest("[data-mrt-row-actions]") ||
          e.target.closest(
            'button, a, input, textarea, select, [role="button"]'
          )
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
        "& td, & th": { py: 0.25, px: 0.75 },
      },
    }),

    onEditingRowSave: handleSaveEdit,
    onCreatingRowSave: handleSaveCreate,

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

    // Botón + selector de mes
    renderTopToolbarCustomActions: ({ table }) => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
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
          Nuevo Recurso
        </Button>

        <Select
          size="small"
          value={selectedMonth.key}
          onChange={async (e) => {
            const opt = monthOptions.find((m) => m.key === e.target.value);
            if (!opt) return;
            const newSel = {
              anio: opt.anio,
              mes: opt.mes,
              key: opt.key,
              label: opt.label,
            };
            setSelectedMonth(newSel);
            await refresh(newSel); // recalcula sumas para el mes elegido
          }}
          sx={{ minWidth: 170, bgcolor: "#0e111b", color: "#fff" }}
        >
          {monthOptions.map((m) => (
            <MenuItem key={m.key} value={m.key}>
              {m.label}
            </MenuItem>
          ))}
        </Select>
      </Box>
    ),

    positionToolbarAlertBanner: "bottom",
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "#0e111b",
        color: "#ffffff",
        borderBottom: "1px solid #444",
        fontWeight: "bold",
        fontSize: "0.8rem",
        minHeight: 36,
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
        py: 0.25,
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
          
          <HorasRecurso
            recursoId={selectedRecurso.id}
            onRefreshResumen={() => setRefreshResumenKey((k) => k + 1)}
            onMutateParent={refreshRecursosKeepSelection} // 👈 NUEVO
          />

          {/* <ResumenHorasRecurso
            key={refreshResumenKey}
            recursoId={selectedRecurso.id}
          /> */}
        </Box>
      )}
    </>
  );
};

export default Recursos;
