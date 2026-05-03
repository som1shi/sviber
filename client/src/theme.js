import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1a1a1a',
    },
    secondary: {
      main: '#f5f5f0',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h3: { fontFamily: '"DM Serif Display", Georgia, serif', fontWeight: 400, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          padding: '10px 24px',
          fontSize: '0.95rem',
        },
        containedPrimary: {
          backgroundColor: '#1a1a1a',
          '&:hover': {
            backgroundColor: '#333',
          },
        },
        outlinedPrimary: {
          borderColor: '#1a1a1a',
          color: '#1a1a1a',
          '&:hover': {
            borderColor: '#333',
            backgroundColor: 'rgba(0,0,0,0.04)',
          },
        },
      },
    },

        MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: 'inherit',
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: 'inherit',
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: 'none',
          border: '1px solid #e5e7eb',
        },
      },
    },
  },
});

export default theme;
