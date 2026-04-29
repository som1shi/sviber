import { Box, Typography, Card, CardContent, Container } from '@mui/material';
import {
  SwapHoriz as SwapHorizIcon,
  Favorite as FavoriteIcon,
  RocketLaunch as RocketLaunchIcon,
} from '@mui/icons-material';

const steps = [
  {
    number: '01',
    title: 'Swipe',
    description: 'Right to build, left to pass, up to save. Ideas come from the community, curated by ELO.',
    icon: <SwapHorizIcon sx={{ fontSize: 28 }} />,
    iconBg: '#e0e7ff',
    iconColor: '#4f46e5',
  },
  {
    number: '02',
    title: 'Match',
    description: "Get matched with builders who swiped the same idea. See skills fit, ELO match, and activity.",
    icon: <FavoriteIcon sx={{ fontSize: 28 }} />,
    iconBg: '#dcfce7',
    iconColor: '#16a34a',
  },
  {
    number: '03',
    title: 'Ship',
    description: 'Collab to build together, or Duel to race. Win a duel → ELO up. Ghost → ELO down.',
    icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />,
    iconBg: '#fef9c3',
    iconColor: '#ca8a04',
  },
];

export default function CoreLoop() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fafaf8' }}>
      <Container maxWidth="lg">
        <Typography
          variant="overline"
          sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
        >
          THE CORE LOOP
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, mb: 2 }}>
          Swipe. Match. Ship.
        </Typography>
        <Typography sx={{ color: '#6b7280', fontSize: '1.1rem', mb: 6, maxWidth: 480 }}>
          Three steps from half-baked idea to shipped product. No cold DMs, no awkward networking, no ghosting.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {steps.map((step) => (
            <Card
              key={step.number}
              sx={{
                flex: 1,
                border: '1px solid #e5e7eb',
                backgroundColor: '#fff',
                p: 1,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      backgroundColor: step.iconBg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.iconColor,
                    }}
                  >
                    {step.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: '#9ca3af', fontWeight: 500 }}>
                    {step.number}
                  </Typography>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1.5 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
