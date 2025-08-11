import { MRT_Localization_ES } from 'material-react-table/locales/es';

export const getBaseTableConfig = {
  muiTableContainerProps: {
    sx: { overflowX: "auto" },
  },
  displayColumnDefOptions: {
    "mrt-row-select": {
      size: 0,
      enableHiding: false,
      visibleInShowHideMenu: false,
      header: "",
    },
  },
  muiTableBodyRowProps: ({ row }) => ({
    onClick: row.getToggleSelectedHandler(),
    sx: {
      cursor: "pointer",
      backgroundColor: "#0e111b",
      "&:nth-of-type(even)": { backgroundColor: "#0e111b" },
      "&.Mui-selected": { backgroundColor: "#21283dff" },
      "&.Mui-selected:hover": { backgroundColor: "#5d5f74ff" },
      "&:hover": { backgroundColor: "#5d5f74ff" },
    },
  }),
  muiSelectCheckboxProps: {
    sx: {
      color: "#5d5f74ff",
      "&.Mui-checked": { color: "#ebd6d6ff" },
    },
  },
  muiTopToolbarProps: {
    sx: {
      backgroundColor: "#0e111b",
      color: "#ffffff",
      borderBottom: "1px solid #444",
      fontWeight: "bold",
      fontSize: "0.9rem",
    },
  },
  muiTableBodyCellProps: {
    sx: {
      color: "#e0e0e0",
      borderColor: "#2c2c2cff",
      py: 0.5,
      fontSize: "0.85rem",
    },
  },
  muiTableHeadCellProps: {
    sx: {
      backgroundColor: "#21283dff",
      color: "#ffffff",
      fontWeight: "bold",
      borderColor: "#2c2c2c",
    },
  },
  muiBottomToolbarProps: {
    sx: {
      backgroundColor: "#0e111b",
      color: "#ffffff",
      borderTop: "1px solid #444",
      fontWeight: "bold",
      fontSize: "0.9rem",
      justifyContent: "center",
    },
  },
};
