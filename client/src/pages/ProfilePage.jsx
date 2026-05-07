import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ProfileCard from '../components/ProfileCard';
import ActiveProjects from '../components/ActiveProjects';
import EloBreakdown from '../components/EloBreakdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function ProfilePage() {
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/users/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setProfileUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  const breakdown = profileUser?.elo?.breakdown ?? {};

  const user = {
    name: profileUser?.displayName || '',
    title: profileUser?.role || 'Builder',
    school: profileUser?.school || '',
    elo: profileUser?.elo?.total ?? 1000,
    bio: profileUser?.bio || '',
    profilePic: profileUser?.avatar || '',
    githubLink: profileUser?.github || '',
  };

  const projects = [];

  const eloStats = [
    { label: 'Reliability',  value: breakdown.reliability ?? 50, color: '#10b981' },
    { label: 'Quality',      value: breakdown.quality     ?? 50, color: '#7C5CFC' },
    { label: 'Activity',     value: breakdown.activity    ?? 50, color: '#f59e0b' },
  ];

  return (
    <Box sx={{ px: 1 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        My Founder Profile
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Your builder identity and track record.
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <ProfileCard user={user} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ActiveProjects projects={projects} />
          <EloBreakdown elo={user.elo} stats={eloStats} />
        </Box>
      </Box>
    </Box>
  );
}
