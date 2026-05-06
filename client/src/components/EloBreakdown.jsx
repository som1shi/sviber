import { Box, Typography, Paper, LinearProgress } from '@mui/material';

export default function EloBreakdown({ elo, stats, history }) {
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
          ⚡ ELO Breakdown
        </Typography>
      </Box>

      {/* Big ELO Number */}
      <Typography
        sx={{
          fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
          fontWeight: 700,
          mb: 4,
          color: elo < 0 ? '#dc2626' : '#059669',
          fontSize: { xs: '2.5rem', sm: '3.5rem' },
        }}
      >
        {elo}
      </Typography>

      {/* Stat Breakdown */}
      <Box sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>
                {stat.label}
              </Typography>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '2px',
                  backgroundColor: stat.color,
                }}
              />
            </Box>
            <LinearProgress
              variant="determinate"
              value={stat.value}
              sx={{
                height: 8,
                borderRadius: 3,
                backgroundColor: '#e5e7eb',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: stat.color,
                  borderRadius: 3,
                },
              }}
            />
          </Box>
        ))}
      </Box>

      {/* ELO History Chart */}
      <Box
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
        }}
      >
        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 2 }}>
          ELO History
        </Typography>

        {/* Flat line when no ELO history */}
        <svg
          width="100%"
          height="120"
          style={{ display: 'block' }}
          viewBox="0 0 300 120"
        >
          <polyline
            points="0,60 300,60"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
          <circle cx="0" cy="60" r="3" fill="#10b981" />
          <circle cx="300" cy="60" r="3" fill="#10b981" />
        </svg>
      </Box>
    </Paper>
  );
}
