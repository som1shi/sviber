import { Box, Typography, Paper } from '@mui/material';
import { Settings as SettingsIcon } from '@mui/icons-material';

export default function SettingsPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Settings
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Account preferences and app configuration.
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
        <SettingsIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Settings Page — Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
          Manage your account, notification preferences, connected accounts, privacy settings, and subscription tier.
        </Typography>
      </Paper>
    </Box>
  );
}
