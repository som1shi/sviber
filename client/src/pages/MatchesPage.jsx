import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Favorite as FavoriteIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SIGNALS = [
  { key: 'ideaAlignment', label: 'Same idea', weightPct: 40, color: '#3b82f6' },
  { key: 'skillsFit', label: 'Skills fit', weightPct: 30, color: '#10b981' },
  { key: 'eloCompatibility', label: 'Similar ELO', weightPct: 20, color: '#8b5cf6' },
  { key: 'activity', label: 'Active lately', weightPct: 10, color: '#f59e0b' },
];

function weightedPoints(raw0to100, weightPct) {
  return Math.round((raw0to100 / 100) * weightPct);
}

function SignalBars({ score }) {
  return (
    <Box sx={{ pt: 1.5 }}>
      {SIGNALS.map((signal) => {
        const raw = score?.[signal.key] ?? 0;
        const pts = weightedPoints(raw, signal.weightPct);
        return (
          <Box key={signal.key} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.25 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', width: 88, flexShrink: 0 }}>
              {signal.label}
            </Typography>
            <Box sx={{ flex: 1, height: 8, borderRadius: 4, bgcolor: '#f3f4f6', overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${raw}%`,
                  height: '100%',
                  borderRadius: 4,
                  bgcolor: signal.color,
                }}
              />
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ width: 108, textAlign: 'right' }}>
              +{pts} / {signal.weightPct}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const myId = user?._id || user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setMatches([]);
      return;
    }

    fetch('/api/matches', { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) return [];
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load matches');
        return res.json();
      })
      .then(setMatches)
      .catch((e) => setError(e.message || 'Something went wrong'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const sortedMatches = useMemo(
    () =>
      [...matches].sort(
        (a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0)
      ),
    [matches]
  );

  const updateStatus = async (matchId, status) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Update failed');
      const updated = await res.json();
      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? { ...m, status: updated.status } : m))
      );
    } catch (e) {
      setError(e.message);
    }
  };

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={32} sx={{ color: '#111' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Matches
        </Typography>
        <Alert severity="info">Sign in to see people who want to build the same ideas as you.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 720, mx: 'auto', overflowY: 'auto', maxHeight: '100%' }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
        Matches
      </Typography>
      <Typography sx={{ color: '#6b7280', mb: 3 }}>
        Same-idea builders ranked by alignment, complementary skills, ELO similarity, and recent activity.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {sortedMatches.length === 0 ? (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            border: '2px dashed #e5e7eb',
            borderRadius: 3,
          }}
        >
          <FavoriteIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
            No matches yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
            Swipe right on ideas you want to build. When someone else swipes right on the same idea, you will
            appear here with a computed match score.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={2.5}>
          {sortedMatches.map((match) => {
            const partner = match.users?.find((u) => String(u._id) !== String(myId));
            const idea = match.idea;
            const sc = match.score || {};

            return (
              <Paper
                key={match._id}
                sx={{
                  p: 2.5,
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, minWidth: 0 }}>
                    <Avatar
                      src={partner?.profilePic}
                      alt=""
                      sx={{ width: 48, height: 48 }}
                    >
                      {partner?.name?.[0]}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.25 }}>
                        {partner?.name || 'Builder'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
                        {idea?.title || 'Idea'}
                      </Typography>
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                        {(partner?.skills || []).slice(0, 4).map((s) => (
                          <Chip key={s} label={s} size="small" sx={{ height: 22, fontSize: '0.7rem' }} />
                        ))}
                        {partner?.primaryRole && (
                          <Chip label={partner.primaryRole} size="small" sx={{ height: 22, fontWeight: 600 }} />
                        )}
                      </Stack>
                    </Box>
                  </Box>

                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      Match
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                      {sc.total ?? '—'}
                    </Typography>
                    <Chip label={match.status} size="small" sx={{ mt: 0.5, textTransform: 'capitalize' }} />
                  </Box>
                </Box>

                <SignalBars score={sc} />

                <Stack direction="row" spacing={1.25} sx={{ mt: 2 }}>
                  <Button
                    variant="contained"
                    disabled={match.status !== 'pending'}
                    onClick={() => updateStatus(match._id, 'collab')}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      bgcolor: '#111',
                      '&:hover': { bgcolor: '#333' },
                    }}
                  >
                    Collab
                  </Button>
                  <Button variant="outlined" disabled={match.status !== 'pending'} onClick={() => updateStatus(match._id, 'passed')} sx={{ textTransform: 'none' }}>
                    Pass
                  </Button>
                  <Button variant="text" onClick={() => navigate(`/app/build/${match._id}`)} sx={{ textTransform: 'none', ml: 'auto!important' }}>
                    Open build →
                  </Button>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
