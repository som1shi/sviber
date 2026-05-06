import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function userId(user) {
  return user?._id || user?.id;
}

function userName(user) {
  return user?.displayName || user?.name || 'Founder';
}

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'F';
}

function canStartChat(match) {
  return Boolean(match?._id && match?.idea && match?.users?.length === 2);
}

function MatchCard({ match, currentUserId, onOpenChat }) {
  const partner = match.users?.find((user) => userId(user) !== currentUserId) || match.users?.[0];
  const partnerName = userName(partner);
  const score = match.score?.total ?? 0;
  const qualified = canStartChat(match);

  return (
    <Paper
      sx={{
        p: 3,
        border: '1px solid #e5e7eb',
        borderRadius: 2,
        boxShadow: 'none',
        backgroundColor: '#fff',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
        <Avatar
          src={partner?.avatar || partner?.profilePic}
          sx={{ width: 48, height: 48, bgcolor: '#111827', fontWeight: 800 }}
        >
          {initials(partnerName)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 800, fontSize: 18 }}>{partnerName}</Typography>
            <Chip
              label={`${score} match`}
              size="small"
              sx={{ bgcolor: '#ecfdf5', color: '#047857', fontWeight: 800, flexShrink: 0 }}
            />
          </Box>

          <Typography sx={{ color: '#6b7280', fontSize: 14, mb: 2 }}>
            Both founders swiped right on the same idea.
          </Typography>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f9fafb', border: '1px solid #eef2f7' }}>
            <Typography sx={{ color: '#6b7280', fontSize: 12, fontWeight: 700, mb: 0.5 }}>
              Matched idea
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>{match.idea?.title || 'Untitled idea'}</Typography>
            {match.idea?.description && (
              <Typography sx={{ color: '#6b7280', fontSize: 14, mt: 0.75, lineHeight: 1.5 }}>
                {match.idea.description}
              </Typography>
            )}
            {match.idea?.tags?.length > 0 && (
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {match.idea.tags.map((tag) => (
                  <Chip key={tag} label={tag} size="small" sx={{ bgcolor: '#eef2ff', color: '#3730a3' }} />
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography sx={{ color: qualified ? '#047857' : '#6b7280', fontSize: 13, fontWeight: 700 }}>
              {qualified ? 'Chat unlocked' : 'Waiting for a complete founder match'}
            </Typography>
            <Button
              variant="contained"
              startIcon={qualified ? <ChatBubbleOutlineIcon /> : <LockOutlinedIcon />}
              disabled={!qualified}
              onClick={() => onOpenChat(match)}
              sx={{ bgcolor: '#111827', '&:hover': { bgcolor: '#374151' }, borderRadius: 2, textTransform: 'none' }}
            >
              Start chat
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    async function loadMatches() {
      try {
        const res = await fetch(`${API}/api/matches`, { credentials: 'include' });
        if (!res.ok) throw new Error('Unable to load matches');
        const data = await res.json();
        if (!ignore) setMatches(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadMatches();
    return () => {
      ignore = true;
    };
  }, []);

  const chatReadyMatches = useMemo(() => matches.filter(canStartChat), [matches]);
  const currentUserId = userId(user);

  const openChat = (match) => {
    navigate(`/app/matches/${match._id}`, { state: { match } });
  };

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 3, alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Matches
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>
            Chat opens only after two founders pick the same idea.
          </Typography>
        </Box>
        <Chip
          icon={<FavoriteIcon />}
          label={`${chatReadyMatches.length} chat ready`}
          sx={{ bgcolor: '#fff', border: '1px solid #e5e7eb', fontWeight: 800 }}
        />
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && error && (
        <Paper sx={{ p: 4, borderRadius: 2, border: '1px solid #fee2e2', bgcolor: '#fef2f2', boxShadow: 'none' }}>
          <Typography sx={{ fontWeight: 800, color: '#991b1b', mb: 1 }}>Could not load matches</Typography>
          <Typography sx={{ color: '#7f1d1d' }}>{error}</Typography>
        </Paper>
      )}

      {!loading && !error && matches.length === 0 && (
        <Paper
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: '#f9fafb',
            border: '2px dashed #e5e7eb',
            borderRadius: 2,
            boxShadow: 'none',
          }}
        >
          <FavoriteIcon sx={{ fontSize: 48, color: '#d1d5db', mb: 2 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
            No founder matches yet
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280', maxWidth: 420, mx: 'auto' }}>
            Swipe right on ideas you want to build. When another founder chooses the same idea, chat unlocks here.
          </Typography>
        </Paper>
      )}

      {!loading && !error && matches.length > 0 && (
        <Stack spacing={2}>
          {matches.map((match) => (
            <MatchCard key={match._id} match={match} currentUserId={currentUserId} onOpenChat={openChat} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
