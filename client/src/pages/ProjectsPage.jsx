import { Box, Typography, Paper } from '@mui/material';
import { CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon } from '@mui/icons-material';

export default function ProjectsPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Projects
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>
        Your active builds, task boards, and team workspace.
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
        <CheckBoxOutlineBlankIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
          Projects Page — Coming Soon
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
          Structured project boards with tasks, contributors, and progress tracking. Matched ideas become projects with build chat, AI code review, and accountability tracking.
        </Typography>
      </Paper>
    </Box>
  );
}
