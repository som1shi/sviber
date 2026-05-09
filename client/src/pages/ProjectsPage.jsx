import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Chip,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Autocomplete,
  Checkbox,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useAuth } from '../context/AuthContext';

const tabs = ['All', 'Active', 'Shipping', 'Live', 'Paused', 'Archived'];
const PROJECT_CHECKLIST_ITEMS = [
  'Problem statement is clear',
  'Target user defined',
  'MVP scope is realistic',
  'Success metric selected',
  'Launch plan drafted',
  'Top risks identified',
];

export default function ProjectsPage() {
  // In dev, use same-origin paths so cookies work via Vite proxy.
  const API = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || '');
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
  const [tags, setTags] = useState([]);
  const [projectUrl, setProjectUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [imageFile, setImageFile] = useState(null);
  const [planningProblem, setPlanningProblem] = useState('');
  const [planningTargetUser, setPlanningTargetUser] = useState('');
  const [planningMvpScope, setPlanningMvpScope] = useState('');
  const [planningSuccessMetric, setPlanningSuccessMetric] = useState('');
  const [planningLaunchGoal, setPlanningLaunchGoal] = useState('');
  const [planningRisks, setPlanningRisks] = useState('');
  const [planningChecklistDone, setPlanningChecklistDone] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [cofoundersOpen, setCofoundersOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [matchPickStep, setMatchPickStep] = useState(true); // true = show recommendations first
  const [bookmarked, setBookmarked] = useState([]);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [detailsSaving, setDetailsSaving] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const [detailsTitle, setDetailsTitle] = useState('');
  const [detailsDescription, setDetailsDescription] = useState('');
  const [detailsTags, setDetailsTags] = useState([]);
  const [detailsProjectUrl, setDetailsProjectUrl] = useState('');
  const [detailsImageFile, setDetailsImageFile] = useState(null);
  const [detailsPlanningProblem, setDetailsPlanningProblem] = useState('');
  const [detailsPlanningTargetUser, setDetailsPlanningTargetUser] = useState('');
  const [detailsPlanningMvpScope, setDetailsPlanningMvpScope] = useState('');
  const [detailsPlanningSuccessMetric, setDetailsPlanningSuccessMetric] = useState('');
  const [detailsPlanningLaunchGoal, setDetailsPlanningLaunchGoal] = useState('');
  const [detailsPlanningRisks, setDetailsPlanningRisks] = useState('');
  const [detailsPlanningChecklistDone, setDetailsPlanningChecklistDone] = useState([]);
  const [communityTagOptions, setCommunityTagOptions] = useState([]);

  async function loadMatches() {
    try {
      const res = await fetch(`${API}/api/matches`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch { /* silent */ }
  }

  function openCreateDialog() {
    setMatchPickStep(true);
    setTitle('');
    setDescription('');
    setTags([]);
    setProjectUrl('');
    setImageFile(null);
    setPlanningProblem('');
    setPlanningTargetUser('');
    setPlanningMvpScope('');
    setPlanningSuccessMetric('');
    setPlanningLaunchGoal('');
    setPlanningRisks('');
    setPlanningChecklistDone([]);
    setFormError('');
    loadMatches();
    setFormOpen(true);
  }

  function prefillFromMatch(match) {
    const idea = match.idea || {};
    const partner = match.users?.find((u) => String(u._id || u.id) !== String(user?._id || user?.id));
    setTitle(idea.title || '');
    setDescription(idea.description || '');
    setTags(Array.isArray(idea.tags) ? idea.tags : []);
    setPlanningProblem(idea.description || '');
    setPlanningTargetUser('');
    setMatchPickStep(false);
  }

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

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API}/api/ideas?tab=new`, { credentials: 'include' });
        const data = res.ok ? await res.json() : [];
        const tagsFromIdeas = Array.isArray(data) ? data.flatMap((i) => (Array.isArray(i.tags) ? i.tags : [])) : [];
        const tagsFromProjects = userProjects.flatMap((p) => (Array.isArray(p.tags) ? p.tags : []));
        const merged = [...tagsFromIdeas, ...tagsFromProjects]
          .map((t) => String(t || '').trim())
          .filter(Boolean);
        const uniq = [...new Set(merged)].sort((a, b) => a.localeCompare(b));
        if (alive) setCommunityTagOptions(uniq);
      } catch {
        const fallback = userProjects
          .flatMap((p) => (Array.isArray(p.tags) ? p.tags : []))
          .map((t) => String(t || '').trim())
          .filter(Boolean);
        if (alive) setCommunityTagOptions([...new Set(fallback)].sort((a, b) => a.localeCompare(b)));
      }
    })();
    return () => { alive = false; };
  }, [API, userProjects]);

  const projectsWithMeta = useMemo(
    () =>
      userProjects.map((p) => ({
        ...p,
        isDraft: !(p.publishedToCommunity || p.idea),
        isArchived: p.status === 'abandoned',
        isPaused: p.status === 'paused',
        isLive: (p.publishedToCommunity || p.idea) && p.status === 'completed',
        isShipping: (p.publishedToCommunity || p.idea) && ['active', 'paused'].includes(p.status || 'active'),
      })),
    [userProjects]
  );

  const draftProjects = useMemo(
    () => projectsWithMeta.filter((p) => p.isDraft),
    [projectsWithMeta]
  );
  const publishedProjects = useMemo(
    () => projectsWithMeta.filter((p) => !p.isDraft),
    [projectsWithMeta]
  );

  const tabCounts = useMemo(
    () => ({
      All: publishedProjects.length,
      Active: publishedProjects.filter((p) => !p.isArchived && !p.isPaused).length,
      Shipping: publishedProjects.filter((p) => p.isShipping && !p.isLive).length,
      Live: publishedProjects.filter((p) => p.isLive).length,
      Paused: publishedProjects.filter((p) => p.isPaused).length,
      Archived: publishedProjects.filter((p) => p.isArchived).length,
    }),
    [publishedProjects]
  );

  const filteredByTab = useMemo(() => {
    const name = tabs[activeTab];
    if (name === 'Active') return publishedProjects.filter((p) => !p.isArchived && !p.isPaused);
    if (name === 'Shipping') return publishedProjects.filter((p) => p.isShipping && !p.isLive);
    if (name === 'Live') return publishedProjects.filter((p) => p.isLive);
    if (name === 'Paused') return publishedProjects.filter((p) => p.isPaused);
    if (name === 'Archived') return publishedProjects.filter((p) => p.isArchived);
    return publishedProjects;
  }, [activeTab, publishedProjects]);

  const searchedProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = q
      ? filteredByTab.filter((p) =>
          [p.name, p.description, ...(p.tags || [])]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(q))
        )
      : filteredByTab;

    const sorted = [...base];
    if (sortBy === 'name') sorted.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
    if (sortBy === 'oldest') sorted.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    if (sortBy === 'recent') sorted.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    return sorted;
  }, [filteredByTab, searchQuery, sortBy]);

  const cofoundersCount = useMemo(
    () =>
      publishedProjects.reduce((sum, p) => sum + Math.max(0, (p.contributors?.length || 0) - 1), 0),
    [publishedProjects]
  );

  const stats = useMemo(
    () => [
      { label: 'Active', value: tabCounts.Active, sub: `${draftProjects.length} drafts`, subColor: '#16a34a' },
      { label: 'Shipped', value: tabCounts.Live, sub: 'completed', subColor: '#6b7280' },
      { label: 'Published', value: publishedProjects.length, sub: 'in community', subColor: '#16a34a' },
      { label: 'Co-founders', value: cofoundersCount, sub: 'click to view', subColor: '#6b7280' },
      { label: 'ELO Momentum', value: '+0', sub: 'based on project outcomes', subColor: '#6b7280' },
    ],
    [tabCounts, draftProjects.length, publishedProjects.length, cofoundersCount]
  );

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
          planning: {
            problem: planningProblem,
            targetUser: planningTargetUser,
            mvpScope: planningMvpScope,
            successMetric: planningSuccessMetric,
            launchGoal: planningLaunchGoal,
            risks: planningRisks,
            checklistDone: planningChecklistDone,
          },
        }),
      });
      if (!createRes.ok) {
        const body = await createRes.json().catch(() => ({}));
        throw new Error(body.error || 'Could not create project draft');
      }

      setFormOpen(false);
      setTitle('');
      setDescription('');
      setTags([]);
      setProjectUrl('');
      setImageFile(null);
      setPlanningProblem('');
      setPlanningTargetUser('');
      setPlanningMvpScope('');
      setPlanningSuccessMetric('');
      setPlanningLaunchGoal('');
      setPlanningRisks('');
      setPlanningChecklistDone([]);
      await loadProjects();
    } catch (err) {
      setFormError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function openProjectDetails(project) {
    setSelectedProject(project);
    setDetailsOpen(true);
    setIsEditingDetails(false);
    setDetailsError('');
    setDetailsImageFile(null);
    setDetailsTitle(project?.name || '');
    setDetailsDescription(project?.description || '');
    setDetailsTags(project?.tags || []);
    setDetailsProjectUrl(project?.projectUrl || '');
    setDetailsPlanningProblem(project?.planning?.problem || '');
    setDetailsPlanningTargetUser(project?.planning?.targetUser || '');
    setDetailsPlanningMvpScope(project?.planning?.mvpScope || '');
    setDetailsPlanningSuccessMetric(project?.planning?.successMetric || '');
    setDetailsPlanningLaunchGoal(project?.planning?.launchGoal || '');
    setDetailsPlanningRisks(project?.planning?.risks || '');
    setDetailsPlanningChecklistDone(project?.planning?.checklistDone || []);
  }

  async function handleSaveProjectDetails() {
    if (!selectedProject?._id) return;
    try {
      setDetailsSaving(true);
      setDetailsError('');

      let imageUploadId;
      let imageUrl;
      if (detailsImageFile) {
        const fd = new FormData();
        fd.append('file', detailsImageFile);
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

      const res = await fetch(`${API}/api/projects/${selectedProject._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: detailsTitle,
          description: detailsDescription,
          tags: detailsTags,
          projectUrl: detailsProjectUrl,
          imageUpload: imageUploadId,
          imageUrl,
          planning: {
            problem: detailsPlanningProblem,
            targetUser: detailsPlanningTargetUser,
            mvpScope: detailsPlanningMvpScope,
            successMetric: detailsPlanningSuccessMetric,
            launchGoal: detailsPlanningLaunchGoal,
            risks: detailsPlanningRisks,
            checklistDone: detailsPlanningChecklistDone,
          },
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update project');
      }
      const updated = await res.json();
      setSelectedProject(updated);
      setIsEditingDetails(false);
      setDetailsImageFile(null);
      await loadProjects();
    } catch (err) {
      setDetailsError(err.message || 'Could not save project');
    } finally {
      setDetailsSaving(false);
    }
  }

  return (
    <Box>
      {/* Header */}
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
        Projects
      </Typography>
      <Typography sx={{ color: '#6b7280', fontSize: '0.875rem', mb: 3 }}>
        {tabCounts.Active} active builds &nbsp;•&nbsp; {tabCounts.Live} shipped this season &nbsp;•&nbsp;
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, color: '#b45309', fontWeight: 700 }}>
          <LocalFireDepartmentIcon sx={{ fontSize: 15 }} /> streak 6 days
        </Box>
      </Typography>

      {/* Stats row */}
      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
        {stats.map((stat) => (
          <Box key={stat.label}>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: 500 }}>
              {stat.label}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.1 }}>
                {stat.value}
              </Typography>
              {stat.label === 'ELO Momentum' && (
                <Tooltip title="ELO changes as projects are completed/abandoned and teammate ratings are submitted.">
                  <InfoOutlinedIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                </Tooltip>
              )}
            </Box>
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
          <Tooltip
            key={tab}
            title={
              tab === 'Shipping'
                ? 'Published and currently in progress.'
                : tab === 'Live'
                ? 'Shipped/completed projects.'
                : tab === 'Archived'
                ? 'Inactive or abandoned projects.'
                : ''
            }
            disableHoverListener={!['Shipping', 'Live', 'Archived'].includes(tab)}
          >
          <Tab
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
          </Tooltip>
        ))}
      </Tabs>

      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{
            minWidth: 260,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              height: 52,
              backgroundColor: '#fff',
              overflow: 'hidden',
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{
            minWidth: 220,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5,
              height: 52,
              fontWeight: 600,
              backgroundColor: '#fff',
              overflow: 'hidden',
            },
          }}
        >
          <MenuItem value="recent">Recently updated</MenuItem>
          <MenuItem value="oldest">Oldest first</MenuItem>
          <MenuItem value="name">Name A-Z</MenuItem>
        </TextField>
      </Box>

      {/* Cards grid */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'stretch' }}>
        {loadingProjects ? (
          <Box sx={{ width: '100%', py: 8, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        ) : searchedProjects.length === 0 ? (
          <Typography sx={{ color: '#9ca3af', py: 8, textAlign: 'center', width: '100%' }}>
            No projects match this filter.
          </Typography>
        ) : (
          searchedProjects.map((project) => (
            <Paper
              key={project._id || project.id}
              elevation={0}
              onClick={() => {
                openProjectDetails(project);
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
                    backgroundColor: (project.publishedToCommunity || project.idea) ? '#dcfce7' : '#f3f4f6',
                    color: (project.publishedToCommunity || project.idea) ? '#166534' : '#6b7280',
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
                <Button
                  size="small"
                  sx={{ minWidth: 'auto', ml: 'auto', p: 0.3 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const id = String(project._id || project.id);
                    setBookmarked((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    );
                  }}
                >
                  {bookmarked.includes(String(project._id || project.id)) ? (
                    <BookmarkIcon sx={{ fontSize: 16, color: '#1f2937' }} />
                  ) : (
                    <BookmarkBorderIcon sx={{ fontSize: 16, color: '#9ca3af' }} />
                  )}
                </Button>
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

              <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  variant="text"
                  sx={{ textTransform: 'none', px: 0, fontSize: 12 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedProject(project);
                    setCofoundersOpen(true);
                  }}
                >
                  {Math.max(0, (project.contributors?.length || 0) - 1)} co-founders
                </Button>
                <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                  Updated {new Date(project.updatedAt || Date.now()).toLocaleDateString()}
                </Typography>
              </Box>

              {project.isArchived && (
                <Alert severity="warning" sx={{ py: 0.25, mt: 0.25 }}>
                  Want to restart this? Open and resume work.
                </Alert>
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
          onClick={openCreateDialog}
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

      {!!draftProjects.length && (
        <Box sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 800, mb: 1 }}>My Drafts ({draftProjects.length})</Typography>
          <Typography sx={{ color: '#6b7280', fontSize: 13, mb: 1.5 }}>
            Drafts are hidden from the main feed until you publish.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {draftProjects.map((p) => (
              <Chip
                key={p._id}
                label={p.name}
                variant="outlined"
                onClick={() => {
                  openProjectDetails(p);
                }}
                sx={{ borderRadius: 2 }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{matchPickStep ? 'Start a project' : 'Create project draft'}</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>

          {/* ── Step 1: match recommendations ── */}
          {matchPickStep && (
            <Box>
              {matches.length > 0 && (
                <>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#374151', mb: 1.25 }}>
                    Start from a match
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    {matches.map((m) => {
                      const idea = m.idea || {};
                      const partner = m.users?.find((u) => String(u._id || u.id) !== String(user?._id || user?.id));
                      const partnerName = partner?.name?.trim() || partner?.email?.split('@')[0] || 'Co-founder';
                      return (
                        <Box
                          key={m._id}
                          onClick={() => prefillFromMatch(m)}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            p: 1.5, borderRadius: 2, border: '1px solid #e5e7eb',
                            cursor: 'pointer', backgroundColor: '#fafafa',
                            '&:hover': { backgroundColor: '#f3f0ff', borderColor: '#7C5CFC' },
                            transition: 'all 0.15s',
                          }}
                        >
                          <Avatar sx={{ width: 36, height: 36, bgcolor: '#7C5CFC', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                            {partnerName[0]?.toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {idea.title || 'Untitled idea'}
                            </Typography>
                            <Typography sx={{ fontSize: 12, color: '#6b7280' }}>
                              with {partnerName}
                            </Typography>
                          </Box>
                          {(idea.tags || []).slice(0, 2).map((t) => (
                            <Chip key={t} label={t} size="small" sx={{ fontSize: 11, height: 20 }} />
                          ))}
                        </Box>
                      );
                    })}
                  </Box>
                  <Divider sx={{ mb: 2 }}>
                    <Typography sx={{ fontSize: 12, color: '#9ca3af', px: 1 }}>or</Typography>
                  </Divider>
                </>
              )}
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setMatchPickStep(false)}
                sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#d1d5db', color: '#374151', '&:hover': { borderColor: '#7C5CFC', color: '#7C5CFC' } }}
              >
                Start from scratch
              </Button>
            </Box>
          )}

          {/* ── Step 2: the actual form ── */}
          {!matchPickStep && (
            <>
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                <Chip size="small" label="1. Basics" sx={{ fontWeight: 700 }} />
                <Chip size="small" label="2. Add link + tags" sx={{ fontWeight: 700 }} />
                <Chip size="small" label="3. Upload cover" sx={{ fontWeight: 700 }} />
              </Box>
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
          <Autocomplete
            multiple
            freeSolo
            options={communityTagOptions}
            value={tags}
            onChange={(_, value) => setTags(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Tags"
                placeholder="Choose from Community tags or type your own"
                fullWidth
              />
            )}
          />
          <TextField
            label="Problem you're solving"
            value={planningProblem}
            onChange={(e) => setPlanningProblem(e.target.value)}
            placeholder="What pain point are you fixing?"
            fullWidth
          />
          <TextField
            label="Target user"
            value={planningTargetUser}
            onChange={(e) => setPlanningTargetUser(e.target.value)}
            placeholder="Who is this for?"
            fullWidth
          />
          <TextField
            label="MVP scope"
            value={planningMvpScope}
            onChange={(e) => setPlanningMvpScope(e.target.value)}
            placeholder="What is the smallest shippable version?"
            fullWidth
          />
          <TextField
            label="Success metric"
            value={planningSuccessMetric}
            onChange={(e) => setPlanningSuccessMetric(e.target.value)}
            placeholder="How will you know this is working?"
            fullWidth
          />
          <TextField
            label="Launch goal"
            value={planningLaunchGoal}
            onChange={(e) => setPlanningLaunchGoal(e.target.value)}
            placeholder="Target date or milestone"
            fullWidth
          />
          <TextField
            label="Top risks"
            value={planningRisks}
            onChange={(e) => setPlanningRisks(e.target.value)}
            placeholder="What's most likely to block this?"
            fullWidth
          />
          <Box sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#fafafa' }}>
            <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.75 }}>Project build checklist</Typography>
            <FormGroup>
              {PROJECT_CHECKLIST_ITEMS.map((item) => (
                <FormControlLabel
                  key={item}
                  control={(
                    <Checkbox
                      checked={planningChecklistDone.includes(item)}
                      onChange={(e) => {
                        setPlanningChecklistDone((prev) =>
                          e.target.checked ? [...prev, item] : prev.filter((x) => x !== item)
                        );
                      }}
                      size="small"
                    />
                  )}
                  label={<Typography sx={{ fontSize: 13 }}>{item}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
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
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</Button>
          {!matchPickStep && (
            <Button
              variant="contained"
              onClick={handleSubmitProject}
              disabled={submitting || !title.trim() || !description.trim()}
            >
              {submitting ? 'Submitting...' : 'Create draft'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedProject(null);
          setIsEditingDetails(false);
          setDetailsError('');
          setDetailsImageFile(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Project details</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
          {detailsError && <Alert severity="error">{detailsError}</Alert>}
          {selectedProject ? (
            <>
              {(selectedProject.imageUrl || isEditingDetails) && (
                <Box
                  component="img"
                  src={selectedProject.imageUrl || 'https://placehold.co/1000x500?text=No+cover+yet'}
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

              {isEditingDetails ? (
                <>
                  <TextField
                    label="Project title"
                    value={detailsTitle}
                    onChange={(e) => setDetailsTitle(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Description"
                    value={detailsDescription}
                    onChange={(e) => setDetailsDescription(e.target.value)}
                    multiline
                    minRows={4}
                    fullWidth
                  />
                  <Autocomplete
                    multiple
                    freeSolo
                    options={communityTagOptions}
                    value={detailsTags}
                    onChange={(_, value) => setDetailsTags(value)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tags"
                        placeholder="Choose from Community tags or type your own"
                        fullWidth
                      />
                    )}
                  />
                  <TextField
                    label="Problem you're solving"
                    value={detailsPlanningProblem}
                    onChange={(e) => setDetailsPlanningProblem(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Target user"
                    value={detailsPlanningTargetUser}
                    onChange={(e) => setDetailsPlanningTargetUser(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="MVP scope"
                    value={detailsPlanningMvpScope}
                    onChange={(e) => setDetailsPlanningMvpScope(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Success metric"
                    value={detailsPlanningSuccessMetric}
                    onChange={(e) => setDetailsPlanningSuccessMetric(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Launch goal"
                    value={detailsPlanningLaunchGoal}
                    onChange={(e) => setDetailsPlanningLaunchGoal(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Top risks"
                    value={detailsPlanningRisks}
                    onChange={(e) => setDetailsPlanningRisks(e.target.value)}
                    fullWidth
                  />
                  <Box sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#fafafa' }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 800, mb: 0.75 }}>Project build checklist</Typography>
                    <FormGroup>
                      {PROJECT_CHECKLIST_ITEMS.map((item) => (
                        <FormControlLabel
                          key={item}
                          control={(
                            <Checkbox
                              checked={detailsPlanningChecklistDone.includes(item)}
                              onChange={(e) => {
                                setDetailsPlanningChecklistDone((prev) =>
                                  e.target.checked ? [...prev, item] : prev.filter((x) => x !== item)
                                );
                              }}
                              size="small"
                            />
                          )}
                          label={<Typography sx={{ fontSize: 13 }}>{item}</Typography>}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                  <TextField
                    label="Project URL"
                    value={detailsProjectUrl}
                    onChange={(e) => setDetailsProjectUrl(e.target.value)}
                    placeholder="https://..."
                    fullWidth
                  />
                  <Button variant="outlined" component="label">
                    {detailsImageFile ? `New image: ${detailsImageFile.name}` : 'Replace cover image (optional)'}
                    <input
                      hidden
                      type="file"
                      accept="image/*"
                      onChange={(e) => setDetailsImageFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                </>
              ) : (
                <>
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
                  <Box sx={{ p: 1.5, border: '1px solid #e5e7eb', borderRadius: 2, backgroundColor: '#fcfcfc' }}>
                    <Typography sx={{ fontWeight: 800, fontSize: 14, mb: 0.75 }}>
                      Project guide
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 0.5 }}>
                      Problem: {selectedProject.planning?.problem || 'Not set'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 0.5 }}>
                      Target user: {selectedProject.planning?.targetUser || 'Not set'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 0.5 }}>
                      MVP scope: {selectedProject.planning?.mvpScope || 'Not set'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 0.5 }}>
                      Success metric: {selectedProject.planning?.successMetric || 'Not set'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 0.5 }}>
                      Launch goal: {selectedProject.planning?.launchGoal || 'Not set'}
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#6b7280', mb: 1 }}>
                      Risks: {selectedProject.planning?.risks || 'Not set'}
                    </Typography>
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                      Checklist progress: {(selectedProject.planning?.checklistDone || []).length}/{PROJECT_CHECKLIST_ITEMS.length}
                    </Typography>
                  </Box>
                </>
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
              setIsEditingDetails(false);
              setDetailsError('');
            }}
          >
            Close
          </Button>
          {selectedProject && (
            <Button
              onClick={() => {
                if (isEditingDetails) {
                  setIsEditingDetails(false);
                  setDetailsError('');
                  setDetailsImageFile(null);
                  setDetailsTitle(selectedProject.name || '');
                  setDetailsDescription(selectedProject.description || '');
                  setDetailsTags(selectedProject.tags || []);
                  setDetailsProjectUrl(selectedProject.projectUrl || '');
                  setDetailsPlanningProblem(selectedProject.planning?.problem || '');
                  setDetailsPlanningTargetUser(selectedProject.planning?.targetUser || '');
                  setDetailsPlanningMvpScope(selectedProject.planning?.mvpScope || '');
                  setDetailsPlanningSuccessMetric(selectedProject.planning?.successMetric || '');
                  setDetailsPlanningLaunchGoal(selectedProject.planning?.launchGoal || '');
                  setDetailsPlanningRisks(selectedProject.planning?.risks || '');
                  setDetailsPlanningChecklistDone(selectedProject.planning?.checklistDone || []);
                } else {
                  setIsEditingDetails(true);
                }
              }}
            >
              {isEditingDetails ? 'Cancel edit' : 'Edit'}
            </Button>
          )}
          {selectedProject && isEditingDetails && (
            <Button
              variant="contained"
              disabled={detailsSaving || !detailsTitle.trim() || !detailsDescription.trim()}
              onClick={handleSaveProjectDetails}
            >
              {detailsSaving ? 'Saving...' : 'Save changes'}
            </Button>
          )}
          {selectedProject && !(selectedProject.publishedToCommunity || selectedProject.idea) && (
            <Button
              variant="contained"
              disabled={publishing || isEditingDetails}
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

      <Dialog
        open={cofoundersOpen}
        onClose={() => setCofoundersOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Co-founders</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.25, pt: 1 }}>
          {(selectedProject?.contributors || [])
            .filter((c) => String(c.user?._id || c.user) !== String(user?._id || user?.id))
            .map((c, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, border: '1px solid #e5e7eb', borderRadius: 2 }}>
                <Avatar src={c.user?.profilePic} sx={{ width: 30, height: 30 }}>
                  {!c.user?.profilePic ? String(c.user?.name || 'U').charAt(0).toUpperCase() : null}
                </Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{c.user?.name || 'Contributor'}</Typography>
                  <Typography sx={{ color: '#6b7280', fontSize: 12 }}>{c.role || 'Co-founder'}</Typography>
                </Box>
              </Box>
            ))}
          {((selectedProject?.contributors || []).filter((c) => String(c.user?._id || c.user) !== String(user?._id || user?.id)).length === 0) && (
            <Typography sx={{ color: '#9ca3af' }}>No co-founders added yet.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCofoundersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
