// src/theme/darkTheme.js
import { createTheme } from '@mui/material/styles';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0e111b', // fondo general oscuro
      paper: '#0e111b',   // fondo de tarjetas y contenedores
    },
    text: {
      primary: '#e0e0e0',     // texto principal
      secondary: '#e2d7eeff',   // texto secundario (acentos violetas)
    },
    primary: {
      main: '#a04cfaff',        // acento principal
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a18aba',
    },
    divider: '#2c2c2c',
  },
  typography: {
    fontFamily: '"Quicksand", "Roboto Condensed", sans-serif',
    fontSize: 14,
    h6: {
      fontWeight: 700,
      color: '#a18aba',
    },
    body2: {
      color: '#cfcfcf',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#2c2c2c',
          color: '#e0e0e0',
        },
        head: {
          backgroundColor: '#1a1a1a',
          color: '#a18aba',
          fontWeight: 'bold',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: '#181818',
          },
          '&:hover': {
            backgroundColor: '#222222',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#e0e0e0',
        },
      },
    },
  },
});

export default darkTheme;
