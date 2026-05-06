import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, IconButton, Chip, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SWIPE_THRESHOLD = 100;
const STORAGE_KEY = 'sviber_swiped_ids';

function getSwipedIds() {
  try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); }
  catch { return new Set(); }
}
function saveSwipedId(id) {
  try {
    const ids = getSwipedIds();
    ids.add(String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {}
}

const DEMO_IDEAS = [
  { id: 'd1', title: 'AI meeting notes that actually ship actions', pitch: 'Listens to standups, auto-creates tasks in Linear, and pings ghosting teammates.', tags: ['AI', 'B2B'], heat: 94, builderCount: 12, isPersisted: false },
  { id: 'd2', title: 'Stripe for creator payouts', pitch: 'One API to split revenue between creators, platforms, and collaborators. No spreadsheet hell.', tags: ['Fintech', 'API'], heat: 87, builderCount: 8, isPersisted: false },
  { id: 'd3', title: 'Cursor but for design', pitch: 'AI pair designer in Figma. Suggests components, catches inconsistencies, writes design tokens.', tags: ['Design', 'AI'], heat: 91, builderCount: 5, isPersisted: false },
  { id: 'd4', title: 'YC application co-pilot', pitch: 'Trained on every funded YC application. Tells you exactly what to fix before you submit.', tags: ['AI', 'Founders'], heat: 96, builderCount: 21, isPersisted: false },
  { id: 'd5', title: 'Ramp for college students', pitch: 'Corporate card and spend tracking built for student orgs and hackathon clubs. Auto-reconciles reimbursements.', tags: ['Fintech', 'EdTech'], heat: 78, builderCount: 6, isPersisted: false },
  { id: 'd6', title: 'Background check for freelancers', pitch: 'Instant trust score for contractors — GitHub activity, past client reviews, on-time delivery rate. Like a credit score but for builders.', tags: ['B2B', 'Marketplace'], heat: 82, builderCount: 9, isPersisted: false },
  { id: 'd7', title: 'Vercel for mobile apps', pitch: 'Push to deploy React Native. Preview links for every PR. No Xcode, no TestFlight drama.', tags: ['DevTools', 'Mobile'], heat: 89, builderCount: 14, isPersisted: false },
  { id: 'd8', title: 'OpenTable but for study rooms', pitch: 'Book library pods, café corners, and campus quiet zones in one app. Waitlist notifications when a spot opens.', tags: ['EdTech', 'Consumer'], heat: 71, builderCount: 3, isPersisted: false },
  { id: 'd9', title: 'Duolingo for system design', pitch: 'Daily bite-sized system design challenges with spaced repetition. Built for new grads prepping for FAANG.', tags: ['EdTech', 'AI'], heat: 85, builderCount: 17, isPersisted: false },
  { id: 'd10', title: 'Equity calculator for early hires', pitch: 'Enter your offer, the company stage, and dilution assumptions — get a plain-English breakdown of what your options are actually worth.', tags: ['Fintech', 'Founders'], heat: 88, builderCount: 11, isPersisted: false },
  { id: 'd11', title: 'On-demand TA for coding bootcamps', pitch: 'AI tutor that unblocks students in under 2 minutes. Escalates to a human when it can\'t solve it. Bootcamps pay per resolution.', tags: ['EdTech', 'AI'], heat: 80, builderCount: 7, isPersisted: false },
  { id: 'd12', title: 'Loom but async and structured', pitch: 'Record walkthroughs with automatic chapters, action item extraction, and searchable transcripts. Built for remote engineering teams.', tags: ['B2B', 'AI'], heat: 83, builderCount: 10, isPersisted: false },
];

function SwipeCard({ idea, onSwipe }) {
  const cardRef = useRef(null);
  const startX = useRef(null);
  const currentX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [leaving, setLeaving] = useState(null);

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
      setTimeout(() => onSwipe(dir), 280);
    } else {
      setOffset(0);
    }
    startX.current = null;
    currentX.current = 0;
  };

  const rotate = offset * 0.06;
  const translateX = leaving === 'right' ? 600 : leaving === 'left' ? -600 : offset;
  const transition = dragging ? 'none' : 'transform 0.28s ease, opacity 0.28s ease';

  return (
    <Box
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        width: { xs: 320, sm: 440 },
        borderRadius: 4,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
        overflow: 'hidden',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transform: `translateX(${translateX}px) rotate(${rotate}deg)`,
        opacity: leaving ? 0 : 1,
        transition,
        position: 'relative',
      }}
    >
      {/* Green overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: 4, zIndex: 2, pointerEvents: 'none',
        backgroundColor: '#16a34a',
        opacity: Math.max(0, Math.min(0.3, offset / 300)),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {offset > 50 && (
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', border: '3px solid #fff', px: 2, py: 0.5, borderRadius: 2 }}>
            BUILD IT
          </Typography>
        )}
      </Box>

      {/* Red overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: 4, zIndex: 2, pointerEvents: 'none',
        backgroundColor: '#dc2626',
        opacity: Math.max(0, Math.min(0.3, -offset / 300)),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {offset < -50 && (
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', border: '3px solid #fff', px: 2, py: 0.5, borderRadius: 2 }}>
            PASS
          </Typography>
        )}
      </Box>

      <Box sx={{ p: 3 }}>
        {/* Tags */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {idea.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" sx={{ backgroundColor: '#f0fdf4', color: '#166534', fontWeight: 600, fontSize: '0.75rem' }} />
          ))}
          <Chip label={`🔥 ${idea.heat}%`} size="small" sx={{ backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 600, fontSize: '0.75rem' }} />
          <Chip label={`👥 ${idea.builderCount} building`} size="small" sx={{ backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} />
        </Box>

        <Typography variant="h6" fontWeight={700} sx={{ mb: 1, lineHeight: 1.3 }}>
          {idea.title}
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6, mb: 3 }}>
          {idea.pitch}
        </Typography>

        {/* Idea stats */}
        <Box sx={{ pt: 2, borderTop: '1px solid #f3f4f6' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', width: 90, flexShrink: 0 }}>Heat</Typography>
            <Box sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
              <Box sx={{ width: `${idea.heat}%`, height: '100%', borderRadius: 4, backgroundColor: '#f59e0b' }} />
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ width: 36, textAlign: 'right' }}>{idea.heat}%</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#6b7280', width: 90, flexShrink: 0 }}>Interest</Typography>
            <Box sx={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: '#f3f4f6', overflow: 'hidden' }}>
              <Box sx={{ width: `${Math.min(100, idea.builderCount * 8)}%`, height: '100%', borderRadius: 4, backgroundColor: '#3b82f6' }} />
            </Box>
            <Typography variant="caption" fontWeight={700} sx={{ width: 36, textAlign: 'right' }}>{idea.builderCount}</Typography>
          </Box>

          <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>
              Match score unlocks after two founders pick the same idea.
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
  const [ideas, setIdeas] = useState([]);
  const [current, setCurrent] = useState(0);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const swiped = getSwipedIds();
      try {
        const res = await fetch(`${API}/api/ideas?tab=hot&limit=50`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const filtered = data
              .filter((idea) => !swiped.has(String(idea._id)))
              .map((idea) => ({
                id: idea._id,
                title: idea.title,
                pitch: idea.description,
                tags: idea.tags || [],
                heat: idea.eloScore || 80,
                builderCount: idea.builderCount || 0,
                isPersisted: true,
              }));
            setIdeas(filtered.length > 0 ? filtered : DEMO_IDEAS.filter(d => !swiped.has(d.id)));
            setLoading(false);
            return;
          }
        }
      } catch {}
      setIdeas(DEMO_IDEAS.filter(d => !swiped.has(d.id)));
      setLoading(false);
    }
    load();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSwipe = async (direction) => {
    const swipedIdea = ideas[current];
    if (!swipedIdea) return;

    saveSwipedId(swipedIdea.id);
    setCurrent((prev) => prev + 1);

    if (direction === 'up') {
      showToast('Saved for later');
      return;
    }
    if (direction === 'left') {
      showToast('Passed');
      return;
    }

    // right swipe
    showToast('Looking for co-founders on this idea...');

    if (!swipedIdea.isPersisted) return;

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
        const partner = data.match.users?.find(u => String(u._id) !== String(user?._id));
        showToast(`Matched with ${partner?.displayName || 'a founder'}! Opening chat...`);
        setTimeout(() => navigate(`/app/matches/${data.match._id}`, { state: { match: data.match } }), 1500);
      }
    } catch {}
  };

  const idea = ideas[current];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '70vh' }}>
        <Typography sx={{ color: '#6b7280' }}>Loading ideas...</Typography>
      </Box>
    );
  }

  if (!idea) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '70vh', gap: 2 }}>
        <Typography variant="h5" fontWeight={700}>You've seen everything</Typography>
        <Typography sx={{ color: '#6b7280' }}>Check back later for new ideas.</Typography>
        <Button
          variant="outlined"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            window.location.reload();
          }}
          sx={{ mt: 1, textTransform: 'none', borderRadius: 2 }}
        >
          Reset and start over
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 3 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h4" fontWeight={700}>Swipe</Typography>
        <Typography sx={{ color: '#6b7280', mt: 0.5 }}>Discover startup ideas. Swipe right to build.</Typography>
      </Box>

      {toast && (
        <Box sx={{ px: 3, py: 1.25, backgroundColor: '#1a1a1a', borderRadius: 2 }}>
          <Typography sx={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{toast}</Typography>
        </Box>
      )}

      <SwipeCard key={`${idea.id}-${current}`} idea={idea} onSwipe={handleSwipe} />

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <IconButton onClick={() => handleSwipe('left')} sx={{ backgroundColor: '#fee2e2', width: 60, height: 60, '&:hover': { backgroundColor: '#fecaca' } }}>
          <CloseIcon sx={{ color: '#dc2626', fontSize: 28 }} />
        </IconButton>
        <IconButton onClick={() => handleSwipe('up')} sx={{ backgroundColor: '#f3f4f6', width: 48, height: 48, '&:hover': { backgroundColor: '#e5e7eb' } }}>
          <BookmarkIcon sx={{ color: '#6b7280' }} />
        </IconButton>
        <IconButton onClick={() => handleSwipe('right')} sx={{ backgroundColor: '#dcfce7', width: 60, height: 60, '&:hover': { backgroundColor: '#bbf7d0' } }}>
          <FavoriteIcon sx={{ color: '#16a34a', fontSize: 28 }} />
        </IconButton>
      </Box>

      {/* Progress dots */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {ideas.slice(0, 10).map((_, i) => (
          <Box key={i} sx={{
            width: i === current ? 20 : 8, height: 8, borderRadius: 4,
            backgroundColor: i === current ? '#1a1a1a' : i < current ? '#d1d5db' : '#e5e7eb',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </Box>

      <Typography variant="caption" sx={{ color: '#9ca3af' }}>
        {Math.max(0, ideas.length - current)} idea{ideas.length - current !== 1 ? 's' : ''} left
      </Typography>
    </Box>
  );
}
