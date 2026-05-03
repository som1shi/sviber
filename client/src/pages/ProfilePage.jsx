import { Box, Typography } from '@mui/material';
import ProfileCard from '../components/ProfileCard';
import ActiveProjects from '../components/ActiveProjects';
import EloBreakdown from '../components/EloBreakdown';

export default function ProfilePage() {
  // Mock user data
  const mockUser = {
    name: 'Dylan Dang',
    title: 'Builder',
    school: "UC Berkeley '27",
    elo: -223,
    bio: "Hey, I'm Dylan! I'm a third year studying data science. I like eating malatang, doomscrolling depop, playing brawl stars, running, and Mohammed Amini!",
    profilePic: '', // Add image URL here later
    githubLink: 'github.com/dylandango',
  };

  // Mock projects data
  const mockProjects = [
    {
      id: 1,
      name: 'Malatang Optimizer',
      emoji: '🍲',
      user: '@sunninkim',
      progress: 30,
      progressColor: '#fbbf24',
    },
    {
      id: 2,
      name: 'Two Man Search',
      emoji: '👯',
      user: '@som1shi',
      progress: 75,
      progressColor: '#10b981',
    },
  ];

  // Mock ELO stats
  const mockStats = [
    { label: 'Responsiveness', value: 35, color: '#ef4444' },
    { label: 'Ship Speed', value: 25, color: '#f59e0b' },
    { label: 'Collaboration', value: 30, color: '#ef4444' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        My Founder Profile
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Your builder identity and track record.
      </Typography>

      {/* Main grid layout */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Left column */}
        <Box>
          <ProfileCard user={mockUser} />
        </Box>

        {/* Right column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <ActiveProjects projects={mockProjects} />
          <EloBreakdown elo={mockUser.elo} stats={mockStats} />
        </Box>
      </Box>
    </Box>
  );
}
