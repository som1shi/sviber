import { Box, Typography, Container, Link } from '@mui/material';

const columns = [
  {
    title: 'Product',
    links: ['Swipe', 'Community', 'Duels', 'Leaderboard'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Press', 'Contact'],
  },
  {
    title: 'Resources',
    links: ['Blog', 'Changelog', 'Help center', 'API'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Cookies', 'Security'],
  },
];

export default function Footer() {
  return (
    <Box sx={{ py: 8, backgroundColor: '#fafaf8', borderTop: '1px solid #e5e7eb' }}>
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, mb: 6 }}>
          {/* Brand */}
          <Box sx={{ flex: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  backgroundColor: '#1a1a1a',
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                sviber
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              Find your co-founder. Ship your idea.
            </Typography>
          </Box>

          {/* Link columns */}
          {columns.map((col) => (
            <Box key={col.title} sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: '#1a1a1a' }}>
                {col.title}
              </Typography>
              {col.links.map((link) => (
                <Link
                  key={link}
                  href="#"
                  underline="none"
                  display="block"
                  sx={{ color: '#6b7280', fontSize: '0.9rem', mb: 1.5, '&:hover': { color: '#1a1a1a' } }}
                >
                  {link}
                </Link>
              ))}
            </Box>
          ))}
        </Box>

        {/* Bottom bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 4,
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            &copy; 2026 Sviber Labs, Inc.
          </Typography>
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            Built by founders, for founders.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
