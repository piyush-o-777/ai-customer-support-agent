import { PaletteMode } from '@mui/material';
import { createTheme, Theme } from '@mui/material/styles';

export const getAppTheme = (mode: PaletteMode): Theme => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#60a5fa' : '#2563eb',
        light: isDark ? '#93c5fd' : '#3b82f6',
        dark: isDark ? '#3b82f6' : '#1d4ed8',
      },
      secondary: {
        main: isDark ? '#a78bfa' : '#7c3aed',
      },
      background: {
        default: isDark ? '#0b1120' : '#f1f5f9',
        paper: isDark ? '#111827' : '#ffffff',
      },
      text: {
        primary: isDark ? '#f8fafc' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#475569',
      },
      divider: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(15, 23, 42, 0.1)',
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*:focus-visible': {
            outline: `2px solid ${isDark ? '#60a5fa' : '#2563eb'}`,
            outlineOffset: '2px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
    },
  });
};
