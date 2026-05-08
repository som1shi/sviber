import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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
  LinearProgress,
} from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  Favorite as FavoriteIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  PersonOutlined as PersonOutlineIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

export const DRAWER_WIDTH = 240;

const mainNavItems = [
  { label: 'Swipe',        icon: <SwapHorizIcon sx={{ fontSize: 18 }} />,            path: '/app/swipe' },
  { label: 'Matches',      icon: <FavoriteIcon sx={{ fontSize: 18 }} />,              path: '/app/matches' },
  { label: 'Community',    icon: <RadioButtonUncheckedIcon sx={{ fontSize: 18 }} />,  path: '/app/community' },
  { label: 'Projects',     icon: <CheckBoxOutlineBlankIcon sx={{ fontSize: 18 }} />,  path: '/app/projects' },
  { label: 'User Profile', icon: <PersonOutlineIcon sx={{ fontSize: 18 }} />,         path: '/app/profile' },
];

const INACTIVE = 'rgba(255,255,255,0.45)';
const ACTIVE   = '#FFFFFF';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const API = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/projects`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setProjects(Array.isArray(data) ? data : []);
      } catch {
        // Keep sidebar resilient if projects request fails.
      }
    })();
    return () => { alive = false; };
  }, [API]);

  const buildProgress = useMemo(() => {
    if (!projects.length) return 0;

    const projectScores = projects.map((p) => {
      let score = 0;
      const tasks = Array.isArray(p.tasks) ? p.tasks : [];
      const doneTasks = tasks.filter((t) => t?.status === 'done').length;
      const taskRatio = tasks.length ? (doneTasks / tasks.length) : 0;
      const contributors = Array.isArray(p.contributors) ? p.contributors.length : 0;
      const daysSinceUpdate = Math.max(0, (Date.now() - new Date(p.updatedAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24));
      const planning = p.planning || {};
      const planningFields = [
        planning.problem,
        planning.targetUser,
        planning.mvpScope,
        planning.successMetric,
        planning.launchGoal,
        planning.risks,
      ].filter((x) => String(x || '').trim()).length;

      // Project setup completeness.
      if (String(p.name || '').trim()) score += 8;
      if (String(p.description || '').trim()) score += 10;
      if ((p.tags || []).length) score += 8;
      if (String(p.projectUrl || '').trim()) score += 8;
      if (String(p.imageUrl || '').trim()) score += 8;
      score += Math.round((planningFields / 6) * 14);
      score += Math.min(8, ((planning.checklistDone || []).length || 0) * 1.5);

      // Workflow signals.
      if (p.publishedToCommunity || p.idea) score += 12;
      if (contributors > 1) score += 12;
      score += Math.round(taskRatio * 24);

      // Status & recency signals.
      if (p.status === 'completed') score += 10;
      else if (p.status === 'active') score += 6;
      else if (p.status === 'paused') score += 3;

      if (daysSinceUpdate <= 7) score += 10;
      else if (daysSinceUpdate <= 30) score += 6;
      else if (daysSinceUpdate <= 60) score += 2;

      return Math.min(100, Math.max(0, score));
    });

    const avg = projectScores.reduce((sum, s) => sum + s, 0) / projectScores.length;
    return Math.round(avg);
  }, [projects]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 'none',
          backgroundColor: '#111111',
          display: 'flex',
          flexDirection: 'column',
          // High-specificity overrides so MUI theme cannot win
          '& .MuiListItemIcon-root': { color: INACTIVE },
          '& .MuiListItemText-primary': { color: INACTIVE },
          '& .MuiSvgIcon-root': { color: 'inherit' },
          '& .MuiListItemButton-root.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.08)',
            '& .MuiListItemIcon-root': { color: ACTIVE },
            '& .MuiListItemText-primary': { color: ACTIVE, fontWeight: 600 },
          },
          '& .MuiListItemButton-root:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
          },
          '& .MuiListItemButton-root.Mui-selected:hover': {
            backgroundColor: 'rgba(255,255,255,0.12)',
          },
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2.5, pt: 3, pb: 2.5 }}>
        <Typography
          sx={{
            fontFamily: '"DM Sans", sans-serif',
            fontWeight: 700,
            fontSize: '1.2rem',
            color: '#FFFFFF',
            letterSpacing: '-0.02em',
          }}
        >
          sviber
        </Typography>
      </Box>

      {/* Main nav */}
      <List sx={{ px: 1.5, flexGrow: 1, pt: 0 }}>
        {mainNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.label} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={active}
                sx={{ borderRadius: 1.5, py: 0.85, px: 1.25 }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontFamily: '"DM Sans", sans-serif',
                    fontSize: '0.88rem',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Divider + Settings */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />
      <List sx={{ px: 1.5, pt: 1 }}>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => navigate('/app/settings')}
            selected={location.pathname === '/app/settings'}
            sx={{ borderRadius: 1.5, py: 0.85, px: 1.25 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <SettingsIcon sx={{ fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Settings"
              primaryTypographyProps={{
                fontFamily: '"DM Sans", sans-serif',
                fontSize: '0.88rem',
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Build Progress */}
      <Box sx={{ px: 2.5, pb: 2.5, pt: 1.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Mono", monospace' }}>
            build progress
          </Typography>
          <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', fontFamily: '"DM Mono", monospace' }}>
            {buildProgress}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={buildProgress}
          sx={{
            height: 3,
            borderRadius: 2,
            backgroundColor: 'rgba(255,255,255,0.08)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#7C5CFC',
              borderRadius: 2,
            },
          }}
        />
      </Box>
    </Drawer>
  );
}