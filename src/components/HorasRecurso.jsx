// src/components/HorasRecurso.jsx
import { supabase } from "../lib/supabaseClient";
import { createRow } from "material-react-table";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import IconButton from "@mui/material/IconButton";
import { Typography, Button } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { MRT_Localization_ES } from "material-react-table/locales/es";
import dayjs from "dayjs";
import "dayjs/locale/es";

const swalBase = {
  background: "#0e111b",
  color: "#fff",
  confirmButtonColor: "#7C4DFF",
  cancelButtonColor: "#424a64",
};

const HorasRecurso = ({ recursoId, onRefreshResumen, onMutateParent }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proyectos, setProyectos] = useState([]);



  // overrides por fila para mostrar tipo/folio al cambiar select
  const [draftByRowId, setDraftByRowId] = useState({}); // { [rowId]: { tipo, folio } }

  dayjs.locale("es");
  const meses = useMemo(
    () =>
      [0, 1, 2].map((offset) => {
        const fecha = dayjs().add(offset, "month");
        return {
          mes: fecha.month() + 1,
          anio: fecha.year(),
          label: fecha.format("MMMM").replace(/^\w/, (c) => c.toUpperCase()),
        };
      }),
    []
  );

  // catálogo de proyectos
  useEffect(() => {
    const fetchProyectos = async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre, tipo, folio");
      if (error) {
        console.error("Error al cargar proyectos:", error);
      } else {
        setProyectos(data || []);
      }
    };
    fetchProyectos();
  }, []);

  const columns = useMemo(
    () => [
      // ID oculto (no editable)
      {
        accessorKey: "proyecto_id",
        header: "ID Proyecto",
        enableEditing: false,
        size: 0,
        Cell: ({ cell }) =>
          proyectos.find((p) => Number(p.id) === Number(cell.getValue()))
            ?.nombre || "",
      },

      // Proyecto (select por NOMBRE)
      {
        accessorKey: "nombre",
        header: "Proyecto",
        enableEditing: true,
        editVariant: "select",
        editSelectOptions: proyectos.map((p) => ({
          value: p.nombre,
          text: p.nombre,
        })),
        muiEditTextFieldProps: ({ table, row }) => ({
          select: true,
          onChange: (e) => {
            const nombreSeleccionado = e.target.value;
            const p = proyectos.find((x) => x.nombre === nombreSeleccionado);

            const state = table.getState();

            const isCreatingThis = state.creatingRow?.id === row.id;
            const isEditingThis = state.editingRow?.id === row.id;
            if (!isCreatingThis && !isEditingThis) return;

            const targetRowState = isCreatingThis
              ? state.creatingRow
              : state.editingRow;
            const setTarget = isCreatingThis
              ? table.setCreatingRow
              : table.setEditingRow;

            setTarget({
              ...targetRowState,
              values: {
                ...targetRowState.values,
                nombre: p?.nombre ?? "",
                proyecto_id: p ? Number(p.id) : null,
              },
            });

            setDraftByRowId((prev) => ({
              ...prev,
              [row.id]: { tipo: p?.tipo ?? "", folio: p?.folio ?? "" },
            }));
          },
        }),
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: {
          align: "left",
          sx: { whiteSpace: "normal", backgroundColor: "#0e111b" },
        },
      },

      // Tipo (read-only; usa override si existe)
      {
        accessorKey: "tipo",
        header: "Tipo",
        enableEditing: false,
        size: 10,
        Cell: ({ row, cell }) => {
          const override = draftByRowId[row.id]?.tipo;
          return override ?? cell.getValue() ?? "";
        },
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal", backgroundColor: "#0e111b" },
        },
      },

      // Folio (read-only; usa override si existe)
      {
        accessorKey: "folio",
        header: "Folio",
        enableEditing: false,
        size: 10,
        Cell: ({ row, cell }) => {
          const override = draftByRowId[row.id]?.folio;
          return override ?? cell.getValue() ?? "";
        },
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal", backgroundColor: "#0e111b" },
        },
      },

      ...meses.map((m, i) => ({
        accessorKey: `horas_${i}`,
        header: `${m.label}`,
        size: 10,
        enableEditing: true,
        muiTableBodyCellEditTextFieldProps: { type: "number" },
        muiTableBodyCellProps: {
          align: "center",
          sx: { whiteSpace: "normal", backgroundColor: "#0e111b" },
        },
      })),
    ],
    [proyectos, meses, draftByRowId]
  );

  // carga horas del recurso para los 3 meses
  useEffect(() => {
    const fetchHoras = async () => {
      if (!recursoId) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("horasrecurso")
        .select(
          `
        proyecto_id,
        mes,
        anio,
        horas,
        proyectos (
          nombre,
          tipo,
          folio
        )
      `
        )
        .eq("recurso_id", recursoId)
        .in(
          "mes",
          meses.map((m) => m.mes)
        )
        .in(
          "anio",
          meses.map((m) => m.anio)
        );

      if (error) {
        console.error("Error al cargar horas:", error);
        setLoading(false);
        return;
      }

      const agrupado = {};
      for (const row of data || []) {
        const key = row.proyecto_id;
        if (!agrupado[key]) {
          agrupado[key] = {
            proyecto_id: key,
            nombre: row.proyectos?.nombre || "",
            tipo: row.proyectos?.tipo || "",
            folio: row.proyectos?.folio || "",
            horas_0: "",
            horas_1: "",
            horas_2: "",
          };
        }
        meses.forEach((m, i) => {
          if (row.mes === m.mes && row.anio === m.anio) {
            agrupado[key][`horas_${i}`] = row.horas ?? "";
          }
        });
      }

      setData(Object.values(agrupado));
      setLoading(false);
    };

    fetchHoras();
  }, [recursoId, meses]);

  const notifyParent = async () => {
    onRefreshResumen?.();
    await onMutateParent?.();
  };

  const handleSaveRow = async ({ values, table }) => {
    try {
      const state = table.getState();
      const isCreating = !!state.creatingRow;
      const oldProyectoId = !isCreating
        ? state.editingRow?.original?.proyecto_id
        : null;

      // 1) Asegura proyecto_id (si el editor solo tiene nombre)
      if (
        values.proyecto_id == null ||
        values.proyecto_id === "" ||
        Number.isNaN(Number(values.proyecto_id))
      ) {
        const nombreSel =
          state.editingRow?.values?.nombre ??
          state.creatingRow?.values?.nombre ??
          values.nombre;
        const p = proyectos.find((x) => x.nombre === nombreSel);
        values.proyecto_id = p ? Number(p.id) : null;
      }
      const newProyectoId = Number(values.proyecto_id);

      // ⛔️ Validación de FK
      if (!Number.isFinite(newProyectoId)) {
        await Swal.fire({
          icon: "error",
          title: "Proyecto requerido",
          text: "Selecciona un proyecto válido antes de guardar.",
          ...swalBase,
        });
        return;
      }

      // 2) Prepara filas válidas (solo meses con número)
      const rows = [];
      for (let i = 0; i < meses.length; i++) {
        const val = values[`horas_${i}`];
        if (val === "" || val == null) continue;
        const horasNum = Number(val);
        if (!Number.isFinite(horasNum)) continue;

        rows.push({
          recurso_id: recursoId,
          proyecto_id: newProyectoId,
          mes: meses[i].mes,
          anio: meses[i].anio,
          horas: horasNum,
        });
      }

      if (rows.length) {
        // 3) Upsert con onConflict en STRING
        const { error } = await supabase
          .from("horasrecurso")
          .upsert(rows, { onConflict: "recurso_id,proyecto_id,anio,mes" });
        if (error) throw error;
      }

      // 4) Si cambiaste de proyecto al editar, elimina registros viejos (solo si hubo nuevas horas)
      if (
        !isCreating &&
        oldProyectoId != null &&
        Number(oldProyectoId) !== newProyectoId &&
        rows.length > 0
      ) {
        const { error: delErr } = await supabase
          .from("horasrecurso")
          .delete()
          .eq("recurso_id", recursoId)
          .eq("proyecto_id", oldProyectoId)
          .in(
            "mes",
            meses.map((m) => m.mes)
          )
          .in(
            "anio",
            meses.map((m) => m.anio)
          );
        if (delErr) throw delErr;
      }

      // 5) Cierra edición/creación
      table.setEditingRow(null);
      table.setCreatingRow?.(null);

      // 6) Actualiza estado local optimista
      const pSel = proyectos.find((x) => Number(x.id) === newProyectoId);
      setData((prev) => {
        const cleaned =
          !isCreating &&
          oldProyectoId != null &&
          Number(oldProyectoId) !== newProyectoId
            ? prev.filter(
                (r) => Number(r.proyecto_id) !== Number(oldProyectoId)
              )
            : prev.slice();

        const base = {
          proyecto_id: newProyectoId,
          nombre: pSel?.nombre ?? values.nombre ?? "",
          tipo: pSel?.tipo ?? "",
          folio: pSel?.folio ?? "",
          ...Object.fromEntries(
            meses.map((_, i) => [`horas_${i}`, values[`horas_${i}`] ?? ""])
          ),
        };

        const idx = cleaned.findIndex(
          (r) => Number(r.proyecto_id) === newProyectoId
        );
        if (idx >= 0) {
          cleaned[idx] = { ...cleaned[idx], ...base };
          return [...cleaned];
        }
        return [base, ...cleaned];
      });

      // 7) Limpia el draft
      setDraftByRowId?.((prev) => {
        const rowId = state.editingRow?.id ?? state.creatingRow?.id;
        if (!rowId) return prev;
        const { [rowId]: _omit, ...rest } = prev;
        return rest;
      });

      // 8) Notifica al padre
      await notifyParent();
    } catch (error) {
      console.error("Error al guardar horas:", error);
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: error?.message || "Revisa la consola para más detalles.",
        ...swalBase,
      });
    }
  };

  const handleDeleteRow = async ({ row }) => {
    const proyectoId = row.original.proyecto_id;
    const nombre = row.original?.nombre ?? "";

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Eliminar asignación",
      html: `¿Eliminar todas las horas de <b>"${nombre}"</b> para este recurso?`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      ...swalBase,
    });
    if (!isConfirmed) return;

    try {
      const { error } = await supabase
        .from("horasrecurso")
        .delete()
        .eq("recurso_id", recursoId)
        .eq("proyecto_id", proyectoId);

      if (error) throw error;

      setData((prev) =>
        prev.filter((r) => Number(r.proyecto_id) !== Number(proyectoId))
      );

      await Swal.fire({
        icon: "success",
        title: "Eliminado",
        toast: true,
        position: "top-end",
        timer: 1400,
        showConfirmButton: false,
        timerProgressBar: true,
        ...swalBase,
      });

      await notifyParent();
    } catch (error) {
      console.error("Error al eliminar fila:", error);
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: error?.message || "Intenta de nuevo.",
        ...swalBase,
      });
    }
  };

  const table = useMaterialReactTable({
    columns,
    data,
    editingMode: "row",
    enableEditing: true,
    enableRowEditing: true,
    editDisplayMode: "row",
    createDisplayMode: "row",

    // barras / toggles
    enableTopToolbar: true,
    enableBottomToolbar: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,

    localization: MRT_Localization_ES,
    initialState: { columnVisibility: { proyecto_id: false } },
    getRowId: (row) =>
      typeof row.proyecto_id === "number" || typeof row.proyecto_id === "string"
        ? row.proyecto_id
        : `tmp-${Math.random()}`,
    muiEditRowModalProps: { open: false },
    onEditingRowSave: (props) => handleSaveRow(props),
    onCreatingRowSave: (props) => handleSaveRow(props),

    // compacto
    muiTableProps: {
      size: "small",
      sx: {
        "& .MuiTableCell-root": { py: 0.25, px: 0.75 },
        "& thead .MuiTableCell-root": { py: 0.5, fontSize: "0.78rem" },
        "& tbody .MuiTableCell-root": { fontSize: "0.78rem", lineHeight: 1.15 },
        "& .MuiTableRow-root": { height: 28 },
        "& .MuiIconButton-root": { padding: 0.25 },
        "& .MuiCheckbox-root": { padding: 0.25 },
      },
    },
    muiTableContainerProps: { sx: { overflowX: "auto" } },

    displayColumnDefOptions: {
      "mrt-row-select": {
        size: 0,
        enableHiding: false,
        visibleInShowHideMenu: false,
        header: "",
      },
    },

    renderRowActions: ({ row, table }) => (
      <>
        <IconButton
          size="small"
          color="primary"
          onClick={() => table.setEditingRow(row)}
          sx={{ mr: 0.5 }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => handleDeleteRow({ row })}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </>
    ),

    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        size="small"
        onClick={() => {
          const nuevaFila = {
            recurso_id: recursoId,
            proyecto_id: null,
            nombre: "",
            tipo: "",
            folio: "",
            horas_0: "",
            horas_1: "",
            horas_2: "",
          };
          table.setCreatingRow(createRow(table, nuevaFila));
        }}
        variant="contained"
        sx={{ py: 0.5, px: 1.25 }}
      >
        Agregar Proyecto/Mtto
      </Button>
    ),

    onEditingRowCancel: () => {
      const rowId =
        table.getState().editingRow?.id ?? table.getState().creatingRow?.id;
      setDraftByRowId((prev) => {
        if (!rowId) return prev;
        const { [rowId]: _, ...rest } = prev;
        return rest;
      });
    },

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

    muiTableBodyCellProps: {
      sx: {
        color: "#e0e0e0",
        backgroundColor: "#0e111b",
        borderColor: "#2c2c2cff",
        py: 0.25,
        px: 0.75,
        fontSize: "0.78rem",
        lineHeight: 1.15,
        whiteSpace: "nowrap",
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
  });

  if (loading) return <Typography>Cargando datos...</Typography>;

  return <MaterialReactTable table={table} />;
};

export default HorasRecurso;
