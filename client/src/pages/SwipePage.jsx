import { Box, Typography, Paper } from '@mui/material';
import { SwapHoriz as SwapHorizIcon } from '@mui/icons-material';

export default function SwipePage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Swipe
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Discover startup ideas and swipe to build.
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
        <SwapHorizIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Swipe Page — Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
          This is where users will swipe on project ideas. Right to build, left to pass, up to save. Ideas come from the community feed, curated by ELO.
        </Typography>
      </Paper>
    </Box>
  );
}
