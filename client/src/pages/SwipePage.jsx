import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SWIPE_THRESHOLD = 100;

const DEMO_IDEAS = [
  {
    id: '1',
    title: 'AI meeting notes that actually ship actions',
    pitch: 'Listens to standups, auto-creates tasks in Linear, and pings ghosting teammates.',
    tags: ['AI', 'B2B'],
    heat: 94,
    builderCount: 12,
    isPersisted: false,
  },
  {
    id: '2',
    title: 'Stripe for creator payouts',
    pitch: 'One API to split revenue between creators, platforms, and collaborators. No spreadsheet hell.',
    tags: ['Fintech', 'API'],
    heat: 87,
    builderCount: 8,
    isPersisted: false,
  },
  {
    id: '3',
    title: 'Cursor but for design',
    pitch: 'AI pair designer in Figma. Suggests components, catches inconsistencies, writes design tokens.',
    tags: ['Design', 'AI'],
    heat: 91,
    builderCount: 5,
    isPersisted: false,
  },
];

const SCORE_SIGNALS = [
  { key: 'skillsFit',       label: 'Skills fit',      color: '#10b981', weight: '40%' },
  { key: 'ambitionScore',   label: 'Ambition match',  color: '#8b5cf6', weight: '30%' },
  { key: 'commitmentScore', label: 'Commitment',      color: '#f59e0b', weight: '20%' },
  { key: 'eloCompatibility',label: 'ELO range',       color: '#3b82f6', weight: '10%' },
];

