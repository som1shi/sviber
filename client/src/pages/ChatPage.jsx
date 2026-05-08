import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import socket from '../socket';
import {
 Box,
 Typography,
 Avatar,
 TextField,
 IconButton,
 InputAdornment,
 Button,
 CircularProgress,
 Dialog,
 DialogContent,
 Chip,
} from '@mui/material';
import { ArrowUpward as SendIcon, Close as CloseIcon, GitHub as GitHubIcon, Delete as DeleteIcon, Build as BuildIcon, ChevronRight as ChevronRightIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';


// ─── colour helpers ────────────────────────────────────────────────────────────
const PURPLE = '#7C5CFC';
const GREEN = '#00E5A0';

// ─── sub-components ───────────────────────────────────────────────────────────


function DateDivider({ label }) {
 return (
   <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2, px: 3 }}>
     <Box sx={{ flex: 1, height: '1px', backgroundColor: PURPLE, opacity: 0.5 }} />
     <Typography
       sx={{
         fontSize: '0.75rem',
         fontFamily: '"DM Mono", monospace',
         fontWeight: 700,
         color: '#1a1a1a',
         letterSpacing: '0.05em',
       }}
     >
       {label}
     </Typography>
     <Box sx={{ flex: 1, height: '1px', backgroundColor: PURPLE, opacity: 0.5 }} />
   </Box>
 );
}


function SystemIssue({ issueNumber, content }) {
 return (
   <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 3, mb: 2 }}>
     <Box
       sx={{
         backgroundColor: '#1E1E1E',
         borderRadius: 3,
         px: 2.5,
         py: 1.75,
         maxWidth: 480,
       }}
     >
       <Typography
         sx={{
           fontSize: '0.88rem',
           color: '#FFFFFF',
           lineHeight: 1.55,
           fontFamily: '"DM Sans", sans-serif',
         }}
       >
         <Box
           component="span"
           sx={{ color: PURPLE, fontWeight: 700, mr: 0.5 }}
         >
           Issue {issueNumber}:
         </Box>
         {content}
       </Typography>
     </Box>
   </Box>
 );
}


function EloEvent({ text, delta }) {
 return (
   <Box
     sx={{
       mx: 3,
       my: 1.5,
       backgroundColor: '#1E1E1E',
       borderRadius: 2,
       px: 2.5,
       py: 1.25,
       display: 'flex',
       justifyContent: 'space-between',
       alignItems: 'center',
     }}
   >
     <Typography
       sx={{
         fontSize: '0.82rem',
         color: '#FFFFFF',
         fontFamily: '"DM Sans", sans-serif',
         fontWeight: 500,
       }}
     >
       {text}
     </Typography>
     <Typography
       sx={{
         fontSize: '0.82rem',
         color: GREEN,
         fontFamily: '"DM Mono", monospace',
         fontWeight: 700,
       }}
     >
       {delta}
     </Typography>
   </Box>
 );
}


function highlightText(text, highlights) {
 if (!highlights || highlights.length === 0) return text;
 const parts = text.split(new RegExp(`(${highlights.join('|')})`, 'g'));
 return parts.map((part, i) =>
   highlights.includes(part)
     ? <Box key={i} component="span" sx={{ color: PURPLE, fontWeight: 700 }}>{part}</Box>
     : part
 );
}


