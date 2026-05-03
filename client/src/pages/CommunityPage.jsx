import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { ArrowUpward as SendIcon } from '@mui/icons-material';

// ─── colour helpers ────────────────────────────────────────────────────────────
const PURPLE = '#7C5CFC';
const GREEN = '#00E5A0';

// ─── static seed data ─────────────────────────────────────────────────────────
const SEED_MESSAGES = [
  {
    id: 1,
    type: 'system-issue',
    content: 'Missing fallback when pyannote model fails - wrap in try/catch and degrade gracefully',
    issueNumber: 2,
    dateDivider: null,
  },
  {
    id: 2,
    type: 'divider',
    label: 'today',
  },
  {
    id: 3,
    type: 'user',
    sender: 'DD',
    senderColor: GREEN,
    senderInitials: 'DD',
    time: '9:41 AM',
    alignRight: true,
    content: 'hey @sarvagya -- i pushed the linear integration. @AI can you summarize whats\'s left before we can demo?',
    highlights: ['@sarvagya', '@AI'],
  },
  {
    id: 4,
    type: 'ai',
    time: '9:41 AM',
    summary: {
      title: 'PROJECT SUMMARY',
      subtitle: '3 things blocking the demo:',
      items: [
        { text: 'Speaker diarization (SVB-007) - assigned to sarvagya, in progress' },
        { text: 'Action item extraction accuracy < 80% on edge cases - no owner' },
        { text: 'Auth flow for Linear OAuth - needs design approval' },
      ],
    },
  },
  {
    id: 5,
    type: 'elo-event',
    text: 'Linear integration merged  - ELO event triggered',
    delta: '+4 ELO',
  },
  {
    id: 6,
    type: 'user',
    sender: 'sarvagya s.',
    senderColor: '#F5A623',
    senderInitials: 'SS',
    time: '10:03 AM',
    alignRight: false,
    content: 'sorry was locked in -- diarization is now working actually. pushing in 20 mins. can we call then?',
    highlights: [],
  },
];

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

function TopBar({ channel, eloScore }) {
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

        {/* User avatars */}
        <Avatar
          sx={{
            width: 30,
            height: 30,
            backgroundColor: '#F5A623',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          SS
        </Avatar>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            backgroundColor: GREEN,
            fontSize: '0.68rem',
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          DD
        </Avatar>
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

export default function CommunityPage() {
  const [messages, setMessages] = useState(SEED_MESSAGES);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text) => {
    const newMsg = {
      id: Date.now(),
      type: 'user',
      sender: 'you',
      senderColor: GREEN,
      senderInitials: 'DD',
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      alignRight: true,
      content: text,
      highlights: [],
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#F2F2F2',
      }}
    >
      <TopBar channel="general" eloScore={88} />

      {/* Messages scroll area */}
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

      <MessageInput channel="general" onSend={handleSend} />
    </Box>
  );
}