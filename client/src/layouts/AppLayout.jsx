import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from '../components/Sidebar';

export default function AppLayout() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          width: `calc(100vw - ${DRAWER_WIDTH}px)`,
          ml: `${DRAWER_WIDTH}px`,
          backgroundColor: '#F2F2F2',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          height: '100vh',
          p: 0,
          m: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