function UserMessage({ msg }) {
 return (
   <Box
     sx={{
       display: 'flex',
       flexDirection: msg.alignRight ? 'row-reverse' : 'row',
       alignItems: 'flex-start',
       gap: 1.5,
       px: 3,
       mb: 2,
     }}
   >
     {/* Avatar — only for left-aligned messages */}
     {!msg.alignRight && (
       <Avatar
         sx={{
           width: 34,
           height: 34,
           backgroundColor: msg.senderColor,
           fontSize: '0.72rem',
           fontWeight: 700,
           color: '#1a1a1a',
           fontFamily: '"DM Mono", monospace',
           flexShrink: 0,
           mt: 0.25,
         }}
       >
         {msg.senderInitials}
       </Avatar>
     )}


     <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.alignRight ? 'flex-end' : 'flex-start', maxWidth: 520 }}>
       {/* Meta row */}
       <Box
         sx={{
           display: 'flex',
           alignItems: 'center',
           gap: 1,
           mb: 0.5,
           flexDirection: msg.alignRight ? 'row-reverse' : 'row',
         }}
       >
         <Typography
           sx={{
             fontSize: '0.75rem',
             color: '#888',
             fontFamily: '"DM Mono", monospace',
           }}
         >
           {msg.time}
         </Typography>
         {msg.alignRight && (
           <Typography
             sx={{
               fontSize: '0.75rem',
               color: '#888',
               fontFamily: '"DM Mono", monospace',
             }}
           >
             you
           </Typography>
         )}
         {!msg.alignRight && (
           <Typography
             sx={{
               fontSize: '0.78rem',
               fontWeight: 600,
               color: '#1a1a1a',
               fontFamily: '"DM Sans", sans-serif',
             }}
           >
             {msg.sender}
           </Typography>
         )}
       </Box>


       {/* Bubble */}
       <Box
         sx={{
           backgroundColor: '#1E1E1E',
           borderRadius: 3,
           px: 2.5,
           py: 1.75,
         }}
       >
         <Typography
           sx={{
             fontSize: '0.9rem',
             color: '#FFFFFF',
             lineHeight: 1.6,
             fontFamily: '"DM Sans", sans-serif',
           }}
         >
           {highlightText(msg.content, msg.highlights)}
         </Typography>
       </Box>
     </Box>


     {/* Right-side avatar */}
     {msg.alignRight && (
       <Avatar
         sx={{
           width: 34,
           height: 34,
           backgroundColor: msg.senderColor,
           fontSize: '0.72rem',
           fontWeight: 700,
           color: '#1a1a1a',
           fontFamily: '"DM Mono", monospace',
           flexShrink: 0,
           mt: 0.25,
         }}
       >
         {msg.senderInitials}
       </Avatar>
     )}
   </Box>
 );
}


function AiMessage({ msg }) {
 return (
   <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 1.5, px: 3, mb: 2 }}>
     {/* AI avatar */}
     <Avatar
       sx={{
         width: 34,
         height: 34,
         backgroundColor: PURPLE,
         fontSize: '0.72rem',
         fontWeight: 700,
         color: '#fff',
         fontFamily: '"DM Mono", monospace',
         flexShrink: 0,
         mt: 0.25,
       }}
     >
       AI
     </Avatar>


     <Box sx={{ maxWidth: 560 }}>
       {/* Meta */}
       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
         <Typography
           sx={{
             fontSize: '0.78rem',
             fontWeight: 600,
             color: '#1a1a1a',
             fontFamily: '"DM Sans", sans-serif',
           }}
         >
           sviber ai
         </Typography>
         <Typography
           sx={{
             fontSize: '0.75rem',
             color: '#888',
             fontFamily: '"DM Mono", monospace',
           }}
         >
           9:41 AM
         </Typography>
       </Box>


       {/* AI bubble */}
       <Box
         sx={{
           backgroundColor: '#1E1E1E',
           borderRadius: 3,
           px: 2.5,
           py: 2,
         }}
       >
         <Typography
           sx={{
             fontSize: '0.78rem',
             color: PURPLE,
             fontWeight: 700,
             fontFamily: '"DM Mono", monospace',
             letterSpacing: '0.08em',
             mb: 1,
           }}
         >
           {msg.summary.title}
         </Typography>
         <Typography
           sx={{
             fontSize: '0.9rem',
             color: '#FFFFFF',
             fontWeight: 700,
             fontFamily: '"DM Sans", sans-serif',
             mb: 1.25,
           }}
         >
           {msg.summary.subtitle}
         </Typography>
         <Box component="ol" sx={{ pl: 2, m: 0 }}>
           {msg.summary.items.map((item, i) => (
             <Box
               key={i}
               component="li"
               sx={{
                 fontSize: '0.88rem',
                 color: '#FFFFFF',
                 lineHeight: 1.6,
                 fontFamily: '"DM Sans", sans-serif',
                 mb: i < msg.summary.items.length - 1 ? 0.5 : 0,
               }}
             >
               {item.text}
             </Box>
           ))}
         </Box>
       </Box>
     </Box>
   </Box>
 );
}


