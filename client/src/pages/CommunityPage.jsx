import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  Avatar, Chip, IconButton, Button, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert, MenuItem, LinearProgress, Skeleton, Tooltip
} from '@mui/material';
import {
  KeyboardArrowUp, KeyboardArrowDown, Star, StarBorder,
  Build, Add, LocalFireDepartment, ChatOutlined, ShareOutlined, MoreHoriz
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const TABS = ['Hot', 'New', 'Building', 'Mine'];
const DEFAULT_TOPIC_OPTIONS = ['AI', 'SaaS', 'Consumer', 'Fintech', 'Marketplace', 'Social', 'EdTech', 'Health'];
// In dev, use same-origin paths so cookies work via Vite proxy.
const API = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');

const roleColors = { Founder: '#16a34a', Builder: '#2563eb', Hacker: '#9333ea' };

function timeAgo(dateLike) {
  const ts = new Date(dateLike).getTime();
  if (!Number.isFinite(ts)) return '';
  const diff = Date.now() - ts;
  const sec = Math.max(1, Math.floor(diff / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (wk < 8) return `${wk}w`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}mo`;
  const yr = Math.floor(day / 365);
  return `${yr}y`;
}

function initials(name) {
  return String(name || 'Founder')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function IdeaCard({ idea, onUpvote, onDownvote, onToggleSave, onToggleBuild, onOpen }) {
  const heat = Math.min(100, Math.max(0, Number(idea.heat) || 0));
  const heatColor =
    heat >= 80 ? '#f97316' : heat >= 55 ? '#f59e0b' : heat >= 30 ? '#60a5fa' : '#a3a3a3';
  const stopAnd = (fn) => (e) => {
    e.stopPropagation();
    fn?.();
  };
  return (
    <Card
      elevation={0}
      onClick={() => onOpen?.(idea)}
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: 3,
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        '&:hover': {
          borderColor: '#d1d5db',
          boxShadow: '0 12px 30px rgba(0,0,0,0.10)',
          transform: 'translateY(-2px)',
        },
        transition: 'all 0.15s ease',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#111' }}>
              {initials(idea.author)}
            </Avatar>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{idea.author}</Typography>
                <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(idea.createdAt)}</Typography>
              </Box>
              <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>
                ELO {idea.authorElo}
              </Typography>
            </Box>
            <Chip
              label={idea.role}
              size="small"
              sx={{
                fontSize: 11,
                height: 20,
                bgcolor: `${roleColors[idea.role] || '#6b7280'}15`,
                color: roleColors[idea.role] || '#6b7280',
                fontWeight: 600,
                border: 'none',
              }}
            />
            {idea.isNew && (
              <Chip label="just posted" size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#f3f4f6', color: '#6b7280' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <LocalFireDepartment sx={{ fontSize: 14, color: '#f97316' }} />
            <Typography sx={{ fontSize: 12, fontWeight: 700, color: heatColor }}>{heat}%</Typography>
            <Tooltip title="More">
              <IconButton size="small" sx={{ ml: 0.5 }} onClick={(e) => e.stopPropagation()}>
                <MoreHoriz sx={{ fontSize: 18, color: '#9ca3af' }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Heat meter makes the card feel "alive" */}
        <Box sx={{ mb: 2.25 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>
              Heat
            </Typography>
            <Typography sx={{ fontSize: 11, fontWeight: 800, color: heatColor }}>{heat >= 80 ? 'Spicy' : 'Rising'}</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={heat}
            sx={{
              height: 8,
              borderRadius: 999,
              backgroundColor: '#eef2f7',
              '& .MuiLinearProgress-bar': {
                borderRadius: 999,
                backgroundImage:
                  heat >= 80
                    ? 'linear-gradient(90deg, #f97316, #fb7185)'
                    : heat >= 55
                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                    : 'linear-gradient(90deg, #60a5fa, #93c5fd)',
              },
            }}
          />
        </Box>

        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.75, lineHeight: 1.3 }}>
          {idea.title}
        </Typography>
        {idea.caption && (
          <Typography sx={{ fontSize: 13, color: '#374151', mb: 1.25, lineHeight: 1.5 }}>
            {idea.caption}
          </Typography>
        )}
        <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2, lineHeight: 1.5 }}>
          {idea.description}
        </Typography>
        {(idea.feedbackRequest || idea.notes) && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {idea.feedbackRequest && (
              <Chip
                size="small"
                label={`Feedback: ${idea.feedbackRequest}`}
                sx={{ bgcolor: '#eef2ff', color: '#3730a3', border: '1px solid #e5e7eb' }}
              />
            )}
            {idea.notes && (
              <Chip
                size="small"
                label="Has notes"
                sx={{ bgcolor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}
              />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
          {idea.topic && (
            <Chip
              label={idea.topic}
              size="small"
              sx={{
                fontSize: 11,
                height: 22,
                bgcolor: '#ecfeff',
                color: '#0f766e',
                border: '1px solid #ccfbf1',
                fontWeight: 700,
              }}
            />
          )}
          {idea.tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{
                fontSize: 11,
                height: 22,
                bgcolor: '#f8fafc',
                color: '#111827',
                border: '1px solid #e5e7eb',
                '&:hover': { borderColor: '#cbd5e1', bgcolor: '#f1f5f9' },
              }}
            />
          ))}
        </Box>

        {idea.imageUrl && (
          <Box sx={{ mb: 2 }}>
            <Box
              component="img"
              src={idea.imageUrl}
              alt={idea.title}
              sx={{
                width: { xs: '55%', md: '25%' },
                maxHeight: 90,
                objectFit: 'cover',
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                backgroundColor: '#f9fafb',
                display: 'block',
              }}
            />
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={stopAnd(() => onUpvote(idea.id))}
              sx={{ p: 0.5, color: idea.userVote === 1 ? '#7C5CFC' : 'inherit' }}
            >
              <KeyboardArrowUp sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 13, minWidth: 24, textAlign: 'center' }}>
              {idea.upvotes}
            </Typography>
            <IconButton
              size="small"
              onClick={stopAnd(() => onDownvote(idea.id))}
              sx={{ p: 0.5, color: idea.userVote === -1 ? '#ef4444' : 'inherit' }}
            >
              <KeyboardArrowDown sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              size="small"
              startIcon={<Build sx={{ fontSize: 13 }} />}
              onClick={stopAnd(() => onToggleBuild(idea.id))}
              sx={{
                fontSize: 12,
                textTransform: 'none',
                color: idea.building ? '#2563eb' : '#6b7280',
                fontWeight: idea.building ? 700 : 400,
                p: '2px 8px',
                minWidth: 0,
              }}
            >
              {idea.builders} builders
            </Button>
            <Tooltip title="Open post">
              <IconButton size="small" onClick={stopAnd(() => onOpen?.(idea))} sx={{ p: 0.5 }}>
                <ChatOutlined sx={{ fontSize: 16, color: '#6b7280' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Share">
              <IconButton size="small" sx={{ p: 0.5 }} onClick={(e) => e.stopPropagation()}>
                <ShareOutlined sx={{ fontSize: 16, color: '#6b7280' }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={stopAnd(() => onToggleSave(idea.id))} sx={{ p: 0.5 }}>
              {idea.saved
                ? <Star sx={{ fontSize: 16, color: '#f59e0b' }} />
                : <StarBorder sx={{ fontSize: 16, color: '#9ca3af' }} />}
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function CommunityPage() {
  const { user } = useAuth();
  const location = useLocation();
  const tabIndexFromNav = location.state?.tabIndex;
  const safeTabFromNav = Number.isInteger(tabIndexFromNav) && tabIndexFromNav >= 0 && tabIndexFromNav < TABS.length
    ? tabIndexFromNav
    : 0;
  const [tab, setTab] = useState(safeTabFromNav);
  useEffect(() => {
    if (Number.isInteger(tabIndexFromNav) && tabIndexFromNav >= 0 && tabIndexFromNav < TABS.length) {
      setTab(tabIndexFromNav);
    }
  }, [tabIndexFromNav]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postOpen, setPostOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [postTopic, setPostTopic] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postNotes, setPostNotes] = useState('');
  const [postFeedbackRequest, setPostFeedbackRequest] = useState('');
  const [posting, setPosting] = useState(false);
  const [editIdea, setEditIdea] = useState(null);
  const [activeIdea, setActiveIdea] = useState(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editProjectUrl, setEditProjectUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editing, setEditing] = useState(false);

  const totalUpvotes = ideas.reduce((sum, i) => sum + i.upvotes, 0);
  const wantToBuild = ideas.reduce((sum, i) => sum + i.builders, 0);
  // Use nullish checks so 0 stays 0 (and we never render the full elo object).
  const myElo =
    (typeof user?.elo?.total === 'number' ? user.elo.total : undefined)
    ?? (typeof user?.elo === 'number' ? user.elo : undefined)
    ?? 0;

  const tabName = useMemo(() => {
    const selected = Number.isInteger(tab) && tab >= 0 && tab < TABS.length ? tab : 0;
    return TABS[selected].toLowerCase();
  }, [tab]);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/api/ideas?tab=${tabName}`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load ideas');
      }
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((idea) => ({
        id: idea._id,
        founderId: idea.founder?._id,
        author: idea.founder?.name || 'Founder',
        authorElo: idea.founder?.elo?.total ?? 0,
        role: idea.founder?.title || 'Founder',
        title: idea.title,
        caption: idea.caption || '',
        notes: idea.notes || '',
        feedbackRequest: idea.feedbackRequest || '',
        topic: idea.topic || '',
        description: idea.description,
        heat: idea.heatScore ?? idea.eloScore ?? 0,
        upvotes: idea.upvotes || 0,
        downvotes: idea.downvotes || 0,
        userVote: 0,
        builders: idea.builderCount || 0,
        viewCount: idea.viewCount || 0,
        tags: idea.tags || [],
        projectUrl: idea.projectUrl || '',
        imageUrl: idea.imageUrl || '',
        saved: false,
        building: idea.status === 'building',
        isNew: Date.now() - new Date(idea.createdAt).getTime() < 24 * 60 * 60 * 1000,
        createdAt: idea.createdAt,
        comments: Array.isArray(idea.comments)
          ? idea.comments.map((c) => ({
            id: c._id,
            text: c.text || '',
            createdAt: c.createdAt,
            author: c.user?.name || 'User',
            authorAvatar: c.user?.profilePic || '',
          }))
          : [],
      }));
      setIdeas(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIdeas();
  }, [tabName]);

  const loadProjects = async () => {
    try {
      setProjectsError('');
      setProjectsLoading(true);
      const res = await fetch(`${API}/api/projects`, { credentials: 'include' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load projects');
      }
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjectsError(err.message || 'Failed to load projects');
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };

  const handleVote = async (id, value) => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;

    // If clicking the same direction, it removes the vote (server toggles)
    const newVote = idea.userVote === value ? 0 : value;
    const upDelta = (newVote === 1 ? 1 : 0) - (idea.userVote === 1 ? 1 : 0);
    const downDelta = (newVote === -1 ? 1 : 0) - (idea.userVote === -1 ? 1 : 0);

    // Optimistic update
    setIdeas((prev) => prev.map((i) =>
      i.id === id
        ? { ...i, userVote: newVote, upvotes: i.upvotes + upDelta, downvotes: i.downvotes + downDelta }
        : i
    ));

    try {
      const res = await fetch(`${API}/api/ideas/${id}/vote`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error();
    } catch {
      // Revert on failure
      setIdeas((prev) => prev.map((i) =>
        i.id === id ? { ...i, userVote: idea.userVote, upvotes: idea.upvotes, downvotes: idea.downvotes } : i
      ));
    }
  };

  const handleUpvote = (id) => handleVote(id, 1);
  const handleDownvote = (id) => handleVote(id, -1);
  const handleToggleSave = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
  };
  const handleToggleBuild = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, building: !i.building, builders: i.building ? i.builders - 1 : i.builders + 1 } : i));
  };

  const topicOptions = useMemo(() => {
    const tagsFromIdeas = ideas.flatMap((i) => Array.isArray(i.tags) ? i.tags : []);
    const tagsFromProjects = projects.flatMap((p) => Array.isArray(p.tags) ? p.tags : []);
    const merged = [...DEFAULT_TOPIC_OPTIONS, ...tagsFromIdeas, ...tagsFromProjects]
      .map((t) => String(t || '').trim())
      .filter(Boolean);
    return ['all', ...Array.from(new Set(merged))];
  }, [ideas, projects]);

  const filteredIdeasByTab = tabName === 'mine'
    ? ideas
    : tabName === 'building'
    ? ideas.filter(i => i.building)
    : tabName === 'new'
    ? [...ideas].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [...ideas].sort((a, b) => b.heat - a.heat);

  const filteredIdeas = topicFilter === 'all'
    ? filteredIdeasByTab
    : filteredIdeasByTab.filter((idea) => {
      const topicMatch = String(idea.topic || '').toLowerCase() === topicFilter.toLowerCase();
      const tagMatch = (idea.tags || []).some((t) => String(t).toLowerCase() === topicFilter.toLowerCase());
      return topicMatch || tagMatch;
    });

  const searchedIdeas = searchQuery.trim()
    ? filteredIdeas.filter((idea) => {
      const q = searchQuery.trim().toLowerCase();
      return [
        idea.title,
        idea.caption,
        idea.description,
        idea.topic,
        ...(idea.tags || []),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    })
    : filteredIdeas;

  const hasIdeas = !loading && searchedIdeas.length > 0;
  const emptyCopy = useMemo(() => {
    if (tabName === 'mine') {
      return {
        title: 'Be the first to post',
        subtitle: 'Share a project idea so others can ask questions and collaborate.',
      };
    }
    if (tabName === 'building') {
      return {
        title: 'No building ideas yet',
        subtitle: 'When people start building, they\'ll show up here.',
      };
    }
    if (topicFilter !== 'all') {
      return {
        title: `No ${topicFilter} posts yet`,
        subtitle: 'Pick another topic or be the first to start this conversation.',
      };
    }
    return {
      title: 'Be the first to post an idea',
      subtitle: 'Start the discussion — post a project and ask for feedback.',
    };
  }, [tabName, topicFilter]);


  const handlePostIdea = async () => {
    try {
      setPosting(true);
      setError('');
      if (!selectedProjectId) {
        throw new Error('Pick a project to share');
      }

      const res = await fetch(`${API}/api/projects/${selectedProjectId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          caption: postCaption,
          notes: postNotes,
          feedbackRequest: postFeedbackRequest,
          topic: postTopic,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to publish project');
      }
      setPostOpen(false);
      setSelectedProjectId('');
      setPostCaption('');
      setPostNotes('');
      setPostFeedbackRequest('');
      setPostTopic('');
      setTab(1);
      loadIdeas();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const openEdit = (idea) => {
    setEditIdea(idea);
    setEditTitle(idea.title || '');
    setEditDescription(idea.description || '');
    setEditTags((idea.tags || []).join(', '));
    setEditProjectUrl(idea.projectUrl || '');
    setEditImageFile(null);
  };

  const handleSaveEdit = async () => {
    if (!editIdea) return;
    try {
      setEditing(true);
      setError('');

      let imageUpload;
      let imageUrl = editIdea.imageUrl || '';
      if (editImageFile) {
        const fd = new FormData();
        fd.append('file', editImageFile);
        const uploadRes = await fetch(`${API}/api/uploads?kind=idea`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(body.error || 'Image upload failed');
        }
        const uploaded = await uploadRes.json();
        imageUpload = uploaded._id;
        imageUrl = `${API}${uploaded.url}`;
      }

      const res = await fetch(`${API}/api/ideas/${editIdea.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          tags: editTags,
          projectUrl: editProjectUrl,
          imageUpload,
          imageUrl,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update post');
      }

      setEditIdea(null);
      loadIdeas();
    } catch (err) {
      setError(err.message);
    } finally {
      setEditing(false);
    }
  };

  const openIdea = async (idea) => {
    setActiveIdea(idea);
    setCommentDraft('');
    try {
      const res = await fetch(`${API}/api/ideas/${idea.id}/view`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      setIdeas((prev) => prev.map((i) => (
        i.id === idea.id
          ? { ...i, viewCount: data.viewCount ?? i.viewCount, heat: data.heatScore ?? i.heat }
          : i
      )));
      setActiveIdea((prev) => (
        prev && prev.id === idea.id
          ? { ...prev, viewCount: data.viewCount ?? prev.viewCount, heat: data.heatScore ?? prev.heat }
          : prev
      ));
    } catch {
      // Non-blocking: modal still opens even if view tracking fails.
    }
  };

  const handleAddComment = async () => {
    if (!activeIdea?.id || !commentDraft.trim()) return;
    try {
      setCommentSubmitting(true);
      const res = await fetch(`${API}/api/ideas/${activeIdea.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: commentDraft.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to add comment');
      }
      const created = await res.json();
      const mappedComment = {
        id: created.comment?._id,
        text: created.comment?.text || '',
        createdAt: created.comment?.createdAt,
        author: created.comment?.user?.name || user?.name || 'You',
        authorAvatar: created.comment?.user?.profilePic || '',
      };
      setIdeas((prev) => prev.map((i) => (
        i.id === activeIdea.id
          ? { ...i, comments: [...(i.comments || []), mappedComment], heat: created.heatScore ?? i.heat }
          : i
      )));
      setActiveIdea((prev) => (
        prev ? { ...prev, comments: [...(prev.comments || []), mappedComment], heat: created.heatScore ?? prev.heat } : prev
      ));
      setCommentDraft('');
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setCommentSubmitting(false);
    }
  };


  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', width: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Community
          </Typography>
          <Typography sx={{ color: '#6b7280' }}>
            Post half-baked ideas. Let the crowd decide.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setPostOpen(true);
            loadProjects();
          }}
          sx={{
            bgcolor: '#111',
            color: '#fff',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { bgcolor: '#333' },
          }}
        >
          Post idea
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Composer card (social-feed style) */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid #e5e7eb',
          borderRadius: 3,
          backgroundColor: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
          mb: 2.5,
        }}
      >
        <CardContent sx={{ p: 2.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#111' }}>
            {initials(user?.name)}
          </Avatar>
          <TextField
            fullWidth
            placeholder="Search posts by caption, idea, tags, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 999,
                backgroundColor: '#fff',
              },
            }}
          />
        </CardContent>
      </Card>

      {hasIdeas && (
        <Box sx={{ display: 'flex', gap: 5, mb: 3 }}>
          {[
            { label: 'total upvotes', value: totalUpvotes },
            { label: 'want to build', value: wantToBuild },
            { label: 'ELO score', value: myElo },
          ].map((stat) => (
            <Box key={stat.label}>
              <Typography sx={{ fontWeight: 800, fontSize: 22 }}>{stat.value}</Typography>
              <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{stat.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, gap: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 80 },
            '& .MuiTabs-indicator': { bgcolor: '#111' },
            '& .Mui-selected': { color: '#111 !important' },
          }}
        >
          {TABS.map(t => <Tab key={t} label={t} />)}
        </Tabs>
        <TextField
          select
          label="Topic"
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          size="small"
          sx={{
            minWidth: 210,
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              backgroundColor: '#fff',
              fontWeight: 600,
              '& fieldset': { borderColor: '#d1d5db', borderWidth: 1.5 },
              '&:hover fieldset': { borderColor: '#9ca3af' },
              '&.Mui-focused fieldset': { borderColor: '#111', borderWidth: 2 },
            },
            '& .MuiInputLabel-root': { color: '#6b7280', fontWeight: 600 },
            '& .MuiInputLabel-root.Mui-focused': { color: '#374151' },
          }}
        >
          <MenuItem value="all">All topics</MenuItem>
          {topicOptions.filter((t) => t !== 'all').map((topic) => (
            <MenuItem key={topic} value={topic}>{topic}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pb: 2 }}>
        {loading && (
          <Box sx={{ py: 2 }}>
            {[0, 1, 2].map((k) => (
              <Card key={k} elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 3, mb: 2, backgroundColor: '#fff' }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="text" width={160} height={18} />
                    <Skeleton variant="rounded" width={70} height={18} />
                  </Box>
                  <Skeleton variant="text" width="70%" height={22} />
                  <Skeleton variant="text" width="95%" height={18} />
                  <Skeleton variant="text" width="88%" height={18} />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rounded" width="100%" height={8} />
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
        {!loading && searchedIdeas.length === 0 ? (
          <Box sx={{ py: 10, px: 2, textAlign: 'center' }}>
            <Typography sx={{ fontSize: 20, fontWeight: 900, mb: 0.75 }}>{emptyCopy.title}</Typography>
            <Typography sx={{ color: '#6b7280', mb: 3, mx: 'auto', maxWidth: 520, lineHeight: 1.5 }}>
              {emptyCopy.subtitle}
            </Typography>
            <Button
              variant="contained"
              onClick={() => { setPostOpen(true); loadProjects(); }}
              sx={{ bgcolor: '#111', color: '#fff', borderRadius: 2, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#333' } }}
              startIcon={<Add />}
            >
              Post idea
            </Button>
          </Box>
        ) : !loading && (
          searchedIdeas.map(idea => (
            <Box key={idea.id}>
              <IdeaCard
                idea={idea}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                onToggleSave={handleToggleSave}
                onToggleBuild={handleToggleBuild}
                onOpen={openIdea}
              />
              {(idea.projectUrl || String(idea.founderId) === String(user?._id || user?.id)) && (
                <Box sx={{ mt: -0.5, mb: 2.5, px: 2, display: 'flex', gap: 1 }}>
                  {idea.projectUrl && (
                    <Button size="small" variant="outlined" href={idea.projectUrl} target="_blank" rel="noreferrer" sx={{ textTransform: 'none' }}>
                      Open project
                    </Button>
                  )}
                  {String(idea.founderId) === String(user?._id || user?.id) && (
                    <Button size="small" variant="text" onClick={() => openEdit(idea)} sx={{ textTransform: 'none' }}>
                      Edit post
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          ))
        )}
      </Box>

      <Dialog open={postOpen} onClose={() => setPostOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Share a project to Community</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {projectsError && <Alert severity="error">{projectsError}</Alert>}
          <TextField
            select
            label="Choose a project"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            fullWidth
            disabled={projectsLoading}
            helperText={projectsLoading ? 'Loading projects...' : (projects.length ? 'Pick a draft project (or published) to share.' : 'No projects yet. Create one in Projects first.')}
          >
            {projects.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.name}{p.publishedToCommunity || p.idea ? ' (published)' : ' (draft)'}
              </MenuItem>
            ))}
          </TextField>
          <TextField label="Caption (optional)" value={postCaption} onChange={(e) => setPostCaption(e.target.value)} fullWidth />
          <TextField label="Notes (optional)" value={postNotes} onChange={(e) => setPostNotes(e.target.value)} multiline minRows={4} fullWidth />
          <TextField label="Ask for feedback (optional)" value={postFeedbackRequest} onChange={(e) => setPostFeedbackRequest(e.target.value)} placeholder="Pricing, landing page copy, onboarding, etc." fullWidth />
          <TextField select label="Topic" value={postTopic} onChange={(e) => setPostTopic(e.target.value)} fullWidth>
            {topicOptions.filter((t) => t !== 'all').map((topic) => (
              <MenuItem key={topic} value={topic}>{topic}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostOpen(false)} disabled={posting}>Cancel</Button>
          <Button variant="contained" onClick={handlePostIdea} disabled={posting || !selectedProjectId}>
            {posting ? 'Posting...' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editIdea)} onClose={() => setEditIdea(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit project post</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} fullWidth />
          <TextField label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} multiline minRows={4} fullWidth />
          <TextField label="Tags (comma separated)" value={editTags} onChange={(e) => setEditTags(e.target.value)} fullWidth />
          <TextField label="Project URL" value={editProjectUrl} onChange={(e) => setEditProjectUrl(e.target.value)} fullWidth />
          <Button variant="outlined" component="label">
            {editImageFile ? `New image: ${editImageFile.name}` : 'Replace image (optional)'}
            <input hidden type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditIdea(null)} disabled={editing}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={editing || !editTitle.trim() || !editDescription.trim()}>
            {editing ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post detail modal */}
      <Dialog open={Boolean(activeIdea)} onClose={() => setActiveIdea(null)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 3, width: 'min(1100px, 96vw)', minHeight: '78vh' } }}>
        <DialogTitle>Post</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {activeIdea && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: activeIdea.imageUrl ? '1.15fr 0.85fr' : '1fr' }, gap: 2, minHeight: '64vh' }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#111' }}>{initials(activeIdea.author)}</Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 800 }}>{activeIdea.author}</Typography>
                    <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{timeAgo(activeIdea.createdAt)} • ELO {activeIdea.authorElo}</Typography>
                  </Box>
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: 20, lineHeight: 1.25 }}>{activeIdea.title}</Typography>
                {activeIdea.caption && <Typography sx={{ color: '#374151', lineHeight: 1.6 }}>{activeIdea.caption}</Typography>}
                <Typography sx={{ color: '#6b7280', lineHeight: 1.6 }}>{activeIdea.description}</Typography>
                {activeIdea.imageUrl && (
                  <Box component="img" src={activeIdea.imageUrl} alt={activeIdea.title} sx={{ width: '100%', maxHeight: { xs: 260, md: 360 }, objectFit: 'cover', borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }} />
                )}
                {!!activeIdea.tags?.length && (
                  <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                    {activeIdea.topic && <Chip label={activeIdea.topic} size="small" sx={{ bgcolor: '#ecfeff', border: '1px solid #ccfbf1', color: '#0f766e', fontWeight: 700 }} />}
                    {activeIdea.tags.map((t) => <Chip key={t} label={t} size="small" sx={{ bgcolor: '#f8fafc', border: '1px solid #e5e7eb' }} />)}
                  </Box>
                )}
                {activeIdea.feedbackRequest && (
                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography sx={{ fontWeight: 800, mb: 0.5 }}>Asking for feedback</Typography>
                    <Typography sx={{ color: '#374151' }}>{activeIdea.feedbackRequest}</Typography>
                  </Alert>
                )}
                {activeIdea.notes && (
                  <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography sx={{ fontWeight: 900, mb: 0.5 }}>Notes</Typography>
                      <Typography sx={{ color: '#6b7280', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{activeIdea.notes}</Typography>
                    </CardContent>
                  </Card>
                )}
              </Box>
              <Card elevation={0} sx={{ border: '1px solid #e5e7eb', borderRadius: 2, display: 'flex', flexDirection: 'column', minHeight: 380 }}>
                <CardContent sx={{ p: 2, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ fontWeight: 900, mb: 1 }}>Comments ({activeIdea.comments?.length || 0})</Typography>
                  <Box sx={{ display: 'grid', gap: 1.25, mb: 1.5, maxHeight: 420, overflowY: 'auto', pr: 0.5 }}>
                    {(activeIdea.comments || []).length === 0 ? (
                      <Typography sx={{ color: '#9ca3af', fontSize: 14 }}>No comments yet. Be the first to reply.</Typography>
                    ) : (
                      (activeIdea.comments || []).map((c) => (
                        <Box key={c.id} sx={{ display: 'flex', gap: 1 }}>
                          <Avatar src={c.authorAvatar} sx={{ width: 28, height: 28, bgcolor: '#111', fontSize: 12 }}>{!c.authorAvatar ? initials(c.author) : null}</Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13 }}>{c.author} <Box component="span" sx={{ color: '#9ca3af', fontWeight: 500 }}>{timeAgo(c.createdAt)}</Box></Typography>
                            <Typography sx={{ color: '#374151', lineHeight: 1.5, fontSize: 14 }}>{c.text}</Typography>
                          </Box>
                        </Box>
                      ))
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <TextField size="small" fullWidth placeholder="Write a comment..." value={commentDraft} onChange={(e) => setCommentDraft(e.target.value)} />
                    <Button variant="contained" onClick={handleAddComment} disabled={commentSubmitting || !commentDraft.trim()} sx={{ textTransform: 'none', fontWeight: 700 }}>
                      {commentSubmitting ? 'Posting...' : 'Post'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActiveIdea(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
