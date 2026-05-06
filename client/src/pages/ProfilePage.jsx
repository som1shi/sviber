import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import ProfileCard from '../components/ProfileCard';
import ActiveProjects from '../components/ActiveProjects';
import EloBreakdown from '../components/EloBreakdown';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  const user = {
    name: profileUser?.displayName || '',
    title: profileUser?.role || 'Builder',
    school: profileUser?.school || '',
    elo: profileUser?.elo ?? 0,
    bio: profileUser?.bio || '',
    profilePic: profileUser?.avatar || '',
    githubLink: profileUser?.github || '',
  };

  // Empty until real projects are wired up
  const projects = [];

  // ELO bars — all green at 0 until real data comes in
  const eloStats = [
    { label: 'Responsiveness', value: 0, color: '#10b981' },
    { label: 'Ship Speed',     value: 0, color: '#10b981' },
    { label: 'Collaboration',  value: 0, color: '#10b981' },
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
