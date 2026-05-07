import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{
      backgroundColor: '#1a1a1a', border: '1px solid #333',
      borderRadius: 2, px: 1.5, py: 1,
    }}>
      <Typography sx={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 700 }}>
        {d.total} ELO
      </Typography>
      {d.event && (
        <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af' }}>{d.event}</Typography>
      )}
      {d.label && (
        <Typography sx={{ fontSize: '0.7rem', color: '#6b7280' }}>{d.label}</Typography>
      )}
    </Box>
  );
}

export default function EloBreakdown({ elo, stats, history = [] }) {
  const validHistory = Array.isArray(history) ? history : [];

  const chartData = validHistory.map((h, i) => ({
    i,
    total: typeof h.total === 'number' ? h.total : elo,
    event: h.event || '',
    label: h.date ? new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
  }));

  // Need at least 2 points for a line; pad with current value if fewer
  if (chartData.length === 0) {
    chartData.push({ i: 0, total: elo, event: 'starting ELO', label: 'start' });
  }
  if (chartData.length === 1) {
    chartData.push({ i: 1, total: elo, event: '', label: 'now' });
  }

  const totals = chartData.map((d) => d.total);
  const minY = Math.min(...totals) - 50;
  const maxY = Math.max(...totals) + 50;
  const hasRealHistory = validHistory.length > 0;

  return (
    <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>⚡ ELO Breakdown</Typography>
      </Box>

      <Typography sx={{
        fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
        fontWeight: 700, mb: 4,
        color: elo >= 1000 ? '#059669' : '#dc2626',
        fontSize: { xs: '2.5rem', sm: '3.5rem' },
      }}>
        {elo}
      </Typography>

      <Box sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Box key={stat.label} sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 500 }}>{stat.label}</Typography>
              <Box sx={{ width: 12, height: 12, borderRadius: '2px', backgroundColor: stat.color }} />
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, Math.max(0, stat.value))}
              sx={{
                height: 8, borderRadius: 3, backgroundColor: '#e5e7eb',
                '& .MuiLinearProgress-bar': { backgroundColor: stat.color, borderRadius: 3 },
              }}
            />
          </Box>
        ))}
      </Box>

      <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mb: 1.5 }}>
          ELO History {!hasRealHistory && <Box component="span" sx={{ fontWeight: 400, color: '#9ca3af' }}>— events appear after swipes, matches, and resume uploads</Box>}
        </Typography>
        {/* Give the container an explicit pixel height so ResponsiveContainer works */}
        <Box sx={{ width: '100%', height: 120 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
              {hasRealHistory && (
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
              )}
              <YAxis domain={[minY, maxY]} hide />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={1000} stroke="#e5e7eb" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Paper>
  );
}
