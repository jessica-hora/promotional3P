import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, createTheme, ThemeProvider } from '@maas-components/core';
import { Home as HomeIcon, History as HistoryIcon } from '@maas-components/core';
import OptimizationPage from './pages/OptimizationPage';
import HistoryPage from './pages/HistoryPage';

const theme = createTheme({
  palette: {
    type: 'dark',
    primary: {
      main: '#06b6d4',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  overrides: {
    MuiAppBar: {
      root: {
        backgroundColor: '#1e293b',
        borderBottom: '1px solid #334155',
      },
    },
    MuiDrawer: {
      paper: {
        backgroundColor: '#1e293b',
        borderRight: '1px solid #334155',
        width: 240,
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
          <AppBar position="fixed">
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
                🎯 Otimizador de Campanhas 3P
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
            <Box sx={{ pt: 8, width: 240 }}>
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
                        backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <item.icon sx={{ color: '#06b6d4' }} />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
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
              ml: { xs: 0, sm: 30 },
              p: 3,
              overflow: 'auto',
              backgroundColor: '#0f172a',
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
