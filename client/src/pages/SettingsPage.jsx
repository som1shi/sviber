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
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
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
