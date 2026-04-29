import { Box, Typography, Paper } from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';

export default function MatchesPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Matches
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Your co-founder matches and active conversations.
      </Typography>
      <Paper
        sx={{
          p: 6,
          textAlign: 'center',
          backgroundColor: '#f9fafb',
          border: '2px dashed #e5e7eb',
          borderRadius: 3,
        }}
      >
        <FavoriteIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Matches Page — Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
          See builders who swiped right on the same ideas as you. View match scores based on idea alignment, skills fit, ELO, and activity. Choose to Collab or Duel.
        </Typography>
      </Paper>
    </Box>
  );
}