function SwipeCard({ idea, onSwipe }) {
  const cardRef = useRef(null);
  const startX = useRef(null);
  const currentX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' | null

  const handlePointerDown = (e) => {
    startX.current = e.clientX;
    setDragging(true);
    cardRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!dragging || startX.current === null) return;
    const dx = e.clientX - startX.current;
    currentX.current = dx;
    setOffset(dx);
  };

  const handlePointerUp = () => {
    setDragging(false);
    const dx = currentX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      const dir = dx > 0 ? 'right' : 'left';
      setLeaving(dir);
      setTimeout(() => onSwipe(dir), 300);
    } else {
      setOffset(0);
    }
    startX.current = null;
    currentX.current = 0;
  };

  const rotate = offset * 0.06;
  const opacity = leaving ? 0 : 1;
  const translateX = leaving === 'right' ? 600 : leaving === 'left' ? -600 : offset;
  const transition = dragging ? 'none' : 'transform 0.3s ease, opacity 0.3s ease';

  return (
    <Box
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        width: { xs: 340, sm: 440 },
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        opacity,
        transition,
        position: 'relative',
      }}
    >
      {/* Swipe hint overlays */}
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: 4, zIndex: 2, pointerEvents: 'none',
        backgroundColor: '#16a34a', opacity: Math.max(0, Math.min(0.35, offset / 300)),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {offset > 40 && <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', border: '3px solid #fff', px: 2, py: 0.5, borderRadius: 2 }}>BUILD IT</Typography>}
      </Box>
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: 4, zIndex: 2, pointerEvents: 'none',
        backgroundColor: '#dc2626', opacity: Math.max(0, Math.min(0.35, -offset / 300)),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {offset < -40 && <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', border: '3px solid #fff', px: 2, py: 0.5, borderRadius: 2 }}>PASS</Typography>}
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Tags + heat */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {idea.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }} />
          ))}
          <Chip label={`🔥 ${idea.heat}% hot`} size="small" sx={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }} />
          <Chip label={`${idea.builderCount} building`} size="small" sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} />
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
          {idea.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6, mb: 3 }}>
          {idea.pitch}
        </Typography>

        {/* Match score breakdown */}
        <Box sx={{ pt: 2, borderTop: '1px solid #f3f4f6' }}>
          {SCORE_SIGNALS.map((signal) => {
            const val = idea.score?.[signal.key] ?? null;
            return (
              <Box key={signal.key} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: '#6b7280', width: 110, flexShrink: 0 }}>
                  {signal.label}
                </Typography>
                <Box sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
                  <Box sx={{
                    width: val !== null ? `${val}%` : '50%',
                    height: '100%',
                    borderRadius: 4,
                    backgroundColor: val !== null ? signal.color : '#d1d5db',
                    opacity: val !== null ? 1 : 0.4,
                    transition: 'width 0.5s ease',
                  }} />
                </Box>
                <Typography variant="caption" fontWeight={700} sx={{ width: 36, textAlign: 'right', color: val !== null ? '#111' : '#9ca3af' }}>
                  {val !== null ? `${val}` : '—'}
                </Typography>
              </Box>
            );
          })}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {idea.score ? 'Co-founder match score' : 'Swipe right to see your match score'}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color: idea.score ? '#111' : '#d1d5db' }}>
              {idea.score?.total ?? '?'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function SwipePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ideas, setIdeas] = useState(DEMO_IDEAS);
  const [current, setCurrent] = useState(0);
  const [matchNotice, setMatchNotice] = useState('');
  const [swiping, setSwiping] = useState(false);

  useEffect(() => {
    async function loadIdeas() {
      try {
        const res = await fetch(`${API}/api/ideas?tab=hot`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setIdeas(data.map((idea) => ({
            id: idea._id,
            title: idea.title,
            pitch: idea.description,
            tags: idea.tags || [],
            heat: idea.eloScore || 80,
            builderCount: idea.builderCount || 0,
            isPersisted: true,
          })));
        }
      } catch {
        // Fall back to demo ideas
      }
    }
    loadIdeas();
  }, []);

  const handleSwipe = async (direction) => {
    if (swiping) return;
    const swipedIdea = ideas[current];
    setCurrent((prev) => prev + 1);
    setMatchNotice('');

    if (!swipedIdea?.isPersisted || direction === 'up') return;

    setSwiping(true);
    try {
      const res = await fetch(`${API}/api/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ideaId: swipedIdea.id, direction }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.match?._id) {
        setMatchNotice(`You matched! Chat unlocked with ${data.match.users?.find(u => u._id !== user?._id)?.displayName || 'a founder'}.`);
        setTimeout(() => navigate(`/app/matches/${data.match._id}`, { state: { match: data.match } }), 1500);
      }
    } catch {
      //
    } finally {
      setSwiping(false);
    }
  };

  const idea = ideas[current];

  if (!idea) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>You've seen everything</Typography>
        <Typography sx={{ color: '#6b7280' }}>Check back later for new ideas.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 4 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700}>Swipe</Typography>
        <Typography sx={{ color: '#6b7280', mt: 0.5 }}>Discover startup ideas. Swipe right to build.</Typography>
      </Box>

      {matchNotice && (
        <Typography sx={{ color: '#047857', fontWeight: 700, backgroundColor: '#f0fdf4', px: 3, py: 1.5, borderRadius: 2, border: '1px solid #bbf7d0' }}>
          {matchNotice}
        </Typography>
      )}

      <SwipeCard key={idea.id} idea={idea} onSwipe={handleSwipe} />

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <IconButton
          onClick={() => handleSwipe('left')}
          sx={{ backgroundColor: '#fee2e2', width: 60, height: 60, '&:hover': { backgroundColor: '#fecaca' } }}
        >
          <CloseIcon sx={{ color: '#dc2626', fontSize: 28 }} />
        </IconButton>
        <IconButton
          onClick={() => handleSwipe('up')}
          sx={{ backgroundColor: '#f3f4f6', width: 48, height: 48, '&:hover': { backgroundColor: '#e5e7eb' } }}
        >
          <BookmarkIcon sx={{ color: '#6b7280' }} />
        </IconButton>
        <IconButton
          onClick={() => handleSwipe('right')}
          sx={{ backgroundColor: '#dcfce7', width: 60, height: 60, '&:hover': { backgroundColor: '#bbf7d0' } }}
        >
          <FavoriteIcon sx={{ color: '#16a34a', fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {ideas.map((_, i) => (
          <Box
            key={i}
            sx={{
              width: i === current ? 20 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === current ? '#1a1a1a' : i < current ? '#d1d5db' : '#e5e7eb',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </Box>

      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
        {ideas.length - current} idea{ideas.length - current !== 1 ? 's' : ''} left
      </Typography>
    </Box>
  );
}
