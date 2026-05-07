import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, TextField, Button, Avatar, Divider, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [surveyDone, setSurveyDone] = useState(null);
  const [form, setForm] = useState({ displayName: '', role: '', school: '', bio: '', github: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [resumeFile, setResumeFile] = useState(null);
  const [resumeBonus, setResumeBonus] = useState(null);
  const [resumeReasons, setResumeReasons] = useState([]);
  const [resumeAnalyzing, setResumeAnalyzing] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [showResumeInput, setShowResumeInput] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/survey`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setSurveyDone(!!data))
      .catch(() => setSurveyDone(false));
  }, []);

  useEffect(() => {
    fetch(`${API}/api/users/me`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          displayName: data.displayName || '',
          role:        data.role || '',
          school:      data.school || '',
          bio:         data.bio || '',
          github:      data.github || '',
        });
        if (data.elo?.startingBonus > 0) {
          setResumeBonus(data.elo.startingBonus);
        }
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleResumeAnalyze = async () => {
    if (!resumeFile) return;
    setResumeAnalyzing(true);
    setResumeError('');
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await fetch(`${API}/api/users/me/resume`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResumeBonus(data.bonus);
      setResumeReasons(data.reasons || []);
      setResumeFile(null);
      setShowResumeInput(false);
    } catch (err) {
      setResumeError(err.message);
    }
    setResumeAnalyzing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const res = await fetch(`${API}/api/users/me`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
    } else {
      setError(`Save failed (${res.status}) — try logging out and back in.`);
    }
  };

  if (loading) return <CircularProgress sx={{ m: 4 }} />;

  return (
    <Box sx={{ maxWidth: 480, px: 2 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Settings</Typography>
      <Typography sx={{ color: '#6b7280', mb: 4 }}>Manage your founder profile.</Typography>

      {/* Co-founder survey action item */}
      {surveyDone !== true && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            mb: 4,
            borderRadius: 2,
            backgroundColor: '#f5f3ff',
            border: '1px solid #ddd6fe',
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: '#5b21b6' }}>
              Action item: Fill out your co-founder survey
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#7c3aed', mt: 0.25 }}>
              10 questions to help us match you with the right co-founder.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => navigate('/survey')}
            sx={{
              backgroundColor: '#7C5CFC',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              ml: 2,
              '&:hover': { backgroundColor: '#6a4de0' },
            }}
          >
            Start →
          </Button>
        </Box>
      )}

      {/* Resume ELO section */}
      <Box sx={{ mb: 4, p: 2, borderRadius: 2, border: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Resume</Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#6b7280', mt: 0.25 }}>
              {resumeBonus > 0
                ? `+${resumeBonus} ELO bonus earned`
                : 'Upload your resume to earn a starting ELO bonus.'}
            </Typography>
          </Box>
          <Button
            size="small"
            variant={resumeBonus > 0 ? 'outlined' : 'contained'}
            onClick={() => setShowResumeInput((v) => !v)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              ml: 2,
              whiteSpace: 'nowrap',
              ...(resumeBonus > 0
                ? { borderColor: '#d1d5db', color: '#6b7280' }
                : { backgroundColor: '#7C5CFC', '&:hover': { backgroundColor: '#6a4de0' } }),
            }}
          >
            {resumeBonus > 0 ? 'Re-analyze' : 'Add resume →'}
          </Button>
        </Box>

        {resumeBonus > 0 && resumeReasons.length > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {resumeReasons.map((r, i) => (
              <Box key={i} sx={{ px: 1.25, py: 0.4, borderRadius: 10, backgroundColor: '#f3f0ff', border: '1px solid #ddd6fe' }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#5b21b6' }}>{r}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {showResumeInput && (
          <Box sx={{ mt: 2 }}>
            <Button
              component="label"
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#d1d5db', color: '#374151', mb: 1.5 }}
            >
              {resumeFile ? resumeFile.name : 'Choose PDF or DOCX'}
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                hidden
                onChange={(e) => { setResumeFile(e.target.files[0] || null); setResumeError(''); }}
              />
            </Button>
            {resumeError && (
              <Typography sx={{ color: 'red', fontSize: '0.8rem', mb: 1 }}>{resumeError}</Typography>
            )}
            <Box>
              <Button
                variant="contained"
                onClick={handleResumeAnalyze}
                disabled={resumeAnalyzing || !resumeFile}
                sx={{
                  backgroundColor: '#7C5CFC',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#6a4de0' },
                }}
              >
                {resumeAnalyzing ? 'Analyzing...' : 'Analyze resume'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>

      {/* Avatar */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Avatar src={user?.avatar} sx={{ width: 72, height: 72, fontSize: '1.5rem' }}>
          {form.displayName?.[0]}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{form.displayName}</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#6b7280' }}>{user?.email}</Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Form fields */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <TextField
          label="Display Name"
          name="displayName"
          value={form.displayName}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Role (e.g. Builder, Designer, Founder)"
          name="role"
          value={form.role}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="School (e.g. UC Berkeley '27)"
          name="school"
          value={form.school}
          onChange={handleChange}
          fullWidth
        />
        <TextField
          label="Bio"
          name="bio"
          value={form.bio}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
        />
        <TextField
          label="GitHub (e.g. github.com/username)"
          name="github"
          value={form.github}
          onChange={handleChange}
          fullWidth
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 4 }}>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{ backgroundColor: '#1a1a1a', '&:hover': { backgroundColor: '#333' } }}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
        {saved && <Typography sx={{ color: 'green', fontSize: '0.9rem' }}>Saved!</Typography>}
        {error && <Typography sx={{ color: 'red', fontSize: '0.9rem' }}>{error}</Typography>}
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Logout */}
      <Button
        variant="outlined"
        color="error"
        onClick={logout}
      >
        Log out
      </Button>
    </Box>
  );
}
