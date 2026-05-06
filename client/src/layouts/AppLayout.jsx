import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from '../components/Sidebar';

export default function AppLayout() {
  const { pathname } = useLocation();
  const isChat = pathname.startsWith('/app/matches/') || pathname === '/app/community';

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          backgroundColor: '#F2F2F2',
          display: 'flex',
          flexDirection: 'column',
          overflow: isChat ? 'hidden' : 'auto',
          height: '100vh',
          p: isChat ? 0 : 4,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
