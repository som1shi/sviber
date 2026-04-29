import { Box, Typography, Paper } from '@mui/material';
import { PersonOutlined as PersonOutlineIcon } from '@mui/icons-material';

export default function ProfilePage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        User Profile
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Your builder identity and track record.
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
        <PersonOutlineIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Profile Page — Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
          Stack tags, role, availability, ship history, and 3 Hinge-style prompts. Your ELO tier is displayed (Seed → Hacker → Builder → Founder → Unicorn) along with your build track record.
        </Typography>
      </Paper>
    </Box>
  );
}
