import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  Favorite as FavoriteIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  PersonOutlined as PersonOutlineIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 240;

const mainNavItems = [
  { label: 'Swipe', icon: <SwapHorizIcon />, path: '/app/swipe' },
  { label: 'Matches', icon: <FavoriteIcon />, path: '/app/matches' },
  { label: 'Community', icon: <RadioButtonUncheckedIcon />, path: '/app/community' },
  { label: 'Projects', icon: <CheckBoxOutlineBlankIcon />, path: '/app/projects' },
  { label: 'User Profile', icon: <PersonOutlineIcon />, path: '/app/profile' },
];

const bottomNavItems = [
  { label: 'Settings', icon: <SettingsIcon />, path: '/app/settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: '1px solid #e5e7eb',
          backgroundColor: '#f5f5f0',
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#1a1a1a',
          }}
        />
        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.2rem' }}>
          sviber
        </Typography>
      </Box>

      {/* Main nav */}
      <List sx={{ px: 1, flexGrow: 1 }}>
        {mainNavItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0,0,0,0.08)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.12)' },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#1a1a1a' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Divider + Settings */}
      <Divider sx={{ mx: 2 }} />
      <List sx={{ px: 1, pb: 2 }}>
        {bottomNavItems.map((item) => (
          <ListItem key={item.label} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                borderRadius: 2,
                '&.Mui-selected': {
                  backgroundColor: 'rgba(0,0,0,0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: '#1a1a1a' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export { DRAWER_WIDTH };
