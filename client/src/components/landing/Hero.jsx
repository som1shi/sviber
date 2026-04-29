import { Box, Typography, Button, Container, Chip, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const stats = [
  { value: '2,400+', label: 'founders swiping' },
  { value: '180+', label: 'teams matched' },
  { value: '47', label: 'products shipped' },
];

const matchSignals = [
  { label: 'Same idea', pct: 40, color: '#3b82f6' },
  { label: 'Skills fit', pct: 30, color: '#10b981' },
  { label: 'Similar ELO', pct: 20, color: '#8b5cf6' },
  { label: 'Active', pct: 10, color: '#f59e0b' },
];

export default function Hero() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fff' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 8, alignItems: 'center' }}>
          {/* Left side — copy */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                ✦ Now in private beta · Join waitlist
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '2.8rem', md: '4rem' },
                lineHeight: 1.05,
                mb: 3,
              }}
            >
              Find your co-
              <br />
              founder.
              <br />
              Ship your idea.
            </Typography>

            <Typography
              sx={{
                color: '#6b7280',
                fontSize: '1.1rem',
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 440,
              }}
            >
              Sviber is where founders discover startup ideas by swiping — and get
              matched with co-founders who actually want to build the same thing.
              Team up or duel to see who ships first.
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 6 }}>
              <Button variant="contained" color="primary" size="large" onClick={() => navigate('/app/swipe')}>
                Start swiping →
              </Button>
              <Button variant="outlined" color="primary" size="large">
                See how it works
              </Button>
            </Box>

            {/* Stats */}
            <Box sx={{ display: 'flex', gap: 6 }}>
              {stats.map((stat) => (
                <Box key={stat.label}>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    {stat.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right side — card mockup */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: 340,
                borderRadius: 4,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              }}
            >
              {/* Card header */}
              <Box sx={{ p: 3, pb: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Chip label="AI · B2B" size="small" sx={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }} />
                  <Chip label="🔥 94% hot" size="small" sx={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                  AI meeting notes that actually ship actions
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.5 }}>
                  Notes app that listens to standups, auto-creates tasks in Linear, and pings ghosting teammates. Built for founder-mode teams.
                </Typography>
              </Box>

              {/* Match score */}
              <Box sx={{ px: 3, py: 2, borderTop: '1px solid #f3f4f6' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#6b7280' }}>
                    Your match w/ Priya M
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    88
                  </Typography>
                </Box>
                {matchSignals.map((signal) => (
                  <Box key={signal.label} sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        {signal.label}
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {signal.pct}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={signal.pct * 2.5}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: '#f3f4f6',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: signal.color,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, p: 3 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}
                >
                  ☆
                </Box>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#1a1a1a',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    cursor: 'pointer',
                  }}
                >
                  →
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
