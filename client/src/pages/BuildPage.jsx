import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, TextField, IconButton, LinearProgress, CircularProgress, Button } from '@mui/material';
import { ArrowUpward as SendIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const PURPLE = '#7C5CFC';
const GREEN  = '#00E5A0';

const PARTNER_COLORS = ['#F5A623', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'];

function getInitials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';
}

function getUserId(u) {
  return u?._id || u?.id;
}

function getUserName(u) {
  return u?.name || u?.displayName || 'Founder';
}

// ─── chat sub-components ──────────────────────────────────────────────────────

function now() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function makeAiMsg(text)   { return { id: Date.now() + Math.random(), from: 'ai',   text, time: now() }; }
function makeUserMsg(text) { return { id: Date.now() + Math.random(), from: 'user', text, time: now() }; }

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 3, mb: 2 }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: PURPLE, fontSize: '0.65rem', fontWeight: 700, color: '#fff', fontFamily: '"DM Mono", monospace', flexShrink: 0 }}>
        AI
      </Avatar>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: '#1E1E1E', borderRadius: 3, px: 2, py: 1.5 }}>
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 7, height: 7, borderRadius: '50%', bgcolor: PURPLE,
              animation: 'bounce 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.18}s`,
              '@keyframes bounce': {
                '0%, 80%, 100%': { transform: 'scale(0.7)', opacity: 0.4 },
                '40%': { transform: 'scale(1)', opacity: 1 },
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

function AiMessage({ msg }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 3, mb: 2 }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: PURPLE, fontSize: '0.65rem', fontWeight: 700, color: '#fff', fontFamily: '"DM Mono", monospace', flexShrink: 0, mt: 0.25 }}>
        AI
      </Avatar>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1a1a1a', fontFamily: '"DM Sans", sans-serif' }}>
            sviber ai
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#888', fontFamily: '"DM Mono", monospace' }}>
            {msg.time}
          </Typography>
        </Box>
        <Box sx={{ bgcolor: '#1E1E1E', borderRadius: 3, px: 2.5, py: 1.75, maxWidth: 380 }}>
          <Typography sx={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif', whiteSpace: 'pre-wrap' }}>
            {msg.text}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function UserMessage({ msg, initials, color }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 1.5, px: 3, mb: 2 }}>
      <Avatar sx={{ width: 34, height: 34, bgcolor: color, fontSize: '0.65rem', fontWeight: 700, color: '#1a1a1a', fontFamily: '"DM Mono", monospace', flexShrink: 0, mt: 0.25 }}>
        {initials}
      </Avatar>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexDirection: 'row-reverse' }}>
          <Typography sx={{ fontSize: '0.72rem', color: '#888', fontFamily: '"DM Mono", monospace' }}>you</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#888', fontFamily: '"DM Mono", monospace' }}>{msg.time}</Typography>
        </Box>
        <Box sx={{ bgcolor: '#1E1E1E', borderRadius: 3, px: 2.5, py: 1.75, maxWidth: 380 }}>
          <Typography sx={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, fontFamily: '"DM Sans", sans-serif' }}>
            {msg.text}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ─── right panel states ───────────────────────────────────────────────────────

function PreviewIdle() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2.5, px: 4 }}>
      <Box sx={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${PURPLE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '1.1rem', color: PURPLE }}>{'<>'}</Typography>
      </Box>
      <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.82rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center', lineHeight: 1.7 }}>
        answer the questions on the left{'\n'}and your app will appear here
      </Typography>
    </Box>
  );
}

