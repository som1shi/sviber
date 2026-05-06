import { Box, Button, Typography, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          backgroundColor: '#fff',
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          p: 6,
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 4 }}>
          <Box sx={{ width: 28, height: 28, borderRadius: '50%', backgroundColor: '#1a1a1a' }} />
          <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', color: '#1a1a1a' }}>
            sviber
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: '#1a1a1a' }}>
          Find your co-founder
        </Typography>
        <Typography sx={{ color: '#6b7280', mb: 4, fontSize: '0.95rem' }}>
          Sign in to match with builders, discuss ideas, and ship together.
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {/* Google Sign In */}
        <Button
          fullWidth
          variant="outlined"
          onClick={login}
          sx={{
            py: 1.5,
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#1a1a1a',
            borderColor: '#d1d5db',
            borderRadius: 2,
            display: 'flex',
            gap: 1.5,
            '&:hover': { borderColor: '#1a1a1a', backgroundColor: '#f9fafb' },
          }}
        >
          {/* Google icon */}
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.5 35.6 26.9 36 24 36c-5.2 0-9.5-2.9-11.3-7L6.1 33.3C9.5 39.6 16.3 44 24 44z"/>
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.5-2.5 4.6-4.6 6l6.2 5.2C40.7 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
          </svg>
          Continue with Google
        </Button>

        <Typography sx={{ mt: 3, fontSize: '0.8rem', color: '#9ca3af' }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Typography>
      </Box>
    </Box>
  );
}