// ─── top bar ──────────────────────────────────────────────────────────────────


function TopBar({ channel, eloScore, users = [], onUserClick, onDelete }) {
 return (
   <Box
     sx={{
       display: 'flex',
       alignItems: 'center',
       justifyContent: 'space-between',
       px: 3,
       py: 1.5,
       borderBottom: '1px solid rgba(0,0,0,0.08)',
       backgroundColor: '#F2F2F2',
       flexShrink: 0,
     }}
   >
     <Typography
       sx={{
         fontFamily: '"DM Mono", monospace',
         fontWeight: 500,
         fontSize: '1rem',
         color: '#1a1a1a',
       }}
     >
       #{channel}
     </Typography>


     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
       {/* ELO badge */}
       <Typography
         sx={{
           fontFamily: '"DM Mono", monospace',
           fontSize: '0.88rem',
           color: '#888',
         }}
       >
         elo{' '}
         <Box component="span" sx={{ color: PURPLE, fontWeight: 700 }}>
           {eloScore}
         </Box>
       </Typography>


       {users.map((user, index) => (
         <Avatar
           key={user.id || user._id || index}
           src={user.avatar || user.profilePic}
           onClick={() => onUserClick?.(user)}
           sx={{
             width: 30,
             height: 30,
             backgroundColor: index === 0 ? '#F5A623' : GREEN,
             fontSize: '0.68rem',
             fontWeight: 700,
             color: '#1a1a1a',
             cursor: 'pointer',
             '&:hover': { opacity: 0.85, transform: 'scale(1.1)', transition: 'all 0.15s' },
           }}
         >
           {user.initials}
         </Avatar>
       ))}
       {onDelete && (
         <IconButton
           size="small"
           onClick={onDelete}
           title="Delete chat"
           sx={{ color: '#9ca3af', '&:hover': { color: '#ef4444' } }}
         >
           <DeleteIcon fontSize="small" />
         </IconButton>
       )}
     </Box>
   </Box>
 );
}


// ─── message input ────────────────────────────────────────────────────────────


function MessageInput({ channel, onSend }) {
 const [value, setValue] = useState('');


 const handleSend = () => {
   if (!value.trim()) return;
   onSend(value.trim());
   setValue('');
 };


 const handleKey = (e) => {
   if (e.key === 'Enter' && !e.shiftKey) {
     e.preventDefault();
     handleSend();
   }
 };


 return (
   <Box sx={{ px: 3, pb: 3, pt: 1.5, flexShrink: 0 }}>
     <Box
       sx={{
         display: 'flex',
         alignItems: 'center',
         backgroundColor: '#FFFFFF',
         borderRadius: 3,
         border: '1px solid rgba(0,0,0,0.08)',
         px: 2,
         py: 0.5,
       }}
     >
       <TextField
         fullWidth
         multiline
         maxRows={4}
         variant="standard"
         placeholder={`message #${channel} - type @ to mention, /ai to ask sviber assistant`}
         value={value}
         onChange={(e) => setValue(e.target.value)}
         onKeyDown={handleKey}
         InputProps={{
           disableUnderline: true,
           startAdornment: (
             <InputAdornment position="start">
               <Typography
                 sx={{
                   fontSize: '0.88rem',
                   color: '#888',
                   fontFamily: '"DM Mono", monospace',
                   mr: 0.5,
                   whiteSpace: 'nowrap',
                 }}
               >
                 message
               </Typography>
             </InputAdornment>
           ),
         }}
         sx={{
           '& .MuiInputBase-input': {
             fontFamily: '"DM Mono", monospace',
             fontSize: '0.88rem',
             color: '#1a1a1a',
             py: 1,
             '&::placeholder': { color: '#aaa', opacity: 1 },
           },
         }}
       />
       <IconButton
         onClick={handleSend}
         disabled={!value.trim()}
         sx={{
           ml: 1,
           width: 36,
           height: 36,
           backgroundColor: value.trim() ? '#1a1a1a' : '#1a1a1a',
           borderRadius: '50%',
           flexShrink: 0,
           '&:hover': { backgroundColor: '#333' },
           '&.Mui-disabled': { backgroundColor: '#1a1a1a', opacity: 0.5 },
         }}
       >
         <SendIcon sx={{ fontSize: 18, color: '#fff' }} />
       </IconButton>
     </Box>
   </Box>
 );
}


