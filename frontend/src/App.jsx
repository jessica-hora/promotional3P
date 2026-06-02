import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import HomeIcon from '@mui/icons-material/Home';
import HistoryIcon from '@mui/icons-material/History';
import OptimizationPage from './pages/OptimizationPage';
import HistoryPage from './pages/HistoryPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#EC5A10',
      light: '#F07D38',
      dark: '#BF4709',
    },
    secondary: {
      main: '#0047BA',
      light: '#4B7ACF',
      dark: '#003087',
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2C2C2C',
      secondary: '#666666',
    },
    success: {
      main: '#2FCC71',
    },
    error: {
      main: '#E74C3C',
    },
    warning: {
      main: '#F39C12',
    },
  },
  typography: {
    fontFamily: '"Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", sans-serif',
    h4: {
      fontWeight: 600,
      color: '#EC5A10',
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#2C2C2C',
          borderBottom: '2px solid #EC5A10',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E5E5E5',
          width: 280,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(236, 90, 16, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#EC5A10',
            },
          },
        },
      },
    },
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { label: 'Otimizador', icon: HomeIcon, path: '/' },
    { label: 'Histórico', icon: HistoryIcon, path: '/history' },
  ];

  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex', height: '100vh' }}>
          {/* AppBar */}
          <AppBar position="fixed" sx={{ width: '100%' }}>
            <Toolbar sx={{ pl: 3, pr: 3 }}>
              <Box sx={{ fontSize: 24, mr: 2 }}>📊</Box>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#EC5A10' }}>
                Otimizador de Campanhas Promocionais 3P
              </Typography>
              <Typography variant="caption" sx={{ color: '#999' }}>
                v1.0 MVP
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Sidebar Navigation */}
          <Drawer
            anchor="left"
            open={drawerOpen || window.innerWidth > 960}
            onClose={() => setDrawerOpen(false)}
            variant="permanent"
          >
            <Box sx={{ pt: 10, width: 280 }}>
              <List>
                {menuItems.map((item) => (
                  <ListItem
                    button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    onClick={() => setDrawerOpen(false)}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(236, 90, 16, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <item.icon sx={{ color: '#EC5A10' }} />
                    </ListItemIcon>
                    <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { fontWeight: 500 } }} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Drawer>

          {/* Main Content */}
          <Box
            sx={{
              flexGrow: 1,
              mt: 8,
              ml: { xs: 0, md: 35 },
              p: 3,
              overflow: 'auto',
              backgroundColor: '#F8F9FA',
              minHeight: '100vh',
            }}
          >
            <Switch>
              <Route exact path="/" component={OptimizationPage} />
              <Route path="/history" component={HistoryPage} />
            </Switch>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
