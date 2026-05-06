import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const demoIdeas = [
  {
    id: 1,
    title: 'AI meeting notes that actually ship actions',
    pitch: 'Notes app that listens to standups, auto-creates tasks in Linear, and pings ghosting teammates. Built for founder-mode teams.',
    tags: ['AI', 'B2B'],
    heat: 94,
    matchScore: 88,
  },
  {
    id: 2,
    title: 'Stripe for creator payouts',
    pitch: 'One API to split revenue between creators, platforms, and collaborators. No more spreadsheet hell.',
    tags: ['Fintech', 'API'],
    heat: 87,
    matchScore: 73,
  },
  {
    id: 3,
    title: 'Cursor but for design',
    pitch: 'AI pair designer that lives in Figma. Suggests components, catches inconsistencies, and writes your design tokens.',
    tags: ['Design', 'AI'],
    heat: 91,
    matchScore: 65,
  },
];

export default function SwipePage() {
  const navigate = useNavigate();
  const [ideas, setIdeas] = useState(demoIdeas);
  const [current, setCurrent] = useState(0);
  const [matchNotice, setMatchNotice] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadIdeas() {
      try {
        const res = await fetch(
          `${API}/api/ideas?tab=hot&excludeOwn=true&excludeSwiped=true`,
          { credentials: 'include' }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!ignore && Array.isArray(data) && data.length > 0) {
          setIdeas(data.map((idea) => ({
            id: idea._id,
            title: idea.title,
            pitch: idea.description,
            tags: idea.tags || [],
            heat: idea.eloScore || 80,
            matchScore: 0,
            isPersisted: true,
          })));
        }
      } catch {
        // Keep demo cards available when the API is not running locally.
      }
    }

    loadIdeas();
    return () => {
      ignore = true;
    };
  }, []);

  const handleSwipe = async (direction) => {
    const swipedIdea = ideas[current];
    setCurrent((prev) => prev + 1);

    if (!swipedIdea?.isPersisted) return;

    try {
      const res = await fetch(`${API}/api/swipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ideaId: swipedIdea.id, direction }),
      });
      if (!res.ok) return;

      const data = await res.json();
      const firstMatch = data.match || data.matches?.[0];
      if (firstMatch?._id) {
        setMatchNotice('Match found. Chat is unlocked.');
        navigate(`/app/matches/${firstMatch._id}`, { state: { match: firstMatch } });
      }
    } catch {
      setMatchNotice('');
    }
  };

  const idea = ideas[current];

  if (!idea) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>You've seen everything 🎉</Typography>
        <Typography sx={{ color: '#6b7280' }}>Check back later for new ideas.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 4 }}>
      <Typography variant="h4" fontWeight={700}>Swipe</Typography>
      <Typography sx={{ color: '#6b7280', mt: -3 }}>Discover startup ideas and swipe to build.</Typography>
      {matchNotice && (
        <Typography sx={{ color: '#047857', fontWeight: 700, mt: -2 }}>{matchNotice}</Typography>
      )}

      {/* Card */}
      <Box
        sx={{
          width: 480,
          minHeight: 380,
          borderRadius: 4,
          border: '1px solid #e5e7eb',
          backgroundColor: '#fff',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >

        <Box sx={{ p: 3 }}>
          {/* Tags + heat */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            {idea.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }} />
            ))}
            <Chip label={`🔥 ${idea.heat}% hot`} size="small" sx={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }} />
          </Box>

          {/* Title */}
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
            {idea.title}
          </Typography>

          {/* Pitch */}
          <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6, mb: 3 }}>
            {idea.pitch}
          </Typography>

          {/* Match breakdown */}
<Box sx={{ pt: 2, borderTop: '1px solid #f3f4f6' }}>
  {[
    { label: 'Same idea', pct: 40, color: '#3b82f6' },
    { label: 'Skills fit', pct: 30, color: '#10b981' },
    { label: 'Similar ELO', pct: 20, color: '#8b5cf6' },
    { label: 'Active', pct: 10, color: '#f59e0b' },
  ].map((signal) => (
    <Box key={signal.label} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
      <Typography variant="caption" sx={{ color: '#6b7280', width: 80, flexShrink: 0 }}>
        {signal.label}
      </Typography>
      <Box sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
        <Box sx={{ width: `${signal.pct * 2.5}%`, height: '100%', borderRadius: 4, backgroundColor: signal.color }} />
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ width: 32, textAlign: 'right' }}>
        {signal.pct}%
      </Typography>
    </Box>
  ))}
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
    <Typography variant="body2" sx={{ color: '#6b7280' }}>Match score</Typography>
    <Typography variant="h4" fontWeight={800}>{idea.matchScore}</Typography>
  </Box>
</Box>
        </Box>
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <IconButton onClick={() => handleSwipe('left')} sx={{ backgroundColor: '#fee2e2', width: 56, height: 56, '&:hover': { backgroundColor: '#fecaca' } }}>
          <CloseIcon sx={{ color: '#dc2626' }} />
        </IconButton>
        <IconButton onClick={() => handleSwipe('up')} sx={{ backgroundColor: '#f3f4f6', width: 48, height: 48, '&:hover': { backgroundColor: '#e5e7eb' } }}>
          <BookmarkIcon sx={{ color: '#6b7280' }} />
        </IconButton>
        <IconButton onClick={() => handleSwipe('right')} sx={{ backgroundColor: '#dcfce7', width: 56, height: 56, '&:hover': { backgroundColor: '#bbf7d0' } }}>
          <FavoriteIcon sx={{ color: '#16a34a' }} />
        </IconButton>
      </Box>

      {/* Dots */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {ideas.map((_, i) => (
          <Box key={i} sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: i === current ? '#1a1a1a' : '#d1d5db' }} />
        ))}
      </Box>
    </Box>
  );
}
