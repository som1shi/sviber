import { Box, Typography, Paper } from '@mui/material';
import { RadioButtonUnchecked as RadioButtonUncheckedIcon } from '@mui/icons-material';

export default function CommunityPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Community
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Browse and post startup ideas. Vote on what should get built.
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
        <RadioButtonUncheckedIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Community Page — Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
          The idea feed with Hot, New, Building, and Mine tabs. Post ideas, upvote/downvote, mark ideas you want to build, and save for later. Each idea card shows the founder, ELO, heat score, and builder count.
        </Typography>
      </Paper>
    </Box>
  );
}
