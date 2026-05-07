import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';

const stats = [
  { label: 'Active', value: 2, sub: '+1 this week', subColor: '#16a34a' },
  { label: 'Shipped', value: 0, sub: null },
  { label: 'Commits', value: 189, sub: '+45 this week', subColor: '#16a34a' },
  { label: 'Co-founders', value: 2, sub: 'across all builds', subColor: '#6b7280' },
  { label: 'ELO Impact', value: '-10', sub: 'this week', subColor: '#dc2626' },
];

const tabs = ['All', 'Active', 'Shipping', 'Live', 'Paused', 'Archived'];
const tabCounts = { All: 2, Active: 2, Shipping: 1, Live: 1, Archived: 28 };

const projects = [
  {
    id: 1,
    tag: 'Consumer',
    title: 'Two Man Searcher',
    description: 'Stop pulling up solo. Two-Man matches you with a partner for the next run, every time.',
    avatars: ['DI', 'SS'],
    cofounder: 'Sarvagya S.',
    live: true,
    metric: { label: 'Users This Week', value: 72, suffix: '+150' },
    footer: ['45 days live', '15 orders'],
    featured: true,
  },
  {
    id: 2,
    tag: 'Consumer',
    title: 'Malatang Optimizer',
    description: 'Stop overpaying for soggy lotus root. Our malatang optimizer ranks every ingredient by flavor-per-gram and builds the bowl you actually wanted.',
    avatars: ['DI', 'SK'],
    cofounder: 'Sun Min K.',
    live: false,
    metric: { label: 'Build Progress', value: 36, suffix: '36%' },
    footer: ['12 days in', '15 commits', 'last 3h ago'],
    featured: false,
  },
];

const avatarColors = {
  DI: { bg: '#d1d5db', fg: '#374151' },
  SS: { bg: '#bbf7d0', fg: '#15803d' },
  SK: { bg: '#bfdbfe', fg: '#1d4ed8' },
};

