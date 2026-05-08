import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Avatar, Button, CircularProgress,
  Alert, Chip, Dialog, DialogContent, IconButton,
} from '@mui/material';
import { Favorite as FavoriteIcon, Chat as ChatIcon, Close as CloseIcon, GitHub as GitHubIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const PURPLE = '#7C5CFC';

function PartnerModal({ partner, onClose }) {
  if (!partner) return null;
  const eloVal = partner.elo && typeof partner.elo === 'object' ? (partner.elo.total ?? 1000) : (Number(partner.elo) || 1000);
  const skills = Array.isArray(partner.skills) ? partner.skills : [];

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <CloseIcon />
        </IconButton>
        <Box sx={{ p: 3, pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar src={partner.profilePic} sx={{ width: 64, height: 64, fontSize: '1.5rem', bgcolor: '#4f46e5', fontWeight: 700 }}>
              {partner.name?.[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{partner.name || 'Builder'}</Typography>
              {partner.title && <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>{partner.title}</Typography>}
              {partner.school && <Typography sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>{partner.school}</Typography>}
            </Box>
          </Box>

          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: PURPLE, mb: partner.bio ? 1.5 : 0 }}>
            {eloVal} ELO
          </Typography>

          {partner.bio && (
            <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, mb: 1.5 }}>
              {partner.bio}
            </Typography>
          )}

          {skills.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              {skills.map((s) => (
                <Chip key={s} label={s} size="small" sx={{ backgroundColor: '#f3f0ff', color: '#5b21b6', fontWeight: 500 }} />
              ))}
            </Box>
          )}

          {partner.githubLink && (
            <Button
              startIcon={<GitHubIcon />}
              href={partner.githubLink.startsWith('http') ? partner.githubLink : `https://${partner.githubLink}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: '#1a1a1a', textTransform: 'none', p: 0 }}
            >
              {partner.githubLink}
            </Button>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function MatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileModal, setProfileModal] = useState(null);

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

  // Filter out passed matches and sort by score
  const visibleMatches = useMemo(
    () => [...matches]
      .filter((m) => m.status !== 'passed')
      .sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0)),
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
      <Box sx={{ px: 1 }}>
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
        {visibleMatches.length > 0 && (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1,
            px: 2, py: 0.75, borderRadius: 20,
            backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb',
          }}>
            <FavoriteIcon sx={{ fontSize: 16, color: '#6b7280' }} />
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              {visibleMatches.length} chat{visibleMatches.length !== 1 ? 's' : ''} ready
            </Typography>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>
      )}

      {visibleMatches.length === 0 ? (
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
          {visibleMatches.map((match) => {
            const partner = match.users?.find((u) => String(u._id) !== String(myId));
            const idea = match.idea;
            const score = match.score?.total ?? 0;

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
                {/* Top: partner + score */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', p: 3, pb: 2 }}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                    onClick={() => setProfileModal(partner)}
                  >
                    <Avatar
                      src={partner?.profilePic}
                      sx={{ width: 48, height: 48, bgcolor: '#4f46e5', fontWeight: 700 }}
                    >
                      {partner?.name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                        {partner?.name || 'Builder'}
                      </Typography>
                      <Typography sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
                        {partner?.title || 'Founder'}{partner?.school ? ` · ${partner.school}` : ''}
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

                <Box sx={{ height: '1px', backgroundColor: '#f3f4f6' }} />

                {/* Bottom: status + actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography sx={{ color: '#16a34a', fontWeight: 600, fontSize: '0.9rem' }}>
                      Chat unlocked
                    </Typography>
                    {match.status === 'collab' && (
                      <Chip label="Collab" size="small" sx={{ height: 20, fontSize: '0.72rem', backgroundColor: '#dcfce7', color: '#16a34a' }} />
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
                        textTransform: 'none', fontWeight: 600, fontSize: '0.9rem',
                        backgroundColor: '#111', borderRadius: 20, px: 2.5,
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

      {profileModal && <PartnerModal partner={profileModal} onClose={() => setProfileModal(null)} />}
    </Box>
  );
}
