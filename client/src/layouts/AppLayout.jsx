import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar, { DRAWER_WIDTH } from '../components/Sidebar';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isChat = pathname === '/app/matches' || pathname === '/app/community';

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
          overflow: isChat ? 'hidden' : 'auto',
          overflowY: isChat ? 'hidden' : 'scroll',
          height: '100vh',
          p: isChat ? 0 : 4,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
