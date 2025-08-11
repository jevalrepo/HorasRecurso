// src/theme/lightTheme.js
import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: '#f4f0fa', // fondo general
      paper: '#ffffff',   // fondo de tarjetas y contenedores
    },
    text: {
      primary: '#1a1a1a',     // texto principal
      secondary: '#5a4a7d',   // texto secundario
    },
    primary: {
      main: '#7925d3',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#a18aba',
    },
    divider: '#d4cce2',
  },
  typography: {
    fontFamily: '"Quicksand", "Roboto Condensed", sans-serif',
    fontSize: 14,
    h6: {
      fontWeight: 700,
      color: '#5a4a7d',
    },
    body2: {
      color: '#4a3b66',
    },
  },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: '#d4cce2',
          color: '#1a1a1a',
        },
        head: {
          backgroundColor: '#ece6f4',
          color: '#5a4a7d',
          fontWeight: 'bold',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(even)': {
            backgroundColor: '#f7f3fc',
          },
          '&:hover': {
            backgroundColor: '#e6ddf5',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
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
          color: '#1a1a1a',
        },
      },
    },
  },
});

export default lightTheme;
