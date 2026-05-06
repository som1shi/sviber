import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Slider, TextField,
  LinearProgress, ToggleButton, ToggleButtonGroup,
} from '@mui/material';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const PURPLE = '#7C5CFC';

const QUESTIONS = [
  {
    id: 'skills',
    category: 'Roles',
    question: 'Rate yourself in each area (1 = beginner, 10 = expert)',
    type: 'skills',
    fields: ['Engineering', 'Product', 'Design', 'Sales', 'Marketing'],
  },
  {
    id: 'hours',
    category: 'Commitment',
    question: 'How many hours per week are you willing to commit?',
    type: 'choice',
    options: ['< 20 hrs', '20–40 hrs', '40–60 hrs', '60+ hrs'],
  },
  {
    id: 'strengths',
    category: 'How You Operate',
    question: 'What are your biggest strengths and superpowers?',
    type: 'text',
    placeholder: 'e.g. I move fast, I\'m great at talking to users, I can build end-to-end...',
  },
  {
    id: 'weaknesses',
    category: 'How You Operate',
    question: 'What are your weaknesses? How do you compensate for them?',
    type: 'text',
    placeholder: 'e.g. I avoid conflict — I try to address it early before it festers...',
  },
  {
    id: 'whynow',
    category: 'Personal Motivation',
    question: 'Why do you want to start a company right now?',
    type: 'text',
    placeholder: 'e.g. I\'ve spent 3 years in the space and see a clear gap...',
  },
  {
    id: 'ambition',
    category: 'Corporate Structure',
    question: 'Where do you want this startup to go?',
    type: 'choice',
    options: ['Lifestyle business', 'Solid acquisition ($1–10M)', 'Big exit ($10–100M)', 'Go big or go home (IPO)'],
  },
  {
    id: 'funding',
    category: 'Corporate Structure',
    question: 'How much money should we raise?',
    type: 'choice',
    options: ['Bootstrap it', 'Pre-seed (~$500K)', 'Seed (~$2M)', 'As much as we can'],
  },
  {
    id: 'runway',
    category: 'Commitment & Finances',
    question: 'How many months can you go without a salary?',
    type: 'choice',
    options: ['0–3 months', '3–6 months', '6–12 months', '12+ months'],
  },
  {
    id: 'culture',
    category: 'Team Culture',
    question: 'Complete the sentence: I\'d be proud for people to describe our company culture as...',
    type: 'text',
    placeholder: 'e.g. relentlessly focused, deeply caring, move fast and own it...',
  },
  {
    id: 'conflict',
    category: 'Co-Founder Relationship',
    question: 'How do you handle conflict and stalemates with a partner?',
    type: 'text',
    placeholder: 'e.g. I address issues directly and early, I don\'t let things simmer...',
  },
];

const defaultAnswers = () => {
  const a = {};
  QUESTIONS.forEach((q) => {
    if (q.type === 'skills') {
      a[q.id] = Object.fromEntries(q.fields.map((f) => [f, 5]));
    } else {
      a[q.id] = '';
    }
  });
  return a;
};

export default function SurveyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(defaultAnswers());
  const [saving, setSaving] = useState(false);

  const q = QUESTIONS[step];
  const progress = ((step) / QUESTIONS.length) * 100;
  const isLast = step === QUESTIONS.length - 1;

  const isAnswered = () => {
    if (q.type === 'skills') return true;
    return answers[q.id]?.trim().length > 0;
  };

  const handleSkillChange = (field, val) => {
    setAnswers((prev) => ({
      ...prev,
      skills: { ...prev.skills, [field]: val },
    }));
  };

  const handleNext = async () => {
    if (isLast) {
      setSaving(true);
      try {
        await fetch(`${API}/api/survey`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(answers),
        });
      } catch (_) {}
      setSaving(false);
      navigate('/app/swipe');
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#0f0f0f',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 560 }}>
        {/* Exit */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <Button
            onClick={() => navigate('/app/settings')}
            sx={{ color: 'rgba(255,255,255,0.35)', textTransform: 'none', fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem' }}
          >
            Exit survey
          </Button>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace' }}>
              {q.category}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontFamily: '"DM Mono", monospace' }}>
              {step + 1} / {QUESTIONS.length}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.08)',
              '& .MuiLinearProgress-bar': { backgroundColor: PURPLE, borderRadius: 2 },
            }}
          />
        </Box>

        {/* Question */}
        <Typography
          sx={{
            fontSize: { xs: '1.3rem', sm: '1.6rem' },
            fontWeight: 700,
            color: '#fff',
            fontFamily: '"DM Sans", sans-serif',
            mb: 4,
            lineHeight: 1.3,
          }}
        >
          {q.question}
        </Typography>

        {/* Answer input */}
        {q.type === 'text' && (
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={q.placeholder}
            value={answers[q.id]}
            onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                color: '#fff',
                fontFamily: '"DM Sans", sans-serif',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.25)' },
                '&.Mui-focused fieldset': { borderColor: PURPLE },
              },
              '& .MuiOutlinedInput-input::placeholder': { color: 'rgba(255,255,255,0.3)', opacity: 1 },
            }}
          />
        )}

        {q.type === 'choice' && (
          <ToggleButtonGroup
            exclusive
            value={answers[q.id]}
            onChange={(_, val) => { if (val) setAnswers((prev) => ({ ...prev, [q.id]: val })); }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}
          >
            {q.options.map((opt) => (
              <ToggleButton
                key={opt}
                value={opt}
                sx={{
                  justifyContent: 'flex-start',
                  px: 3,
                  py: 1.5,
                  borderRadius: '10px !important',
                  border: '1px solid rgba(255,255,255,0.12) !important',
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.95rem',
                  textTransform: 'none',
                  '&.Mui-selected': {
                    backgroundColor: `${PURPLE}22`,
                    borderColor: `${PURPLE} !important`,
                    color: '#fff',
                  },
                  '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' },
                }}
              >
                {opt}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}

        {q.type === 'skills' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {q.fields.map((field) => (
              <Box key={field}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ color: '#fff', fontFamily: '"DM Sans", sans-serif', fontSize: '0.95rem' }}>
                    {field}
                  </Typography>
                  <Typography sx={{ color: PURPLE, fontFamily: '"DM Mono", monospace', fontWeight: 700 }}>
                    {answers.skills[field]}
                  </Typography>
                </Box>
                <Slider
                  min={1}
                  max={10}
                  value={answers.skills[field]}
                  onChange={(_, val) => handleSkillChange(field, val)}
                  sx={{
                    color: PURPLE,
                    '& .MuiSlider-track': { backgroundColor: PURPLE },
                    '& .MuiSlider-thumb': { backgroundColor: PURPLE },
                    '& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.12)' },
                  }}
                />
              </Box>
            ))}
          </Box>
        )}

        {/* Nav buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
          <Button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontFamily: '"DM Sans", sans-serif' }}
          >
            ← Back
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isAnswered() || saving}
            sx={{
              backgroundColor: PURPLE,
              borderRadius: 2,
              px: 4,
              py: 1.25,
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#6a4de0' },
              '&.Mui-disabled': { backgroundColor: 'rgba(124,92,252,0.3)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            {isLast ? (saving ? 'Saving...' : 'Finish →') : 'Next →'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
