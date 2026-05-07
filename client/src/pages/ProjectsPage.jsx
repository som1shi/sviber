import { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Avatar,
  AvatarGroup,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const stats = [
  { label: 'Active', value: 2, sub: '+1 this week', subColor: '#16a34a' },
  { label: 'Shipped', value: 0, sub: null },
  { label: 'Commits', value: 189, sub: '+45 this week', subColor: '#16a34a' },
  { label: 'Co-founders', value: 2, sub: 'across all builds', subColor: '#6b7280' },
  { label: 'ELO Impact', value: '-10', sub: 'this week', subColor: '#dc2626' },
];

const tabs = ['All', 'Active', 'Shipping', 'Live', 'Paused', 'Archived'];
const tabCounts = { All: 2, Active: 2, Shipping: 1, Live: 1, Archived: 28 };

const projects = [
  {
    id: 1,
    tag: 'Consumer',
    title: 'Two Man Searcher',
    description: 'Stop pulling up solo. Two-Man matches you with a partner for the next run, every time.',
    avatars: ['DI', 'SS'],
    cofounder: 'Sarvagya S.',
    live: true,
    metric: { label: 'Users This Week', value: 72, suffix: '+150' },
    footer: ['45 days live', '15 orders'],
    featured: true,
  },
  {
    id: 2,
    tag: 'Consumer',
    title: 'Malatang Optimizer',
    description: 'Stop overpaying for soggy lotus root. Our malatang optimizer ranks every ingredient by flavor-per-gram and builds the bowl you actually wanted.',
    avatars: ['DI', 'SK'],
    cofounder: 'Sun Min K.',
    live: false,
    metric: { label: 'Build Progress', value: 36, suffix: '36%' },
    footer: ['12 days in', '15 commits', 'last 3h ago'],
    featured: false,
  },
];

const avatarColors = {
  DI: { bg: '#d1d5db', fg: '#374151' },
  SS: { bg: '#bbf7d0', fg: '#15803d' },
  SK: { bg: '#bfdbfe', fg: '#1d4ed8' },
};

export default function ProjectsPage() {
  const API = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Projects
      </Typography>
      <Typography sx={{ color: '#6b7280', fontSize: '0.875rem', mb: 3 }}>
        2 active builds &nbsp;•&nbsp; 1 shipped this season &nbsp;•&nbsp; streak 6 days
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        {stats.map((stat) => (
          <Box key={stat.label}>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>
              {stat.value}
            </Typography>
            {stat.sub && (
              <Typography sx={{ fontSize: '0.75rem', color: stat.subColor }}>
                {stat.sub}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto', px: 1.5 },
          '& .MuiTabs-indicator': { backgroundColor: '#1a1a1a' },
          '& .Mui-selected': { color: '#1a1a1a !important' },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {tab}
                {tabCounts[tab] !== undefined && (
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}
                  >
                    {tabCounts[tab]}
                  </Typography>
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Cards grid */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {projects.map((project) => (
          <Paper
            key={project.id}
            elevation={0}
            sx={{
              width: 260,
              border: '1px solid #e5e7eb',
              borderRadius: 3,
              p: 2.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              position: 'relative',
              backgroundColor: '#fafaf8',
            }}
          >
            {/* LIVE badge */}
            {project.live && (
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: '#4ade80',
                  color: '#14532d',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            )}

            {/* Tag */}
            <Chip
              label={project.tag}
              size="small"
              sx={{
                alignSelf: 'flex-start',
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontSize: '0.7rem',
                height: 20,
                borderRadius: 1,
              }}
            />

            {/* Title + description */}
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                {project.title}
              </Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>
                {project.description}
              </Typography>
            </Box>

            {/* Avatars + cofounder */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem' } }}>
                {project.avatars.map((initials) => (
                  <Avatar
                    key={initials}
                    sx={{
                      bgcolor: avatarColors[initials]?.bg ?? '#e5e7eb',
                      color: avatarColors[initials]?.fg ?? '#374151',
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      width: 28,
                      height: 28,
                    }}
                  >
                    {initials}
                  </Avatar>
                ))}
              </AvatarGroup>
              <Typography sx={{ fontSize: '0.75rem', color: '#6b7280' }}>
                w/ {project.cofounder}
              </Typography>
            </Box>

            {/* Progress metric */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 500 }}>
                  {project.metric.label}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {project.metric.suffix}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={project.metric.value}
                sx={{
                  borderRadius: 4,
                  height: 6,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: project.live ? '#8b5cf6' : '#3b82f6',
                    borderRadius: 4,
                  },
                }}
              />
            </Box>

            {/* Footer */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 'auto' }}>
              {project.footer.map((item, i) => (
                <Typography key={i} sx={{ fontSize: '0.72rem', color: '#6b7280' }}>
                  {item}{i < project.footer.length - 1 ? ' •' : ''}
                </Typography>
              ))}
              {project.featured && (
                <Chip
                  label="Featured"
                  size="small"
                  sx={{
                    backgroundColor: '#ede9fe',
                    color: '#7c3aed',
                    fontSize: '0.65rem',
                    height: 18,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>
          </Paper>
        ))}

        {/* Start a new project card */}
        <Paper
          elevation={0}
          sx={{
            width: 260,
            border: '2px dashed #d1d5db',
            borderRadius: 3,
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            cursor: 'pointer',
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: '#f9fafb' },
          }}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AddIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Start a new project
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', textAlign: 'center' }}>
            From your saved ideas or a fresh new match.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}
