// src/components/HorasRecurso.jsx
import { createRow } from "material-react-table";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

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
  const [draftByRowId, setDraftByRowId] = useState({});

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

  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/proyectos`);
        if (!res.ok) throw new Error(res.statusText);
        setProyectos(await res.json());
      } catch (e) {
        console.error("Error al cargar proyectos:", e);
      }
    };
    fetchProyectos();
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "proyecto_id",
        header: "ID Proyecto",
        enableEditing: false,
        size: 0,
        Cell: ({ cell }) =>
          proyectos.find((p) => Number(p.id) === Number(cell.getValue()))?.nombre || "",
      },
      {
        accessorKey: "nombre",
        header: "Proyecto",
        enableEditing: true,
        editVariant: "select",
        editSelectOptions: proyectos.map((p) => ({ value: p.nombre, text: p.nombre })),
        muiEditTextFieldProps: ({ table, row }) => ({
          select: true,
          onChange: (e) => {
            const nombreSeleccionado = e.target.value;
            const p = proyectos.find((x) => x.nombre === nombreSeleccionado);
            const state = table.getState();
            const isCreatingThis = state.creatingRow?.id === row.id;
            const isEditingThis = state.editingRow?.id === row.id;
            if (!isCreatingThis && !isEditingThis) return;
            const targetRowState = isCreatingThis ? state.creatingRow : state.editingRow;
            const setTarget = isCreatingThis ? table.setCreatingRow : table.setEditingRow;
            setTarget({ ...targetRowState, values: { ...targetRowState.values, nombre: p?.nombre ?? "", proyecto_id: p ? Number(p.id) : null } });
            setDraftByRowId((prev) => ({ ...prev, [row.id]: { tipo: p?.tipo ?? "", folio: p?.folio ?? "" } }));
          },
        }),
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: "left", sx: { whiteSpace: "normal", backgroundColor: "#0e111b" } },
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        enableEditing: false,
        size: 10,
        Cell: ({ row, cell }) => draftByRowId[row.id]?.tipo ?? cell.getValue() ?? "",
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "normal", backgroundColor: "#0e111b" } },
      },
      {
        accessorKey: "folio",
        header: "Folio",
        enableEditing: false,
        size: 10,
        Cell: ({ row, cell }) => draftByRowId[row.id]?.folio ?? cell.getValue() ?? "",
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "normal", backgroundColor: "#0e111b" } },
      },
      ...meses.map((m, i) => ({
        accessorKey: `horas_${i}`,
        header: `${m.label}`,
        size: 10,
        enableEditing: true,
        muiTableBodyCellEditTextFieldProps: { type: "number" },
        muiTableBodyCellProps: { align: "center", sx: { whiteSpace: "normal", backgroundColor: "#0e111b" } },
      })),
    ],
    [proyectos, meses, draftByRowId]
  );

  useEffect(() => {
    const fetchHoras = async () => {
      if (!recursoId) return;
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/horas-recurso?recurso_id=${recursoId}`);
        if (!res.ok) throw new Error(res.statusText);
        const rawData = await res.json();

        const filtered = rawData.filter((row) =>
          meses.some((m) => m.mes === row.mes && m.anio === row.anio)
        );

        const agrupado = {};
        for (const row of filtered) {
          const key = row.proyecto_id;
          if (!agrupado[key]) {
            agrupado[key] = {
              proyecto_id: key,
              nombre: row.nombre || "",
              tipo: row.tipo || "",
              folio: row.folio || "",
              horas_0: "", horas_1: "", horas_2: "",
            };
          }
          meses.forEach((m, i) => {
            if (row.mes === m.mes && row.anio === m.anio) {
              agrupado[key][`horas_${i}`] = row.horas ?? "";
            }
          });
        }
        setData(Object.values(agrupado));
      } catch (e) {
        console.error("Error al cargar horas:", e);
      } finally {
        setLoading(false);
      }
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
      const oldProyectoId = !isCreating ? state.editingRow?.original?.proyecto_id : null;

      if (values.proyecto_id == null || values.proyecto_id === "" || Number.isNaN(Number(values.proyecto_id))) {
        const nombreSel = state.editingRow?.values?.nombre ?? state.creatingRow?.values?.nombre ?? values.nombre;
        const p = proyectos.find((x) => x.nombre === nombreSel);
        values.proyecto_id = p ? Number(p.id) : null;
      }
      const newProyectoId = Number(values.proyecto_id);

      if (!Number.isFinite(newProyectoId)) {
        await Swal.fire({ icon: "error", title: "Proyecto requerido", text: "Selecciona un proyecto válido antes de guardar.", ...swalBase });
        return;
      }

      const rows = [];
      for (let i = 0; i < meses.length; i++) {
        const val = values[`horas_${i}`];
        if (val === "" || val == null) continue;
        const horasNum = Number(val);
        if (!Number.isFinite(horasNum)) continue;
        rows.push({ recurso_id: recursoId, proyecto_id: newProyectoId, mes: meses[i].mes, anio: meses[i].anio, horas: horasNum });
      }

      if (rows.length) {
        const res = await fetch(`${API_URL}/api/horas-recurso/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rows),
        });
        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
      }

      if (!isCreating && oldProyectoId != null && Number(oldProyectoId) !== newProyectoId && rows.length > 0) {
        const delRes = await fetch(`${API_URL}/api/horas-recurso?recurso_id=${recursoId}&proyecto_id=${oldProyectoId}`, { method: "DELETE" });
        if (!delRes.ok) throw new Error((await delRes.json()).error || delRes.statusText);
      }

      table.setEditingRow(null);
      table.setCreatingRow?.(null);

      const pSel = proyectos.find((x) => Number(x.id) === newProyectoId);
      setData((prev) => {
        const cleaned = !isCreating && oldProyectoId != null && Number(oldProyectoId) !== newProyectoId
          ? prev.filter((r) => Number(r.proyecto_id) !== Number(oldProyectoId))
          : prev.slice();
        const base = {
          proyecto_id: newProyectoId,
          nombre: pSel?.nombre ?? values.nombre ?? "",
          tipo: pSel?.tipo ?? "",
          folio: pSel?.folio ?? "",
          ...Object.fromEntries(meses.map((_, i) => [`horas_${i}`, values[`horas_${i}`] ?? ""])),
        };
        const idx = cleaned.findIndex((r) => Number(r.proyecto_id) === newProyectoId);
        if (idx >= 0) { cleaned[idx] = { ...cleaned[idx], ...base }; return [...cleaned]; }
        return [base, ...cleaned];
      });

      setDraftByRowId?.((prev) => {
        const rowId = state.editingRow?.id ?? state.creatingRow?.id;
        if (!rowId) return prev;
        const { [rowId]: _omit, ...rest } = prev;
        return rest;
      });

      await notifyParent();
    } catch (error) {
      console.error("Error al guardar horas:", error);
      await Swal.fire({ icon: "error", title: "No se pudo guardar", text: error?.message || "Revisa la consola.", ...swalBase });
    }
  };

  const handleDeleteRow = async ({ row }) => {
    const proyectoId = row.original.proyecto_id;
    const nombre = row.original?.nombre ?? "";

    const { isConfirmed } = await Swal.fire({
      icon: "warning", title: "Eliminar asignación",
      html: `¿Eliminar todas las horas de <b>"${nombre}"</b> para este recurso?`,
      showCancelButton: true, confirmButtonText: "Sí, eliminar", cancelButtonText: "Cancelar", reverseButtons: true, ...swalBase,
    });
    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_URL}/api/horas-recurso?recurso_id=${recursoId}&proyecto_id=${proyectoId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error || res.statusText);

      setData((prev) => prev.filter((r) => Number(r.proyecto_id) !== Number(proyectoId)));
      await Swal.fire({ icon: "success", title: "Eliminado", toast: true, position: "top-end", timer: 1400, showConfirmButton: false, timerProgressBar: true, ...swalBase });
      await notifyParent();
    } catch (error) {
      console.error("Error al eliminar fila:", error);
      await Swal.fire({ icon: "error", title: "No se pudo eliminar", text: error?.message || "Intenta de nuevo.", ...swalBase });
    }
  };

  const table = useMaterialReactTable({
    columns, data,
    editingMode: "row", enableEditing: true, enableRowEditing: true,
    editDisplayMode: "row", createDisplayMode: "row",
    enableTopToolbar: true, enableBottomToolbar: false,
    enableColumnActions: false, enableColumnFilters: false,
    enableDensityToggle: false, enableFullScreenToggle: false, enableHiding: false,
    localization: MRT_Localization_ES,
    initialState: { columnVisibility: { proyecto_id: false } },
    getRowId: (row) => typeof row.proyecto_id === "number" || typeof row.proyecto_id === "string" ? row.proyecto_id : `tmp-${Math.random()}`,
    muiEditRowModalProps: { open: false },
    onEditingRowSave: (props) => handleSaveRow(props),
    onCreatingRowSave: (props) => handleSaveRow(props),
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
    displayColumnDefOptions: { "mrt-row-select": { size: 0, enableHiding: false, visibleInShowHideMenu: false, header: "" } },
    renderRowActions: ({ row, table }) => (
      <>
        <IconButton size="small" color="primary" onClick={() => table.setEditingRow(row)} sx={{ mr: 0.5 }}>
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" color="error" onClick={() => handleDeleteRow({ row })}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Button size="small"
        onClick={() => table.setCreatingRow(createRow(table, { recurso_id: recursoId, proyecto_id: null, nombre: "", tipo: "", folio: "", horas_0: "", horas_1: "", horas_2: "" }))}
        variant="contained" sx={{ py: 0.5, px: 1.25 }}>
        Agregar Proyecto/Mtto
      </Button>
    ),
    onEditingRowCancel: () => {
      const rowId = table.getState().editingRow?.id ?? table.getState().creatingRow?.id;
      setDraftByRowId((prev) => { if (!rowId) return prev; const { [rowId]: _, ...rest } = prev; return rest; });
    },
    positionToolbarAlertBanner: "bottom",
    muiTopToolbarProps: { sx: { backgroundColor: "#0e111b", color: "#ffffff", borderBottom: "1px solid #444", fontWeight: "bold", fontSize: "0.8rem", minHeight: 36, "& .MuiInputBase-root": { fontSize: "0.8rem" }, "& .MuiIconButton-root": { padding: 0.25 } } },
    muiTableBodyCellProps: { sx: { color: "#e0e0e0", backgroundColor: "#0e111b", borderColor: "#2c2c2cff", py: 0.25, px: 0.75, fontSize: "0.78rem", lineHeight: 1.15, whiteSpace: "nowrap" } },
    muiTableHeadCellProps: { align: "center", sx: { backgroundColor: "#21283dff", color: "#ffffff", fontWeight: "bold", borderColor: "#2c2c2c", py: 0.5, px: 0.75, fontSize: "0.78rem", lineHeight: 1.1, whiteSpace: "nowrap" } },
    muiBottomToolbarProps: { sx: { backgroundColor: "#0e111b", color: "#ffffff", borderTop: "1px solid #444", fontWeight: "bold", fontSize: "0.8rem", minHeight: 36, justifyContent: "center" } },
    muiSelectCheckboxProps: { size: "small" },
  });

  if (loading) return <Typography>Cargando datos...</Typography>;

  return <MaterialReactTable table={table} />;
};

export default HorasRecurso;
