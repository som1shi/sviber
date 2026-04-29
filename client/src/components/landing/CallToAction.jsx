import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function CallToAction() {
  const navigate = useNavigate();

  return (
    <Box sx={{ py: { xs: 6, md: 8 }, backgroundColor: '#fafaf8' }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            backgroundColor: '#1a1a1a',
            borderRadius: 6,
            py: { xs: 8, md: 10 },
            px: 4,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              color: '#fff',
              fontSize: { xs: '2.2rem', md: '3.5rem' },
              mb: 2,
            }}
          >
            Stop pitching.
            <br />
            Start shipping.
          </Typography>
          <Typography sx={{ color: '#9ca3af', fontSize: '1.1rem', mb: 4 }}>
            Join 2,400+ builders finding co-founders the honest way.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/app/swipe')}
            sx={{
              backgroundColor: '#fff',
              color: '#1a1a1a',
              fontWeight: 700,
              px: 5,
              py: 1.5,
              fontSize: '1rem',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            Get early access →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