export default function ProjectsPage() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [userProjects, setUserProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function loadProjects() {
    try {
      setProjectsError('');
      setLoadingProjects(true);
      const res = await fetch(`${API}/api/projects`, { credentials: 'include' });
      if (res.status === 401) {
        setUserProjects([]);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load projects');
      }
      const data = await res.json();
      setUserProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setProjectsError(err.message || 'Failed to load projects');
    } finally {
      setLoadingProjects(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleSubmitProject() {
    try {
      setSubmitting(true);
      setFormError('');

      let imageUploadId = '';
      let imageUrl = '';
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        const uploadRes = await fetch(`${API}/api/uploads?kind=idea`, {
          method: 'POST',
          credentials: 'include',
          body: fd,
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(body.error || 'Image upload failed');
        }
        const upload = await uploadRes.json();
        imageUploadId = upload._id;
        imageUrl = `${API}${upload.url}`;
      }

      const createRes = await fetch(`${API}/api/projects/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          tags,
          projectUrl,
          imageUpload: imageUploadId || undefined,
          imageUrl,
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(body.error || 'Could not create project draft');
      }

      setFormOpen(false);
      setTitle('');
      setDescription('');
      setTags('');
      setProjectUrl('');
      setImageFile(null);
      await loadProjects();
    } catch (err) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Projects
      </Typography>
      <Typography sx={{ color: '#6b7280', fontSize: '0.875rem', mb: 3 }}>
        2 active builds &nbsp;•&nbsp; 1 shipped this season &nbsp;•&nbsp; streak 6 days
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        {stats.map((stat) => (
          <Box key={stat.label}>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
              {stat.label}
            </Typography>
            <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>
              {stat.value}
            </Typography>
            {stat.sub && (
              <Typography sx={{ fontSize: '0.75rem', color: stat.subColor }}>
                {stat.sub}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Tabs */}
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
        {tabs.map((tab) => (
          <Tab
            key={tab}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {tab}
                {tabCounts[tab] !== undefined && (
                  <Typography
                    component="span"
                    sx={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}
                  >
                    {tabCounts[tab]}
                  </Typography>
                )}
              </Box>
            }
          />
        ))}
      </Tabs>

      {/* Cards grid */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {loadingProjects ? (
          <Box sx={{ width: '100%', py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : userProjects.length === 0 ? (
          <Typography sx={{ color: '#9ca3af', py: 8, textAlign: 'center', width: '100%' }}>
            No projects yet. Create a draft project to build in private.
          </Typography>
        ) : (
          userProjects.map((project) => (
            <Paper
              key={project._id || project.id}
              elevation={0}
              onClick={() => {
                setSelectedProject(project);
                setDetailsOpen(true);
              }}
              sx={{
                width: 260,
                border: '1px solid #e5e7eb',
                borderRadius: 3,
                p: 2.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                backgroundColor: '#fafaf8',
                cursor: 'pointer',
              }}
            >
              {project.imageUrl && (
                <Box
                  component="img"
                  src={project.imageUrl}
                  alt={project.name}
                  sx={{
                    width: '100%',
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                  }}
                />
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={project.publishedToCommunity || project.idea ? 'Published' : 'Draft'}
                  size="small"
                  sx={{
                    backgroundColor: (project.publishedToCommunity || project.idea) ? '#ecfdf5' : '#f3f4f6',
                    color: (project.publishedToCommunity || project.idea) ? '#047857' : '#6b7280',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    height: 20,
                  }}
                />
                {project.tags?.[0] && (
                  <Chip
                    label={project.tags[0]}
                    size="small"
                    sx={{ backgroundColor: '#f3f4f6', color: '#6b7280', fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', mb: 0.5 }}>
                  {project.name}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', lineHeight: 1.4 }}>
                  {project.description || 'No description yet.'}
                </Typography>
              </Box>

              {!!project.tags?.length && (
                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 'auto' }}>
                  {project.tags.slice(0, 3).map((t) => (
                    <Chip key={t} label={t} size="small" sx={{ backgroundColor: '#f9fafb', color: '#374151' }} />
                  ))}
                </Box>
              )}
            </Paper>
          ))
        )}

        {/* Start a new project card */}
        <Paper
          elevation={0}
          sx={{
            width: 260,
            border: '2px dashed #d1d5db',
            borderRadius: 3,
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
            cursor: 'pointer',
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: '#f9fafb' },
          }}
          onClick={() => setFormOpen(true)}
        >
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AddIcon sx={{ color: '#fff', fontSize: 28 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>
            Start a new project
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#6b7280', textAlign: 'center' }}>
            Create a draft project now, then publish to Community when you’re ready.
          </Typography>
        </Paper>
      </Box>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create project draft</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {formError && <Alert severity="error">{formError}</Alert>}
          <TextField
            label="Project title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <TextField
            label="Tags (comma separated)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="AI, Consumer, Marketplace"
            fullWidth
          />
          <TextField
            label="Project URL (optional)"
            value={projectUrl}
            onChange={(e) => setProjectUrl(e.target.value)}
            placeholder="https://..."
            fullWidth
          />
          <Button variant="outlined" component="label">
            {imageFile ? `Image: ${imageFile.name}` : 'Upload image (optional)'}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitProject}
            disabled={submitting || !title.trim() || !description.trim()}
          >
            {submitting ? 'Submitting...' : 'Create draft'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedProject(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Project details</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {selectedProject ? (
            <>
              {selectedProject.imageUrl && (
                <Box
                  component="img"
                  src={selectedProject.imageUrl}
                  alt={selectedProject.name}
                  sx={{
                    width: '100%',
                    height: 220,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                  }}
                />
              )}

              <Typography sx={{ fontWeight: 900, fontSize: '1.05rem' }}>
                {selectedProject.name}
              </Typography>
              <Typography sx={{ color: '#6b7280', lineHeight: 1.5 }}>
                {selectedProject.description || 'No description yet.'}
              </Typography>

              {!!selectedProject.tags?.length && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {selectedProject.tags.map((t) => (
                    <Chip key={t} label={t} size="small" sx={{ backgroundColor: '#f9fafb', color: '#374151' }} />
                  ))}
                </Box>
              )}
            </>
          ) : (
            <Typography sx={{ color: '#6b7280' }}>No project selected.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDetailsOpen(false);
              setSelectedProject(null);
            }}
          >
            Close
          </Button>
          {selectedProject && !(selectedProject.publishedToCommunity || selectedProject.idea) && (
            <Button
              variant="contained"
              disabled={publishing}
              onClick={async () => {
                if (!selectedProject?._id) return;
                try {
                  setPublishing(true);
                  const res = await fetch(`${API}/api/projects/${selectedProject._id}/publish`, {
                    method: 'POST',
                    credentials: 'include',
                  });
                  if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body.error || 'Failed to publish to community');
                  }
                  await loadProjects();
                  setDetailsOpen(false);
                  setSelectedProject(null);
                  navigate('/app/community', { state: { tabIndex: 1 } });
                } catch (err) {
                  // keep dialog open; error surfaced via console for now
                  // (could be shown as Alert if you want)
                  console.error(err);
                } finally {
                  setPublishing(false);
                }
              }}
            >
              {publishing ? 'Publishing...' : 'Add to Community'}
            </Button>
          )}
          {selectedProject && (selectedProject.publishedToCommunity || selectedProject.idea) && (
            <Button
              variant="contained"
              onClick={() => {
                setDetailsOpen(false);
                setSelectedProject(null);
                navigate('/app/community', { state: { tabIndex: 1 } });
              }}
            >
              View in Community
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
