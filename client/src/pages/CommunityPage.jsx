import { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Card, CardContent,
  Avatar, Chip, IconButton, Button, Divider
} from '@mui/material';
import {
  KeyboardArrowUp, KeyboardArrowDown, Star, StarBorder,
  Build, Add, LocalFireDepartment
} from '@mui/icons-material';

const TABS = ['Hot', 'New', 'Building', 'Mine'];

const mockIdeas = [
  {
    id: 1,
    author: 'Ariel S.',
    authorElo: 847,
    role: 'Founder',
    title: 'BOGO Optimizer — never pay full price again',
    description: 'ML model that tracks every BOGO deal across 200+ grocery chains, tells you exactly when to bulk-buy Oreos. IRR on snacks: 340%.',
    heat: 94,
    upvotes: 312,
    builders: 41,
    tags: ['AI', 'Finance'],
    saved: false,
    building: false,
    isNew: false,
  },
  {
    id: 2,
    author: 'Rishabh A.',
    authorElo: 612,
    role: 'Builder',
    title: "LinkedIn but for your dog — PawdIn",
    description: "Professional networking for dogs. Endorse your golden retriever for 'fetching' and 'squirrel awareness'. 500+ connections or you're a bad owner.",
    heat: 88,
    upvotes: 245,
    builders: 18,
    tags: ['Social', 'Pets'],
    saved: true,
    building: false,
    isNew: false,
  },
  {
    id: 3,
    author: 'Serena H.',
    authorElo: 390,
    role: 'Hacker',
    title: "Uber but for borrowing your neighbor's stuff",
    description: "Why buy a drill you'll use once? Rent Dave's drill for $2. Dave has 47 drills. Dave has a problem. Dave needs this app.",
    heat: 76,
    upvotes: 189,
    builders: 12,
    tags: ['Marketplace', 'Sustainability'],
    saved: false,
    building: false,
    isNew: false,
  },
  {
    id: 4,
    author: 'Maya K.',
    authorElo: 455,
    role: 'Hacker',
    title: "AI that replies to your landlord so you don't have to",
    description: "Trained on 10,000 passive-aggressive landlord emails. Responds politely, legally, and 40% more effectively than you would while angry.",
    heat: 71,
    upvotes: 156,
    builders: 9,
    tags: ['AI', 'Legal'],
    saved: false,
    building: false,
    isNew: true,
  },
  {
    id: 5,
    author: 'Justin T.',
    authorElo: 520,
    role: 'Builder',
    title: 'Yelp for your coworkers',
    description: '1-5 stars. Leave anonymous reviews. "Greg microwaves fish daily, 1 star." Finally hold people accountable for the thing.',
    heat: 65,
    upvotes: 98,
    builders: 6,
    tags: ['Social', 'Productivity'],
    saved: false,
    building: false,
    isNew: true,
  },
];

const roleColors = {
  Founder: '#16a34a',
  Builder: '#2563eb',
  Hacker: '#9333ea',
};

function IdeaCard({ idea, onUpvote, onToggleSave, onToggleBuild }) {
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
              {idea.author.split(' ').map(n => n[0]).join('')}
            </Avatar>
            <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{idea.author}</Typography>
            <Typography sx={{ fontSize: 12, color: '#9ca3af' }}>{idea.authorElo}</Typography>
            <Chip
              label={idea.role}
              size="small"
              sx={{
                fontSize: 11,
                height: 20,
                bgcolor: `${roleColors[idea.role]}15`,
                color: roleColors[idea.role],
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
            <IconButton size="small" sx={{ p: 0.5 }}>
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
  const [tab, setTab] = useState(0);
  const [ideas, setIdeas] = useState(mockIdeas);

  const totalUpvotes = ideas.reduce((sum, i) => sum + i.upvotes, 0);
  const wantToBuild = ideas.reduce((sum, i) => sum + i.builders, 0);
  const myElo = 340;

  const handleUpvote = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i));
  };
  const handleToggleSave = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
  };
  const handleToggleBuild = (id) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, building: !i.building, builders: i.building ? i.builders - 1 : i.builders + 1 } : i));
  };

  const filteredIdeas = tab === 3
    ? ideas.filter(i => i.saved)
    : tab === 2
    ? ideas.filter(i => i.building)
    : tab === 1
    ? [...ideas].sort((a, b) => b.id - a.id)
    : [...ideas].sort((a, b) => b.heat - a.heat);

  return (
    <Box>
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

      <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
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
          '& .Mui-selected': { color: '#111' },
        }}
      >
        {TABS.map(t => <Tab key={t} label={t} />)}
      </Tabs>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredIdeas.length === 0 ? (
          <Typography sx={{ color: '#9ca3af', textAlign: 'center', py: 6 }}>
            Nothing here yet.
          </Typography>
        ) : (
          filteredIdeas.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onUpvote={handleUpvote}
              onToggleSave={handleToggleSave}
              onToggleBuild={handleToggleBuild}
            />
          ))
        )}
      </Box>
    </Box>
  );
}