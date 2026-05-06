import { Box, Typography, Paper, LinearProgress, Chip } from '@mui/material';

export default function ActiveProjects({ projects }) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          🔥 Active Projects
        </Typography>
      </Box>

      {/* Projects Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
        {projects.map((project) => (
          <Box
            key={project.id}
            sx={{
              p: 3,
              borderRadius: 2,
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
            }}
          >
            {/* Project Emoji/Icon */}
            <Box
              sx={{
                fontSize: '2.5rem',
                mb: 2,
              }}
            >
              {project.emoji}
            </Box>

            {/* Project Name */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              {project.name}
            </Typography>

            {/* Collaborator */}
            <Chip
              label={`with ${project.user}`}
              size="small"
              sx={{
                backgroundColor: '#f3f4f6',
                color: '#6b7280',
                fontWeight: 500,
                mb: 2,
                fontSize: '0.8rem',
              }}
            />

            {/* Progress Bar */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Progress
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280' }}>
                  {project.progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={project.progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: '#e5e7eb',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: project.progressColor || '#3b82f6',
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
