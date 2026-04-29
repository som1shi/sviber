import { Box, Typography, Container, LinearProgress } from '@mui/material';

const signals = [
  {
    title: 'Same idea?',
    subtitle: 'Do you want to build the same thing?',
    pct: 40,
    color: '#3b82f6',
    barWidth: 70,
  },
  {
    title: 'Skills fit?',
    subtitle: 'Do you complement, not clone?',
    pct: 30,
    color: '#10b981',
    barWidth: 60,
  },
  {
    title: 'Similar ELO?',
    subtitle: 'Are you at the same level?',
    pct: 20,
    color: '#8b5cf6',
    barWidth: 40,
  },
  {
    title: 'Active lately?',
    subtitle: 'Have they been swiping recently?',
    pct: 10,
    color: '#f59e0b',
    barWidth: 30,
  },
];

export default function MatchingAlgo() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#1a1a1a', color: '#fff' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 8, alignItems: 'center' }}>
          {/* Left copy */}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="overline"
              sx={{ color: '#9ca3af', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
            >
              HOW MATCHING WORKS
            </Typography>
            <Typography variant="h2" sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, mb: 3, color: '#fff' }}>
              Four signals.
              <br />
              One score.
            </Typography>
            <Typography sx={{ color: '#9ca3af', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 420 }}>
              We don't just match anyone who swipes right. Sviber weighs what
              actually matters for shipping together — alignment, complementary
              skills, level, and activity.
            </Typography>
          </Box>

          {/* Right card */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <Box
              sx={{
                width: '100%',
                maxWidth: 440,
                backgroundColor: '#fff',
                borderRadius: 4,
                p: 4,
                color: '#1a1a1a',
              }}
            >
              <Typography
                variant="overline"
                sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: 2, mb: 3, display: 'block' }}
              >
                HOW A MATCH SCORE IS CALCULATED
              </Typography>

              {signals.map((signal) => (
                <Box key={signal.title} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {signal.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        {signal.subtitle}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {signal.pct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={signal.barWidth}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#f3f4f6',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: signal.color,
                        borderRadius: 4,
                      },
                    }}
                  />
                </Box>
              ))}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, pt: 3, borderTop: '1px solid #f3f4f6' }}>
                <Typography variant="body1" sx={{ color: '#6b7280' }}>
                  Resulting match score
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800 }}>
                  88
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
