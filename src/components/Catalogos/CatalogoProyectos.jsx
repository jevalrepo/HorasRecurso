import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import {
  MaterialReactTable,
  useMaterialReactTable,
  createRow,
} from "material-react-table";
import { MRT_Localization_ES } from "material-react-table/locales/es";

import { supabase } from "../../lib/supabaseClient";

// 🔔 SweetAlert2
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

const swalBase = {
  background: "#0e111b",
  color: "#fff",
  confirmButtonColor: "#7C4DFF",
  cancelButtonColor: "#424a64",
};

const CatalogoProyectos = ({ open, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // errores de validación por campo
  const [validationErrors, setValidationErrors] = useState({}); // { nombre?: string, folio?: string }
  const setFieldError = (key, msg) =>
    setValidationErrors((prev) => {
      const next = { ...prev };
      if (msg) next[key] = msg;
      else delete next[key];
      return next;
    });
  const validateRow = (values) => {
    let ok = true;
    if (!values?.nombre?.trim()) {
      setFieldError("nombre", "El nombre es obligatorio.");
      ok = false;
    } else setFieldError("nombre", undefined);
    return ok;
  };

  // cargar proyectos cada que se abre el modal
  useEffect(() => {
    const fetchProyectos = async () => {
      if (!open) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre, tipo, folio")
        .order("nombre", { ascending: true });
      if (error) {
        console.error("Error al cargar proyectos:", error);
        setRows([]);
        await Swal.fire({
          icon: "error",
          title: "No se pudieron cargar",
          text: error.message || "Intenta de nuevo.",
          ...swalBase,
        });
      } else {
        setRows(data || []);
      }
      setLoading(false);
    };
    fetchProyectos();
  }, [open]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "nombre",
        header: "Nombre",
        size: 480,
        muiTableBodyCellEditTextFieldProps: {
          required: true,
          inputProps: { maxLength: 200 },
          error: !!validationErrors.nombre,
          helperText: validationErrors.nombre,
          onBlur: (e) =>
            setFieldError(
              "nombre",
              e.target.value.trim() ? undefined : "El nombre es obligatorio."
            ),
        },
      },
      {
        accessorKey: "tipo",
        header: "Tipo",
        size: 120,
        editVariant: "select",
        editSelectOptions: ["Proyecto", "Mtto"].map((v) => ({
          value: v,
          text: v,
        })),
        muiTableBodyCellProps: { align: "center" },
      },
      {
        accessorKey: "folio",
        header: "Folio",
        size: 140,
        muiTableBodyCellProps: { align: "center" },
      },
    ],
    [validationErrors]
  );

  // Crear
  const handleCreate = async ({ values, table }) => {
    if (!validateRow(values)) return;
    try {
      const payload = {
        nombre: values.nombre.trim(),
        tipo: values.tipo || null,
        folio: values.folio || null,
      };
      const { data, error } = await supabase
        .from("proyectos")
        .insert(payload)
        .select("id, nombre, tipo, folio")
        .single();
      if (error) throw error;

      setRows((prev) => [data, ...prev]);
      setValidationErrors({});
      table.setCreatingRow(null);

      // ✅ toast de éxito
      await Swal.fire({
        icon: "success",
        title: "Proyecto creado",
        timer: 1300,
        showConfirmButton: false,
        ...swalBase,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo crear",
        text: e.message || "Intenta de nuevo.",
        ...swalBase,
      });
    }
  };

  // Editar
  const handleSaveEdit = async ({ values, table, row }) => {
    if (!validateRow(values)) return;
    try {
      const id = row.original.id;
      const payload = {
        nombre: values.nombre.trim(),
        tipo: values.tipo || null,
        folio: values.folio || null,
      };
      const { error } = await supabase
        .from("proyectos")
        .update(payload)
        .eq("id", id);
      if (error) throw error;

      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...payload } : r))
      );
      setValidationErrors({});
      table.setEditingRow(null);

      await Swal.fire({
        icon: "success",
        title: "Cambios guardados",
        timer: 1200,
        showConfirmButton: false,
        ...swalBase,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: e.message || "Intenta de nuevo.",
        ...swalBase,
      });
    }
  };

  // Eliminar (con confirm bonito y manejo de FK)
  const handleDelete = async (row) => {
    const id = row.original.id;
    const nombre = row.original.nombre;

    const { isConfirmed } = await Swal.fire({
      icon: "warning",
      title: "Eliminar proyecto",
      html: `¿Eliminar <b>"${nombre}"</b>? Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      ...swalBase,
    });
    if (!isConfirmed) return;

    const { error } = await supabase.from("proyectos").delete().eq("id", id);
    if (error) {
      const friendly = /foreign key/i.test(error.message)
        ? 'Este proyecto tiene horas asociadas en "horasrecurso". Elimina o reasigna esas horas primero.'
        : error.message;
      await Swal.fire({
        icon: "error",
        title: "No se pudo eliminar",
        text: friendly,
        ...swalBase,
      });
      return;
    }

    setRows((prev) => prev.filter((r) => r.id !== id));
    await Swal.fire({
      icon: "success",
      title: "Proyecto eliminado",
      timer: 1100,
      showConfirmButton: false,
      ...swalBase,
    });
  };

  const table = useMaterialReactTable({
  columns,
  data: rows,
  state: { isLoading: loading },
  localization: MRT_Localization_ES,

  layoutMode: "grid",
  editingMode: "row",
  editDisplayMode: "row",
  createDisplayMode: "row",
  enableEditing: true,
  enableColumnResizing: false,
  enableStickyHeader: true,
  enableTopToolbar: true,
  enableBottomToolbar: true,
  initialState: {
    density: "compact", // ya lo tenías, lo mantenemos
    columnOrder: ["mrt-row-actions", "nombre", "tipo", "folio"],
  },

  enableColumnActions: false,
  enableColumnFilters: false,
  enableDensityToggle: false,
  enableFullScreenToggle: false,
  enableHiding: false,
  positionToolbarAlertBanner: "bottom",

  getRowId: (row) => String(row.id ?? `tmp-${Math.random()}`),

  onCreatingRowSave: handleCreate,
  onEditingRowSave: handleSaveEdit,
  onCreatingRowCancel: () => setValidationErrors({}),
  onEditingRowCancel: () => setValidationErrors({}),

  enableRowActions: true,
  displayColumnDefOptions: {
    "mrt-row-actions": { header: "Acciones", size: 96 },
  },

  // ==== 👇 COMPACTO ====
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
        onClick={() => handleDelete(row)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  ),

  renderTopToolbarCustomActions: ({ table }) => (
    <Button
      size="small"
      variant="contained"
      onClick={() =>
        table.setCreatingRow(
          createRow(table, { nombre: "", tipo: "Mtto", folio: "" })
        )
      }
      sx={{ py: 0.5, px: 1.25 }}
    >
      Crear proyecto
    </Button>
  ),

  renderToolbarAlertBannerContent: () =>
    Object.keys(validationErrors).length ? (
      <div style={{ padding: 8, color: "#fff" }}>
        Corrige los errores antes de guardar.
      </div>
    ) : null,

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
      "& .Mui-TableHeadCell-Content": { overflow: "visible" },
    },
  },

  muiTableBodyCellProps: {
    sx: {
      color: "#e0e0e0",
      backgroundColor: "#0e111b",
      borderColor: "#2c2c2cff",
      py: 0.25, // compacto
      px: 0.75, // compacto
      fontSize: "0.78rem",
      lineHeight: 1.15,
      whiteSpace: "nowrap",
    },
  },

  muiTableContainerProps: {
    sx: { overflowX: "auto", maxHeight: { xs: "55vh", md: "60vh" } },
  },
});


  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          backgroundColor: "#0e111b",
          borderRadius: 2,
          width: { xs: "95vw", sm: "85vw", md: 900 },
          maxWidth: "95vw",
          maxHeight: "80vh",
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "#2b3146",
          borderBottom: "1px solid #444",
          py: 1.25,
        }}
      >
        Catálogo de Proyectos
        <IconButton onClick={onClose} size="small" sx={{ color: "#fff" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        dividers={false}
        sx={{ p: 0, pl: 0, maxHeight: "calc(80vh - 64px)", overflow: "auto" }}
      >
        <MaterialReactTable table={table} />
      </DialogContent>
    </Dialog>
  );
};

export default CatalogoProyectos;
