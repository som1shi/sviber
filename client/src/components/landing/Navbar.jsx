import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const navLinks = ['How it works', 'Community', 'Leaderboard', 'Pricing'];

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 0 } }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#1a1a1a',
              }}
            />
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a1a1a', fontSize: '1.1rem' }}>
              sviber
            </Typography>
          </Box>

          {/* Nav links */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            {navLinks.map((link) => (
              <Button
                key={link}
                sx={{
                  color: '#6b7280',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  '&:hover': { color: '#1a1a1a', backgroundColor: 'transparent' },
                }}
              >
                {link}
              </Button>
            ))}
          </Box>

          {/* Auth buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button
              sx={{ color: '#1a1a1a', fontWeight: 600, fontSize: '0.9rem' }}
              onClick={() => navigate('/app/swipe')}
            >
              Sign in
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/app/swipe')}
              sx={{ fontSize: '0.9rem' }}
            >
              Get started →
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
