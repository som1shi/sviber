import { Box, Typography, Card, CardContent, Container } from '@mui/material';

const tiers = [
  { name: 'Seed', range: '0–999 ELO', color: '#9ca3af' },
  { name: 'Hacker', range: '1000–1499 ELO', color: '#3b82f6' },
  { name: 'Builder', range: '1500–1899 ELO', color: '#10b981' },
  { name: 'Founder', range: '1900–2199 ELO', color: '#f59e0b' },
  { name: 'Unicorn', range: '2200+ ELO', color: '#8b5cf6' },
];

export default function EloSystem() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fafaf8' }}>
      <Container maxWidth="lg">
        <Typography
          variant="overline"
          sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
        >
          ELO SYSTEM
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, mb: 2 }}>
          Your track record, visible.
        </Typography>
        <Typography sx={{ color: '#6b7280', fontSize: '1.05rem', mb: 6, maxWidth: 520, lineHeight: 1.6 }}>
          Ship a project → ELO up. Ghost your cofounder → ELO down. Inactive 60 days → ELO decays. You always know who actually executes.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 0,
            border: '1px solid #e5e7eb',
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {tiers.map((tier, index) => (
            <Card
              key={tier.name}
              sx={{
                flex: 1,
                borderRadius: 0,
                border: 'none',
                borderRight: index < tiers.length - 1 ? '1px dashed #d1d5db' : 'none',
                backgroundColor: '#f9fafb',
                boxShadow: 'none',
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: tier.color,
                    mb: 2,
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {tier.name}
                </Typography>
                <Typography variant="body2" sx={{ color: tier.color, fontWeight: 500 }}>
                  {tier.range}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
