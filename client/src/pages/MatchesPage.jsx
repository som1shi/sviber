import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Favorite as FavoriteIcon, Chat as ChatIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const myId = user?._id || user?.id;

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); setMatches([]); return; }

    fetch(`${API}/api/matches`, { credentials: 'include' })
      .then(async (res) => {
        if (res.status === 401) return [];
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Failed to load matches');
        return res.json();
      })
      .then(setMatches)
      .catch((e) => setError(e.message || 'Something went wrong'))
      .finally(() => setLoading(false));
  }, [user, authLoading]);

  const updateStatus = async (matchId, status) => {
    try {
      const res = await fetch(`${API}/api/matches/${matchId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Update failed');
      const updated = await res.json();
      setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, status: updated.status } : m)));
    } catch (e) {
      setError(e.message);
    }
  };

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0)),
    [matches]
  );

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
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Matches</Typography>
        <Alert severity="info">Sign in to see people who want to build the same ideas as you.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, maxWidth: 780, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Matches</Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '0.95rem' }}>
            Chat opens only after two founders pick the same idea.
          </Typography>
        </Box>
        {sortedMatches.length > 0 && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 2, py: 0.75, borderRadius: 20,
            backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb',
          }}>
            <FavoriteIcon sx={{ fontSize: 16, color: '#6b7280' }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              {sortedMatches.length} chat{sortedMatches.length !== 1 ? 's' : ''} ready
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {sortedMatches.length === 0 ? (
        <Box sx={{
          p: 6, textAlign: 'center',
          backgroundColor: '#fff', border: '2px dashed #e5e7eb', borderRadius: 3,
        }}>
          <FavoriteIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No matches yet</Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 400, mx: 'auto' }}>
            Swipe right on ideas you want to build. When someone else swipes right on the same idea, you'll appear here.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sortedMatches.map((match) => {
            const partner = match.users?.find((u) => String(u._id) !== String(myId));
            const idea = match.idea;
            const score = match.score?.total ?? 0;
            const partnerName = partner?.displayName || partner?.name || 'Builder';

            return (
              <Box
                key={match._id}
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: 3,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                  overflow: 'hidden',
                }}
              >
                {/* Top row: partner info + score */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 3, pb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={partner?.avatar || partner?.profilePic}
                      sx={{ width: 48, height: 48, bgcolor: '#4f46e5', fontWeight: 700 }}
                    >
                      {partnerName[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>{partnerName}</Typography>
                      <Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        Both founders swiped right on the same idea.
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: '#16a34a', fontSize: '0.95rem', flexShrink: 0, mt: 0.5 }}>
                    {score} match
                  </Typography>
                </Box>

                {/* Idea card */}
                {idea && (
                  <Box sx={{ mx: 3, mb: 2.5, p: 2, backgroundColor: '#f9fafb', borderRadius: 2, border: '1px solid #f0f0f0' }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                      Matched idea
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>{idea.title}</Typography>
                    {idea.description && (
                      <Typography sx={{ color: '#6b7280', fontSize: '0.85rem', mb: 1.25, lineHeight: 1.5 }}>
                        {idea.description}
                      </Typography>
                    )}
                    {idea.tags?.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                        {idea.tags.map((tag) => (
                          <Chip key={tag} label={tag} size="small" sx={{ height: 22, fontSize: '0.75rem', backgroundColor: '#ede9fe', color: '#5b21b6', fontWeight: 500 }} />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Divider */}
                <Box sx={{ height: '1px', backgroundColor: '#f3f4f6', mx: 0 }} />

                {/* Bottom row: status + actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                      Chat unlocked
                    </Typography>
                    {match.status !== 'pending' && (
                      <Chip
                        label={match.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          textTransform: 'capitalize',
                          backgroundColor: match.status === 'collab' ? '#dcfce7' : '#fee2e2',
                          color: match.status === 'collab' ? '#16a34a' : '#dc2626',
                        }}
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    {match.status === 'pending' && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => updateStatus(match._id, 'passed')}
                          sx={{ textTransform: 'none', borderColor: '#e5e7eb', color: '#6b7280', borderRadius: 2, fontSize: '0.8rem' }}
                        >
                          Pass
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => updateStatus(match._id, 'collab')}
                          sx={{ textTransform: 'none', borderColor: '#16a34a', color: '#16a34a', borderRadius: 2, fontSize: '0.8rem' }}
                        >
                          Collab
                        </Button>
                      </>
                    )}
                    <Button
                      variant="contained"
                      startIcon={<ChatIcon sx={{ fontSize: '1rem !important' }} />}
                      onClick={() => navigate(`/app/matches/${match._id}`, { state: { match } })}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        backgroundColor: '#111',
                        borderRadius: 20,
                        px: 2.5,
                        '&:hover': { backgroundColor: '#333' },
                      }}
                    >
                      Start chat
                    </Button>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