function PreviewGenerating({ progress }) {
  const lines = [
    '> initializing project scaffold...',
    '> designing component tree...',
    '> writing business logic...',
    '> wiring up state management...',
    '> applying design system...',
    '> generating demo data...',
    '> compiling and bundling...',
    '> spinning up preview...',
  ];
  const visibleCount = Math.ceil((progress / 100) * lines.length);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.75rem', color: PURPLE, letterSpacing: '0.1em', mb: 1 }}>
          BUILDING YOUR APP
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3, borderRadius: 2, bgcolor: 'rgba(124,92,252,0.15)',
            '& .MuiLinearProgress-bar': { bgcolor: PURPLE, borderRadius: 2 },
          }}
        />
        <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', mt: 0.75 }}>
          {progress}% complete
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {lines.slice(0, visibleCount).map((line, i) => (
          <Typography
            key={i}
            sx={{
              fontFamily: '"DM Mono", monospace', fontSize: '0.78rem', lineHeight: 1.8,
              color: i === visibleCount - 1 ? GREEN : 'rgba(255,255,255,0.45)',
              animation: i === visibleCount - 1 ? 'fadeIn 0.3s ease' : 'none',
              '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
            }}
          >
            {line}
            {i === visibleCount - 1 && (
              <Box component="span" sx={{ display: 'inline-block', width: 8, height: 14, bgcolor: GREEN, ml: 0.5, verticalAlign: 'text-bottom', animation: 'blink 1s step-end infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
            )}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function PreviewLive({ html, repoUrl }) {
  return (
    <Box sx={{ position: 'relative', height: '100%', animation: 'fadeIn 0.6s ease', '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } } }}>
      <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, bgcolor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', px: 2, gap: 1, zIndex: 1 }}>
        {['#ff5f57', '#ffbd2e', '#28ca41'].map((c) => (
          <Box key={c} sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: c }} />
        ))}
        <Box sx={{ flex: 1, mx: 2, bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1, px: 1.5, py: 0.25 }}>
          <Typography
            component={repoUrl ? 'a' : 'span'}
            href={repoUrl || undefined}
            target={repoUrl ? '_blank' : undefined}
            rel={repoUrl ? 'noreferrer' : undefined}
            sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.68rem', color: repoUrl ? GREEN : 'rgba(255,255,255,0.4)', textDecoration: 'none', '&:hover': repoUrl ? { textDecoration: 'underline' } : {} }}
          >
            {repoUrl || 'sviber://preview/your-app'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: GREEN }} />
          <Typography sx={{ fontFamily: '"DM Mono", monospace', fontSize: '0.65rem', color: GREEN }}>live</Typography>
        </Box>
      </Box>
      <iframe
        srcDoc={html}
        sandbox="allow-scripts"
        title="Generated App Preview"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block', paddingTop: 36, boxSizing: 'border-box' }}
      />
    </Box>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function BuildPage() {
  const { matchId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [match, setMatch]               = useState(state?.match || null);
  const [loadingMatch, setLoadingMatch] = useState(!state?.match);
  const [matchError, setMatchError]     = useState('');

  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [phase, setPhase]                 = useState('intro');
  const [isTyping, setIsTyping]           = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState(null);
  const [buildProgress, setBuildProgress] = useState(0);
  const [q1Answer, setQ1Answer]           = useState('');
  const [repoUrl, setRepoUrl]             = useState(null);
  const bottomRef  = useRef(null);
  const progressRef = useRef(null);

  // Fetch match from API if not passed via router state
  useEffect(() => {
    if (!matchId) return;
    if (state?.match) { setLoadingMatch(false); return; }
    fetch(`${API}/api/matches/${matchId}`, { credentials: 'include' })
      .then((r) => { if (!r.ok) throw new Error('Match not found'); return r.json(); })
      .then((data) => { setMatch(data); setLoadingMatch(false); })
      .catch((err) => { setMatchError(err.message); setLoadingMatch(false); });
  }, [matchId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derive MATCH config from real data once loaded
  const matchConfig = (() => {
    if (!match || !user) return null;
    const myId = getUserId(user);
    const myUser     = match.users?.find((u) => String(getUserId(u)) === String(myId));
    const partnerUser = match.users?.find((u) => String(getUserId(u)) !== String(myId));
    const partnerName = getUserName(partnerUser);
    const colorSeed = String(getUserId(partnerUser) || '').slice(-1).charCodeAt(0) % PARTNER_COLORS.length;
    return {
      ideaTitle:       match.idea?.title || 'your idea',
      partnerName:     partnerName.toLowerCase(),
      partnerInitials: getInitials(partnerName),
      partnerColor:    PARTNER_COLORS[colorSeed] || '#F5A623',
      myInitials:      getInitials(getUserName(myUser || user)),
      myColor:         GREEN,
      myGithub:        myUser?.githubLink || myUser?.github || '',
      partnerGithub:   partnerUser?.githubLink || partnerUser?.github || '',
    };
  })();

  const addAiMsg   = (text) => setMessages((m) => [...m, makeAiMsg(text)]);
  const addUserMsg = (text) => setMessages((m) => [...m, makeUserMsg(text)]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Kick off the intro once match data is ready
  useEffect(() => {
    if (!matchConfig || phase !== 'intro') return;
    const t1 = setTimeout(() => setIsTyping(true), 600);
    const t2 = setTimeout(() => {
      setIsTyping(false);
      addAiMsg(
        `You and ${matchConfig.partnerName} just matched on "${matchConfig.ideaTitle}" — let's build it right now.\n\nFirst question: what's the core problem this solves for users? One sentence.`
      );
      setPhase('q1');
    }, 2200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [matchConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  const simulateProgress = () => {
    setBuildProgress(0);
    let p = 0;
    progressRef.current = setInterval(() => {
      p += Math.random() * 6 + 2;
      if (p >= 95) { p = 95; clearInterval(progressRef.current); }
      setBuildProgress(Math.round(p));
    }, 400);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping || ['generating', 'publishing', 'published', 'done', 'intro'].includes(phase)) return;
    if (!matchConfig) return;

    addUserMsg(text);
    setInput('');
    setIsTyping(true);

    if (phase === 'q1') {
      setQ1Answer(text);
      try {
        const res = await fetch(`${API}/api/build/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ideaTitle: matchConfig.ideaTitle, phase: 'q1', q1Answer: text }),
        });
        const data = await res.json();
        setIsTyping(false);
        addAiMsg(data.content || 'Got it. Who is the primary user of this product?');
      } catch {
        setIsTyping(false);
        addAiMsg('Got it. One more — who is the primary user? Consumers, businesses, or a specific niche?');
      }
      setPhase('q2');

    } else if (phase === 'q2') {
      try {
        const res = await fetch(`${API}/api/build/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ideaTitle: matchConfig.ideaTitle, phase: 'q2', q1Answer, q2Answer: text }),
        });
        const data = await res.json();
        setIsTyping(false);
        addAiMsg(data.content || 'Perfect — I have everything I need. Generating your app now...');
      } catch {
        setIsTyping(false);
        addAiMsg('Perfect. Generating your app now...');
      }

      setPhase('generating');
      simulateProgress();

      try {
        const res = await fetch(`${API}/api/build/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ideaTitle: matchConfig.ideaTitle, problem: q1Answer, targetUser: text }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Server error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let finalData = null;

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const parts = buf.split('\n\n');
          buf = parts.pop();
          for (const part of parts) {
            if (!part.startsWith('data: ')) continue;
            const evt = JSON.parse(part.slice(6));
            if (evt.type === 'error') throw new Error(evt.error);
            if (evt.type === 'done') { finalData = evt; break outer; }
          }
        }

        if (!finalData?.html) throw new Error('Generation incomplete');

        clearInterval(progressRef.current);
        setBuildProgress(100);
        const { html, appCode: generatedCode } = finalData;
        setPhase('publishing');
        setTimeout(() => {
          setGeneratedHtml(html);
          addAiMsg('App generated. Creating your GitHub repo now...');
        }, 600);

        try {
          const publishRes = await fetch(`${API}/api/build/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              appCode: generatedCode,
              ideaTitle: matchConfig.ideaTitle,
              github1: matchConfig.myGithub,
              github2: matchConfig.partnerGithub,
            }),
          });
          const publishData = await publishRes.json();
          if (!publishRes.ok || publishData.error) throw new Error(publishData.error || `Error ${publishRes.status}`);
          setRepoUrl(publishData.repoUrl);
          setPhase('published');
          addAiMsg(`Done. Repo is live:\n${publishData.repoUrl}\n\nYou've both been added as collaborators. Go ship it.`);
        } catch (publishErr) {
          setPhase('published');
          addAiMsg(`App is live in the preview. Repo setup hit a snag: ${publishErr.message}`);
        }
      } catch (err) {
        clearInterval(progressRef.current);
        setPhase('done');
        const msg = err.message?.includes('fetch') || err.message?.includes('Failed')
          ? "Can't reach the server — is it running?"
          : `Generation failed: ${err.message}`;
        addAiMsg(msg);
      }
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const inputDisabled = !matchConfig || isTyping || ['generating', 'publishing', 'published', 'done', 'intro'].includes(phase);

  // ─── loading / error states ──────────────────────────────────────────────────

  if (loadingMatch) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', bgcolor: '#111' }}>
        <CircularProgress sx={{ color: PURPLE }} />
      </Box>
    );
  }

  if (matchError || !match) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100%', bgcolor: '#111', p: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: '#fff', mb: 2 }}>{matchError || 'Match not found.'}</Typography>
          <Button onClick={() => navigate('/app/matches')} sx={{ color: PURPLE }}>
            ← Back to matches
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left: chat panel ── */}
      <Box
        sx={{
          width: '42%', minWidth: 340, display: 'flex', flexDirection: 'column',
          borderRight: '1px solid rgba(0,0,0,0.08)', backgroundColor: '#F2F2F2',
        }}
      >
        {/* Top bar */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            px: 3, py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.08)', flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => navigate(`/app/matches/${matchId}`)} sx={{ color: '#888', p: 0.5 }}>
              <BackIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography sx={{ fontFamily: '"DM Mono", monospace', fontWeight: 500, fontSize: '0.95rem', color: '#1a1a1a' }}>
                # build
              </Typography>
              <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.72rem', color: '#888', mt: 0.25, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {matchConfig?.ideaTitle}
              </Typography>
            </Box>
          </Box>
          {matchConfig && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: matchConfig.partnerColor, fontSize: '0.62rem', fontWeight: 700, color: '#1a1a1a' }}>
                {matchConfig.partnerInitials}
              </Avatar>
              <Avatar sx={{ width: 28, height: 28, bgcolor: matchConfig.myColor, fontSize: '0.62rem', fontWeight: 700, color: '#1a1a1a' }}>
                {matchConfig.myInitials}
              </Avatar>
            </Box>
          )}
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: 'auto', py: 2 }}>
          {messages.map((msg) =>
            msg.from === 'ai'
              ? <AiMessage key={msg.id} msg={msg} />
              : <UserMessage key={msg.id} msg={msg} initials={matchConfig?.myInitials} color={matchConfig?.myColor || GREEN} />
          )}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </Box>

        {/* Input */}
        <Box sx={{ px: 3, pb: 3, pt: 1.5, flexShrink: 0 }}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', bgcolor: '#FFFFFF',
              borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', px: 2, py: 0.5,
              opacity: inputDisabled ? 0.5 : 1, transition: 'opacity 0.2s',
            }}
          >
            <TextField
              fullWidth multiline maxRows={4} variant="standard"
              placeholder={phase === 'published' ? 'repo is live ✓' : 'your answer...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              disabled={inputDisabled}
              InputProps={{ disableUnderline: true }}
              sx={{
                '& .MuiInputBase-input': {
                  fontFamily: '"DM Mono", monospace', fontSize: '0.88rem', color: '#1a1a1a', py: 1,
                  '&::placeholder': { color: '#aaa', opacity: 1 },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={inputDisabled || !input.trim()}
              sx={{
                ml: 1, width: 34, height: 34, bgcolor: '#1a1a1a', borderRadius: '50%', flexShrink: 0,
                '&:hover': { bgcolor: '#333' },
                '&.Mui-disabled': { bgcolor: '#1a1a1a', opacity: 0.4 },
              }}
            >
              <SendIcon sx={{ fontSize: 16, color: '#fff' }} />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* ── Right: live preview panel ── */}
      <Box sx={{ flex: 1, bgcolor: '#111111', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {generatedHtml
          ? <PreviewLive html={generatedHtml} repoUrl={repoUrl} />
          : phase === 'generating'
          ? <PreviewGenerating progress={buildProgress} />
          : <PreviewIdle />
        }
      </Box>
    </Box>
  );
}
