import { Box, Typography, Card, CardContent, Avatar, Chip, Container } from '@mui/material';
import {
  ArrowDropUp as ArrowDropUpIcon,
  Build as BuildIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';

const ideas = [
  {
    name: 'Priya M',
    initials: 'PM',
    avatarColor: '#c4b5fd',
    tier: 'Founder',
    elo: 1847,
    heat: 87,
    title: 'Spotify for sleep',
    pitch: 'AI-generated soundscapes that learn your sleep cycle and adapt in real-time based on heart rate from wearables.',
    tags: ['Consumer', 'Health', 'AI'],
    upvotes: 342,
    builders: 14,
  },
  {
    name: 'James K',
    initials: 'JK',
    avatarColor: '#93c5fd',
    tier: 'Builder',
    elo: 1612,
    heat: 64,
    title: 'Linear for scientists',
    pitch: 'Issue tracking + experiment management for wet labs. Replace the mess of spreadsheets + slack + Notion.',
    tags: ['B2B', 'Science', 'Tools'],
    upvotes: 201,
    builders: 8,
  },
  {
    name: 'Ravi N',
    initials: 'RN',
    avatarColor: '#fca5a5',
    tier: 'Unicorn',
    elo: 2104,
    heat: 96,
    title: 'Auto-apply to jobs',
    pitch: "Agent that reads your resume, finds matches, writes custom cover letters, and applies — while you sleep.",
    tags: ['Consumer', 'AI', 'Jobs'],
    upvotes: 584,
    builders: 23,
  },
];

export default function CommunityFeed() {
  return (
    <Box sx={{ py: { xs: 8, md: 12 }, backgroundColor: '#fdf5ef' }}>
      <Container maxWidth="lg">
        <Typography
          variant="overline"
          sx={{ color: '#6b7280', fontWeight: 700, letterSpacing: 2, mb: 1, display: 'block' }}
        >
          COMMUNITY FEED
        </Typography>
        <Typography variant="h2" sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, mb: 2 }}>
          Half-baked ideas. Real builders.
        </Typography>
        <Typography sx={{ color: '#6b7280', fontSize: '1.05rem', mb: 6, maxWidth: 520, textDecoration: 'underline', textDecorationColor: '#d1d5db' }}>
          Post a vibe-coded idea. The crowd rates it. Someone wants to build it. Watch it get stolen — or go build it yourself.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {ideas.map((idea) => (
            <Card
              key={idea.title}
              sx={{
                flex: 1,
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ backgroundColor: idea.avatarColor, width: 40, height: 40, fontSize: '0.85rem', fontWeight: 700, color: '#1a1a1a' }}>
                      {idea.initials}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {idea.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6b7280' }}>
                        {idea.tier} · {idea.elo} ELO
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: '#fef2f2',
                      borderRadius: 10,
                      px: 1.5,
                      py: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.7rem' }}>🔥</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626' }}>
                      {idea.heat}
                    </Typography>
                  </Box>
                </Box>

                {/* Content */}
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1.1rem' }}>
                  {idea.title}
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280', lineHeight: 1.6, mb: 2.5, flexGrow: 1 }}>
                  {idea.pitch}
                </Typography>

                {/* Tags */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
                  {idea.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: '#e5e7eb', color: '#6b7280', fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>

                {/* Footer */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ArrowDropUpIcon sx={{ color: '#1a1a1a', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {idea.upvotes}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BuildIcon sx={{ color: '#6b7280', fontSize: 16 }} />
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {idea.builders} want to build
                      </Typography>
                    </Box>
                  </Box>
                  <StarBorderIcon sx={{ color: '#9ca3af', fontSize: 20, cursor: 'pointer' }} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
