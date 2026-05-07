import { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  Avatar, Chip, IconButton, Button, Divider, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, CircularProgress, Alert
} from '@mui/material';
import {
  KeyboardArrowUp, KeyboardArrowDown, Star, StarBorder,
  Build, Add, LocalFireDepartment
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';

const TABS = ['Hot', 'New', 'Building', 'Mine'];
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const roleColors = { Founder: '#16a34a', Builder: '#2563eb', Hacker: '#9333ea' };

function initials(name) {
  return String(name || 'Founder')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function IdeaCard({ idea, onUpvote, onDownvote, onToggleSave, onToggleBuild }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: 3,
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        '&:hover': { borderColor: '#d1d5db', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
        transition: 'all 0.15s ease',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: '#111' }}>
              {initials(idea.author)}
            </Avatar>
            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{idea.author}</Typography>
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{idea.authorElo}</Typography>
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
            <Typography sx={{ fontSize: 12, fontWeight: 600, color: '#f97316' }}>{idea.heat}%</Typography>
          </Box>
        </Box>

        <Typography sx={{ fontWeight: 700, fontSize: 15, mb: 0.75, lineHeight: 1.3 }}>
          {idea.title}
        </Typography>
        <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 2, lineHeight: 1.5 }}>
          {idea.description}
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
          {idea.tags.map(tag => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ fontSize: 11, height: 22, bgcolor: '#f9fafb', color: '#374151', border: '1px solid #e5e7eb' }}
            />
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton size="small" onClick={() => onUpvote(idea.id)} sx={{ p: 0.5 }}>
              <KeyboardArrowUp sx={{ fontSize: 18 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 700, fontSize: 13, minWidth: 24, textAlign: 'center' }}>
              {idea.upvotes}
            </Typography>
            <IconButton size="small" onClick={() => onDownvote(idea.id)} sx={{ p: 0.5 }}>
              <KeyboardArrowDown sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              size="small"
              startIcon={<Build sx={{ fontSize: 13 }} />}
              onClick={() => onToggleBuild(idea.id)}
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
            <IconButton size="small" onClick={() => onToggleSave(idea.id)} sx={{ p: 0.5 }}>
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
  const [tab, setTab] = useState(tabIndexFromNav ?? 0);
  useEffect(() => {
    if (tabIndexFromNav !== undefined) setTab(tabIndexFromNav);
  }, [tabIndexFromNav]);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postOpen, setPostOpen] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postTags, setPostTags] = useState('');
  const [posting, setPosting] = useState(false);
  const [editIdea, setEditIdea] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editProjectUrl, setEditProjectUrl] = useState('');
  const [editImageFile, setEditImageFile] = useState(null);
  const [editing, setEditing] = useState(false);

  const totalUpvotes = ideas.reduce((sum, i) => sum + i.upvotes, 0);
  const wantToBuild = ideas.reduce((sum, i) => sum + i.builders, 0);
  const myElo = user?.elo?.total || user?.elo || 0;

  const tabName = useMemo(() => TABS[tab].toLowerCase(), [tab]);

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
        description: idea.description,
        heat: idea.eloScore || 0,
        upvotes: idea.upvotes || 0,
        downvotes: idea.downvotes || 0,
        builders: idea.builderCount || 0,
        tags: idea.tags || [],
        projectUrl: idea.projectUrl || '',
        imageUrl: idea.imageUrl || '',
        saved: false,
        building: idea.status === 'building',
        isNew: Date.now() - new Date(idea.createdAt).getTime() < 24 * 60 * 60 * 1000,
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

  const handleUpvote = (id) => {
    fetch(`${API}/api/ideas/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value: 1 }),
    })
      .then(() => loadIdeas())
      .catch(() => {});
  };
  const handleDownvote = (id) => {
    fetch(`${API}/api/ideas/${id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ value: -1 }),
    })
      .then(() => loadIdeas())
      .catch(() => {});
  };
  const handleToggleSave = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
  };
  const handleToggleBuild = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, building: !i.building, builders: i.building ? i.builders - 1 : i.builders + 1 } : i));
  };

  const filteredIdeas = tabName === 'mine'
    ? ideas
    : tabName === 'building'
    ? ideas.filter(i => i.building)
    : [...ideas].sort((a, b) => b.heat - a.heat);

  const handlePostIdea = async () => {
    try {
      setPosting(true);
      setError('');
      const res = await fetch(`${API}/api/ideas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: postTitle,
          description: postDescription,
          tags: postTags,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to post idea');
      }
      setPostOpen(false);
      setPostTitle('');
      setPostDescription('');
      setPostTags('');
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
          onClick={() => setPostOpen(true)}
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

      <Box sx={{ display: 'flex', gap: 5, mb: 3 }}>
        {[
          { label: 'total upvotes', value: totalUpvotes },
          { label: 'want to build', value: wantToBuild },
          { label: 'ELO score', value: myElo },
        ].map(stat => (
          <Box key={stat.label}>
            <Typography sx={{ fontWeight: 700, fontSize: 22 }}>{stat.value}</Typography>
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{stat.label}</Typography>
          </Box>
        ))}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 13, minWidth: 80 },
          '& .MuiTabs-indicator': { bgcolor: '#111' },
          '& .Mui-selected': { color: '#111 !important' },
        }}
      >
        {TABS.map(t => <Tab key={t} label={t} />)}
      </Tabs>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.25, pb: 2 }}>
        {loading && (
          <Box sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && filteredIdeas.length === 0 ? (
          <Typography sx={{ color: '#9ca3af', textAlign: 'center', py: 6 }}>
            Nothing here yet.
          </Typography>
        ) : !loading && (
          filteredIdeas.map(idea => (
            <Box key={idea.id}>
              <IdeaCard
                idea={idea}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                onToggleSave={handleToggleSave}
                onToggleBuild={handleToggleBuild}
              />
              {idea.imageUrl && (
                <Box sx={{ mt: -1.5, mb: 1, px: 2 }}>
                  <Box
                    component="img"
                    src={idea.imageUrl}
                    alt={idea.title}
                    sx={{
                      width: '100%',
                      maxHeight: 320,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid #e5e7eb',
                      backgroundColor: '#f9fafb',
                    }}
                  />
                </Box>
              )}
              {(idea.projectUrl || String(idea.founderId) === String(user?._id || user?.id)) && (
                <Box sx={{ mt: -0.5, mb: 2.5, px: 2, display: 'flex', gap: 1 }}>
                  {idea.projectUrl && (
                    <Button
                      size="small"
                      variant="outlined"
                      href={idea.projectUrl}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ textTransform: 'none' }}
                    >
                      Open project
                    </Button>
                  )}
                  {String(idea.founderId) === String(user?._id || user?.id) && (
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => openEdit(idea)}
                      sx={{ textTransform: 'none' }}
                    >
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
        <DialogTitle>Post an idea</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField
            label="Title"
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={postDescription}
            onChange={(e) => setPostDescription(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <TextField
            label="Tags (comma separated)"
            value={postTags}
            onChange={(e) => setPostTags(e.target.value)}
            placeholder="AI, Fintech, SaaS"
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPostOpen(false)} disabled={posting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePostIdea}
            disabled={posting || !postTitle.trim() || !postDescription.trim()}
          >
            {posting ? 'Posting...' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editIdea)} onClose={() => setEditIdea(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit project post</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} fullWidth />
          <TextField
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <TextField label="Tags (comma separated)" value={editTags} onChange={(e) => setEditTags(e.target.value)} fullWidth />
          <TextField label="Project URL" value={editProjectUrl} onChange={(e) => setEditProjectUrl(e.target.value)} fullWidth />
          <Button variant="outlined" component="label">
            {editImageFile ? `New image: ${editImageFile.name}` : 'Replace image (optional)'}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => setEditImageFile(e.target.files?.[0] || null)}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditIdea(null)} disabled={editing}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={editing || !editTitle.trim() || !editDescription.trim()}>
            {editing ? 'Saving...' : 'Save changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
