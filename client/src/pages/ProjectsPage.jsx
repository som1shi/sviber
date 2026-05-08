import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, Tabs, Tab, Paper, Avatar, AvatarGroup, Chip,
  Divider, CircularProgress, Alert, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const PURPLE = '#7C5CFC';

const STATUS_TABS = ['All', 'Active', 'Paused', 'Completed', 'Abandoned'];

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draftOpen, setDraftOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', tags: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetch(`${API}/api/projects`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [user]);

  const tabLabel = STATUS_TABS[activeTab]?.toLowerCase();
  const filtered = tabLabel === 'all'
    ? projects
    : projects.filter((p) => p.status === tabLabel);

  const handleCreateDraft = async () => {
    if (!form.title.trim()) { setSaveError('Title is required'); return; }
    setSaving(true);
    setSaveError('');
    try {
      const res = await fetch(`${API}/api/projects/draft`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create draft');
      setProjects((prev) => [data, ...prev]);
      setDraftOpen(false);
      setForm({ title: '', description: '', tags: '' });
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ px: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Projects</Typography>
        <Alert severity="info">Sign in to see and manage your projects.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 1, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Projects</Typography>
          <Typography sx={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDraftOpen(true)}
          sx={{ backgroundColor: '#111', textTransform: 'none', fontWeight: 600, borderRadius: 20, '&:hover': { backgroundColor: '#333' } }}
        >
          New draft
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Divider sx={{ mb: 2 }} />

      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto', px: 1.5 },
          '& .MuiTabs-indicator': { backgroundColor: '#1a1a1a' },
          '& .Mui-selected': { color: '#1a1a1a !important' },
        }}
      >
        {STATUS_TABS.map((tab) => (
          <Tab key={tab} label={tab} />
        ))}
      </Tabs>

      {filtered.length === 0 ? (
        <Box sx={{
          p: 6, textAlign: 'center',
          border: '2px dashed #e5e7eb', borderRadius: 3,
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>No projects yet</Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
            Create a draft to start tracking your build.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDraftOpen(true)}
            sx={{ backgroundColor: '#111', textTransform: 'none', borderRadius: 20 }}
          >
            New draft
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {filtered.map((project) => (
            <Paper
              key={project._id}
              elevation={0}
              sx={{
                width: 280, border: '1px solid #e5e7eb', borderRadius: 3,
                p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5,
                cursor: 'pointer', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Chip
                  label={project.status}
                  size="small"
                  sx={{
                    height: 20, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
                    backgroundColor: project.status === 'active' ? '#dcfce7' : project.status === 'completed' ? '#dbeafe' : '#f3f4f6',
                    color: project.status === 'active' ? '#16a34a' : project.status === 'completed' ? '#1d4ed8' : '#6b7280',
                  }}
                />
                {!project.publishedToCommunity && (
                  <Chip label="Draft" size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#fef3c7', color: '#92400e' }} />
                )}
              </Box>

              <Typography sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.3 }}>
                {project.name}
              </Typography>

              {project.description && (
                <Typography sx={{ color: '#6b7280', fontSize: '0.82rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {project.description}
                </Typography>
              )}

              {project.tags?.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {project.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: '0.7rem', backgroundColor: '#ede9fe', color: '#5b21b6' }} />
                  ))}
                </Box>
              )}

              {project.contributors?.length > 0 && (
                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 26, height: 26, fontSize: '0.65rem' }, justifyContent: 'flex-start' }}>
                  {project.contributors.map((c, i) => (
                    <Avatar
                      key={c.user?._id || i}
                      src={c.user?.profilePic}
                      sx={{ bgcolor: PURPLE }}
                    >
                      {(c.user?.name || '?')[0]}
                    </Avatar>
                  ))}
                </AvatarGroup>
              )}
            </Paper>
          ))}

          {/* Create new card */}
          <Paper
            elevation={0}
            onClick={() => setDraftOpen(true)}
            sx={{
              width: 280, border: '2px dashed #d1d5db', borderRadius: 3,
              p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 1.5, cursor: 'pointer',
              backgroundColor: 'transparent', '&:hover': { backgroundColor: '#f9fafb' },
            }}
          >
            <Box sx={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AddIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>New draft</Typography>
            <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', textAlign: 'center' }}>
              Track a project and optionally share it to the community.
            </Typography>
          </Paper>
        </Box>
      )}

      {/* New draft dialog */}
      <Dialog open={draftOpen} onClose={() => setDraftOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>New draft project</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField
            label="Title"
            fullWidth
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <TextField
            label="Tags (comma separated)"
            fullWidth
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder="AI, B2B, Consumer"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDraftOpen(false)} sx={{ textTransform: 'none', color: '#6b7280' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateDraft}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: '#111', '&:hover': { backgroundColor: '#333' } }}
          >
            {saving ? 'Creating…' : 'Create draft'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
