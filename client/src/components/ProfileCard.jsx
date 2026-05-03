import { Box, Typography, Paper, Button } from '@mui/material';
import { GitHub as GitHubIcon } from '@mui/icons-material';

export default function ProfileCard({ user }) {
  return (
    <Paper
      sx={{
        p: 4,
        borderRadius: 3,
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      {/* Profile Picture */}
      <Box
        sx={{
          width: 280,
          height: 280,
          borderRadius: 3,
          backgroundColor: '#e5e7eb',
          mb: 3,
          backgroundImage: user.profilePic ? `url(${user.profilePic})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Name & Title */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {user.name}
      </Typography>
      <Typography variant="body2" sx={{ color: '#6b7280', mb: 3 }}>
        {user.title}
      </Typography>

      {/* School + ELO */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          🎓 {user.school}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: user.elo < 0 ? '#dc2626' : '#059669',
          }}
        >
          {user.elo} ELO
        </Typography>
      </Box>

      {/* Bio */}
      <Typography
        sx={{
          color: '#6b7280',
          lineHeight: 1.6,
          mb: 4,
          fontSize: '0.95rem',
        }}
      >
        {user.bio}
      </Typography>

      {/* GitHub Link */}
      {user.githubLink && (
        <Button
          startIcon={<GitHubIcon />}
          href={user.githubLink}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: '#1a1a1a',
            textTransform: 'none',
            fontSize: '0.9rem',
            p: 0,
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          {user.githubLink}
        </Button>
      )}
    </Paper>
  );
}
