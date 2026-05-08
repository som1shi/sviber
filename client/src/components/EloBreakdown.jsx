import { Box, Typography, Paper, LinearProgress } from '@mui/material';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';

const GREEN = '#10b981';
const PURPLE = '#7C5CFC';

function eloColor(elo) {
  if (elo <= 0) return '#dc2626';
  if (elo < 900) return '#f59e0b';
  return GREEN;
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <Box sx={{
      backgroundColor: '#1a1a1a', border: '1px solid #333',
      borderRadius: 2, px: 1.5, py: 1,
    }}>
      <Typography sx={{ fontSize: '0.8rem', color: GREEN, fontWeight: 700 }}>
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
  const hasRealHistory = validHistory.length >= 2;

  const chartData = validHistory.map((h, i) => ({
    i,
    total: typeof h.total === 'number' ? h.total : elo,
    event: h.event || '',
    label: h.date
      ? new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : `#${i + 1}`,
  }));

  const totals = hasRealHistory ? chartData.map((d) => d.total) : [elo];
  const minY = Math.floor((Math.min(...totals) - 30) / 10) * 10;
  const maxY = Math.ceil((Math.max(...totals) + 30) / 10) * 10;

  return (
    <Paper sx={{ p: 3, borderRadius: 3, backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>⚡ ELO Breakdown</Typography>
      </Box>

      {/* Total ELO — green unless truly negative */}
      <Typography sx={{
        fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
        fontWeight: 700, mb: 4,
        color: eloColor(elo),
        fontSize: { xs: '2.5rem', sm: '3.5rem' },
      }}>
        {elo}
      </Typography>

      {/* Breakdown bars */}
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

      {/* ELO History chart */}
      <Box sx={{ p: 2, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
        <Typography variant="body2" sx={{ color: '#374151', fontWeight: 600, mb: 2 }}>
          ELO History
        </Typography>

        {hasRealHistory ? (
          <Box sx={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <defs>
                  <linearGradient id="eloGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minY, maxY]}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={1000} stroke="#d1d5db" strokeDasharray="4 3" label={{ value: '1000', position: 'right', fontSize: 9, fill: '#9ca3af' }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  fill="url(#eloGradient)"
                  dot={{ r: 4, fill: GREEN, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: GREEN, stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{
            height: 140, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 1,
          }}>
            <Typography sx={{ fontSize: '1.5rem' }}>📈</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center', maxWidth: 240 }}>
              Your ELO graph will appear here after swipes, matches, and resume uploads.
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
