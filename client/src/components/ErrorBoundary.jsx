import React from 'react';
import { Box, Button, Typography } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown rendering error' };
  }

  componentDidCatch(error, errorInfo) {
    // Keep details available in dev tools for debugging.
    console.error('UI crash caught by ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          p: 3,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 560,
            borderRadius: 3,
            border: '1px solid #e5e7eb',
            backgroundColor: '#fff',
            p: 3,
            boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 900, mb: 1 }}>
            Something went wrong in the UI
          </Typography>
          <Typography sx={{ color: '#6b7280', mb: 2 }}>
            The app crashed while rendering. Use reload to recover.
          </Typography>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              border: '1px solid #fee2e2',
              backgroundColor: '#fff1f2',
              color: '#b91c1c',
              fontFamily: 'monospace',
              fontSize: 12,
              mb: 2,
              whiteSpace: 'pre-wrap',
            }}
          >
            {this.state.message}
          </Box>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Reload page
          </Button>
        </Box>
      </Box>
    );
  }
}