// ─── main page ────────────────────────────────────────────────────────────────

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';

function getUserId(user) {
  return user?._id || user?.id;
}

function getUserName(user) {
  const name = user?.name?.trim() || user?.displayName?.trim();
  if (name) return name;
  if (user?.email) return user.email.split('@')[0];
  return 'Founder';
}

function getInitials(name) {
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

function ProfileModal({ user: u, onClose, sharedProject }) {
  if (!u) return null;
  const name = u.name?.trim() || u.displayName?.trim() || (u.email ? u.email.split('@')[0] : null) || u.initials || 'Unknown';
  const role = u.role || u.title || 'Builder';
  const school = u.school || '';
  const bio = u.bio || '';
  const github = u.github || u.githubLink || '';
  const avatar = u.avatar || u.profilePic || '';
  const eloVal = typeof u.elo === 'object' ? (u.elo?.total ?? 1000) : (Number(u.elo) || 1000);
  const skills = Array.isArray(u.skills) ? u.skills : [];

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ p: 0, position: 'relative' }}>
        <IconButton onClick={onClose} sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}>
          <CloseIcon />
        </IconButton>
        <Box sx={{ p: 3, pt: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar src={avatar} sx={{ width: 64, height: 64, fontSize: '1.5rem', bgcolor: PURPLE }}>
              {name[0]}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{name}</Typography>
              <Typography sx={{ color: '#6b7280', fontSize: '0.9rem' }}>{role}</Typography>
              {school && <Typography sx={{ color: '#9ca3af', fontSize: '0.8rem' }}>{school}</Typography>}
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: PURPLE, mb: 2 }}>
            {eloVal} ELO
          </Typography>
          {bio && (
            <Typography sx={{ color: '#4b5563', fontSize: '0.9rem', lineHeight: 1.6, mb: 2 }}>
              {bio}
            </Typography>
          )}
          {skills.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {skills.map((s) => (
                <Chip key={s} label={s} size="small" sx={{ backgroundColor: '#f3f0ff', color: '#5b21b6', fontWeight: 500 }} />
              ))}
            </Box>
          )}
          {github && (
            <Button
              startIcon={<GitHubIcon />}
              href={github.startsWith('http') ? github : `https://${github}`}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              sx={{ color: '#1a1a1a', textTransform: 'none', p: 0, mb: sharedProject ? 2 : 0 }}
            >
              {github}
            </Button>
          )}
          {sharedProject && (
            <Box sx={{ mt: github ? 0 : 1, p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
                Active project together
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', mb: 0.25 }}>{sharedProject.name}</Typography>
              {sharedProject.description && (
                <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.4 }}>{sharedProject.description}</Typography>
              )}
              <Chip
                label={sharedProject.status}
                size="small"
                sx={{ mt: 0.75, height: 18, fontSize: '0.68rem', textTransform: 'capitalize',
                  backgroundColor: sharedProject.status === 'active' ? '#dcfce7' : '#f3f4f6',
                  color: sharedProject.status === 'active' ? '#16a34a' : '#6b7280' }}
              />
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function ChatPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { user } = useAuth();
  const [match, setMatch] = useState(state?.match || null);
  const [messages, setMessages] = useState([]);
  const [loadingMatch, setLoadingMatch] = useState(!state?.match);
  const [chatError, setChatError] = useState('');
  const [profileModal, setProfileModal] = useState(null);
  const [sharedProject, setSharedProject] = useState(null);
  const [allMatches, setAllMatches] = useState([]);

  // On every matchId change: reset state then always fetch fresh from API.
  // state?.match is used as an instant initial value to avoid a loading flash,
  // but we still fetch so stale nav state can't leave the chat stuck.
  useEffect(() => {
    if (!matchId) return;
    setMessages([]);
    setChatError('');

    if (state?.match) {
      setMatch(state.match);
      setLoadingMatch(false);
    } else {
      setMatch(null);
      setLoadingMatch(true);
    }

    let ignore = false;
    fetch(`${API}/api/matches/${matchId}`, { credentials: 'include' })
      .then((r) => {
        if (!r.ok) throw new Error('This chat is not available yet.');
        return r.json();
      })
      .then((data) => { if (!ignore) { setMatch(data); setLoadingMatch(false); } })
      .catch((err) => { if (!ignore) { setChatError(err.message); setLoadingMatch(false); } });

    return () => { ignore = true; };
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar: load all matches once
  useEffect(() => {
    fetch(`${API}/api/matches`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then(setAllMatches)
      .catch(() => {});
  }, []);

  const bottomRef = useRef(null);

  const me = {
    id: getUserId(user) || 'local-founder',
    initials: getInitials(getUserName(user)),
    color: GREEN,
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load history via HTTP — stable, works across refresh/re-navigation
  useEffect(() => {
    if (!canStartChat(match)) return;
    let ignore = false;

    fetch(`${API}/api/messages/${match._id}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : [])
      .then((history) => {
        if (ignore) return;
        const myId = getUserId(user);
        const loaded = history.map((m) => ({
          id: m._id,
          type: 'user',
          sender: m.senderInitials,
          senderColor: m.senderColor,
          senderInitials: m.senderInitials,
          time: new Date(m.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          alignRight: m.senderId === myId,
          content: m.content,
          highlights: [],
        }));
        setMessages(loaded);
      })
      .catch(() => {});

    return () => { ignore = true; };
  }, [match?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Join socket room; rejoin automatically if the server restarts
  useEffect(() => {
    if (!canStartChat(match)) return;

    const joinRoom = () => {
      socket.emit('join-room', match._id, ({ error } = {}) => {
        if (error) setChatError(error);
      });
    };

    joinRoom();
    socket.on('connect', joinRoom); // re-join after reconnect

    const myId = getUserId(user);
    const handleIncoming = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id,
          type: 'user',
          sender: msg.senderInitials,
          senderColor: msg.senderColor,
          senderInitials: msg.senderInitials,
          time: new Date(msg.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          alignRight: msg.senderId === myId,
          content: msg.content,
          highlights: [],
        },
      ]);
    };

    socket.on('chat-message', handleIncoming);
    return () => {
      socket.off('connect', joinRoom);
      socket.off('chat-message', handleIncoming);
    };
  }, [match?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback((text) => {
    if (!canStartChat(match)) return;

    // Add to UI immediately so the sender doesn't wait for the server
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'user',
        sender: 'you',
        senderColor: me.color,
        senderInitials: me.initials,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        alignRight: true,
        content: text,
        highlights: [],
      },
    ]);

    socket.emit('send-message', {
      matchId: match._id,
      senderId: me.id,
      senderInitials: me.initials,
      senderColor: me.color,
      content: text,
    });
  }, [match, me.color, me.id, me.initials]);

  const handleDelete = useCallback(async () => {
    if (!match?._id) return;
    if (!window.confirm('Delete this chat and all messages? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/api/matches/${match._id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error();
      navigate('/app/matches');
    } catch {
      // silent — chat stays open
    }
  }, [match, navigate]);

  if (loadingMatch) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', backgroundColor: '#F2F2F2' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (chatError || !canStartChat(match)) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', backgroundColor: '#F2F2F2', p: 4 }}>
        <Box sx={{ textAlign: 'center', maxWidth: 420 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            Chat is locked
          </Typography>
          <Typography sx={{ color: '#6b7280', mb: 3 }}>
            {chatError || 'Chat only starts after two founders match on the same idea.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/app/matches')} sx={{ bgcolor: '#111827', textTransform: 'none' }}>
            Back to matches
          </Button>
        </Box>
      </Box>
    );
  }

  const channel = match.idea?.title || `match-${match._id.slice(-4)}`;
  const topBarUsers = match.users.map((matchUser) => ({
    ...matchUser,
    id: getUserId(matchUser),
    initials: getInitials(getUserName(matchUser)),
  }));

  // Stable userId — used in sidebar partner detection.
  // getUserId returns undefined while auth is loading; that's fine, sidebar just
  // won't highlight the active partner until user resolves (one render cycle).
  const myId = getUserId(user) || me.id;

  return (
    <Box sx={{ display: 'flex', height: '100%', backgroundColor: '#F2F2F2' }}>

      {/* Matches sidebar */}
      {allMatches.length > 0 && (
        <Box sx={{
          width: 220,
          flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.08)',
          backgroundColor: '#EBEBEB',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Typography sx={{ px: 2, py: 1.5, fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Chats
          </Typography>
          {allMatches.map((m) => {
            const partner = m.users?.find((u) => String(u._id) !== String(myId));
            const partnerName = partner?.name?.trim() || partner?.displayName?.trim() || (partner?.email ? partner.email.split('@')[0] : null) || 'Builder';
            const isActive = m._id === matchId;
            return (
              <Box
                key={m._id}
                onClick={() => navigate(`/app/matches/${m._id}`, { state: { match: m } })}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  px: 2,
                  py: 1.25,
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(124,92,252,0.1)' : 'transparent',
                  borderLeft: isActive ? `3px solid ${PURPLE}` : '3px solid transparent',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' },
                }}
              >
                <Avatar
                  src={partner?.avatar || partner?.profilePic}
                  sx={{ width: 32, height: 32, fontSize: '0.75rem', bgcolor: PURPLE, flexShrink: 0 }}
                >
                  {partnerName[0]}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500, color: isActive ? PURPLE : '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {partnerName}
                  </Typography>
                  <Typography sx={{ fontSize: '0.72rem', color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {m.idea?.title || 'No idea'}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar
          channel={channel}
          eloScore={match.score?.total ?? 0}
          users={topBarUsers}
          onUserClick={(u) => {
            setProfileModal(u);
            setSharedProject(null);
            fetch(`${API}/api/projects`, { credentials: 'include' })
              .then((r) => r.ok ? r.json() : [])
              .then((projects) => {
                const uid = getUserId(u) || String(u._id);
                const found = projects.find((p) =>
                  p.contributors?.some((c) => String(c.user?._id || c.user) === uid)
                );
                setSharedProject(found || null);
              })
              .catch(() => {});
          }}
          onDelete={handleDelete}
        />

        <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
          {messages.map((msg) => {
            if (msg.type === 'divider') return <DateDivider key={msg.id} label={msg.label} />;
            if (msg.type === 'system-issue') return <SystemIssue key={msg.id} issueNumber={msg.issueNumber} content={msg.content} />;
            if (msg.type === 'elo-event') return <EloEvent key={msg.id} text={msg.text} delta={msg.delta} />;
            if (msg.type === 'ai') return <AiMessage key={msg.id} msg={msg} />;
            if (msg.type === 'user') return <UserMessage key={msg.id} msg={msg} />;
            return null;
          })}
          <div ref={bottomRef} />
        </Box>

        <MessageInput key={matchId} channel={channel} onSend={handleSend} />

        {/* Build together CTA */}
        <Box
          onClick={() => navigate(`/app/build/${match._id}`, { state: { match } })}
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            mx: 3, mb: 2.5, px: 2.5, py: 1.5,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${PURPLE} 0%, #5b3fcc 100%)`,
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(124,92,252,0.35)',
            transition: 'transform 0.15s, box-shadow 0.15s',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 6px 22px rgba(124,92,252,0.45)',
            },
            '&:active': { transform: 'translateY(0)' },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BuildIcon sx={{ color: '#fff', fontSize: 20 }} />
            <Box>
              <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '0.9rem', color: '#fff', lineHeight: 1.2 }}>
                Build together
              </Typography>
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', mt: 0.25 }}>
                generate a prototype · launch a github repo
              </Typography>
            </Box>
          </Box>
          <ChevronRightIcon sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
        </Box>
      </Box>

      {profileModal && <ProfileModal user={profileModal} onClose={() => { setProfileModal(null); setSharedProject(null); }} sharedProject={sharedProject} />}
    </Box>
  );
}
