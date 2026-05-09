const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Sviber AI, a sharp AI co-pilot embedded in Sviber - a platform where two founders match on an idea and immediately start building it together.

Your personality: concise, energetic, founder-mode. No fluff. Get straight to the point. Use short sentences. You are excited but efficient.`;

// Strips non-ASCII characters so Node.js undici fetch does not throw ByteString errors
function safeStr(s) {
  return String(s || '').replace(/[^\x00-\x7F]/g, '?');
}

// Wraps JSON body as Buffer so undici handles UTF-8 correctly for GitHub API calls
function ghBody(data) {
  return Buffer.from(JSON.stringify(data), 'utf-8');
}

// POST /api/build/chat  — single conversational turn
router.post('/chat', async (req, res) => {
  try {
    const ideaTitle = safeStr(req.body.ideaTitle);
    const phase = req.body.phase;
    const q1Answer = safeStr(req.body.q1Answer);

    let userContent;
    if (phase === 'q1') {
      userContent = `The user and their co-founder matched on the startup idea: "${ideaTitle}". The user answered the first question ("What core problem does this solve?") with: "${q1Answer}".

Now ask your second and final question. Ask about the primary target user - who specifically will use this (consumers, small businesses, or a specific profession/niche). Keep it to one punchy sentence with a question at the end. Don't recap the answer, just acknowledge briefly and ask.`;
    } else if (phase === 'q2') {
      const q2Answer = safeStr(req.body.q2Answer);
      userContent = `The user answered the second question about target users with: "${q2Answer}".

Tell them in 1-2 short sentences that you have everything you need and are generating their app now. Be enthusiastic but brief. End with something like "generating your app now..."`;
    } else {
      return res.status(400).json({ error: 'Invalid phase' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    });

    res.json({ content: response.content[0].text });
  } catch (err) {
    console.error('Build chat error:', err.message);
    res.status(500).json({ error: err.message || 'AI response failed' });
  }
});

function buildPreviewHtml(appCode) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif}</style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel" data-presets="react">
${appCode}
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
  </script>
</body>
</html>`;
}

// POST /api/build/generate  — produces React component + preview HTML
router.post('/generate', async (req, res) => {
  const ideaTitle = safeStr(req.body.ideaTitle);
  const problem = safeStr(req.body.problem);
  const targetUser = safeStr(req.body.targetUser);

  const prompt = `Build a polished, production-quality React application for this startup idea.

Idea: ${ideaTitle}
Core problem: ${problem}
Target user: ${targetUser}

OUTPUT FORMAT — non-negotiable:
- Output ONLY React component code. Zero import statements. Zero export statements.
- React is a global. First line must be: const { useState, useEffect, useRef, useCallback, useMemo } = React;
- Define sub-components as named functions ABOVE App
- Final definition must be: function App() { ... }
- JSX syntax throughout
- Inline style objects only — no CSS classes, no external stylesheets
- All data hardcoded — no fetch calls
- Do NOT write: import, export, ReactDOM, require

LAYOUT — critical:
- App must fill the entire viewport: the root element gets style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background:'#111111' }}
- Use flex or grid for every layout — never rely on document flow or margin stacking to position major sections
- Scrollable regions must be explicit: overflowY:'auto' on a flex child with flex:1 and minHeight:0 (without minHeight:0, flex children don't scroll correctly)
- No content should be cut off or require the user to scroll the whole page — scroll only inside panels/lists
- Think in panels: sidebar + main, or top-nav + content area — use 100% of the space deliberately
- Test mentally: does every column/panel fill its space? Does the app look complete on first load with no blank areas?

DESIGN SYSTEM — match exactly:
- Fonts (pre-loaded via Google Fonts): "DM Mono" for labels/tags/timestamps/metadata/code; "DM Sans" for headings/body/buttons
- bg: #111111 (page), #1E1E1E (cards/panels), #F2F2F2 (light sidebars)
- accent purple: #7C5CFC, accent green: #00E5A0
- text on dark: #fff (primary), rgba(255,255,255,0.5) (muted)
- text on light: #1a1a1a (primary), #888 (muted)
- borders on dark: rgba(255,255,255,0.06); on light: rgba(0,0,0,0.08)
- border-radius: 12px cards/inputs, 999px pills/badges, 8px buttons
- buttons: { background:'#1a1a1a', color:'#fff', borderRadius:8, border:'none', padding:'10px 18px', cursor:'pointer', fontFamily:'"DM Sans",sans-serif', fontWeight:600 }
- primary CTA: background #7C5CFC
- no box shadows, no gradients — flat solid colors only
- padding inside cards/panels: 20–28px; gap between items: 8–12px

QUALITY BAR:
- Realistic, varied demo data (at least 5–8 data items where relevant)
- At least 3 distinct interactive features that demonstrate the product's core loop
- Every interactive element must visually respond (hover states via onMouseEnter/onMouseLeave on style, or active state in useState)
- Empty states handled (show a placeholder when a list is empty)
- The app should look like a real v1 product someone would actually use

Output ONLY the JavaScript/JSX. No markdown, no code fences, no explanation.`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  try {
    let appCode = '';

    const stream = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        appCode += event.delta.text;
        res.write(`data: ${JSON.stringify({ type: 'chunk' })}\n\n`);
      }
    }

    const html = buildPreviewHtml(appCode);
    res.write(`data: ${JSON.stringify({ type: 'done', html, appCode })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Build generate error:', err.message);
    res.write(`data: ${JSON.stringify({ type: 'error', error: err.message || 'App generation failed' })}\n\n`);
    res.end();
  }
});

// POST /api/build/publish  — creates a Vite+React GitHub repo and adds both founders
router.post('/publish', async (req, res) => {
  try {
    const { appCode, ideaTitle, github1, github2 } = req.body;
    const token = process.env.GITHUB_TOKEN;
    if (!token) return res.status(500).json({ error: 'GITHUB_TOKEN not set on server' });

    const slug = ideaTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);
    const repoName = `${slug}-${Date.now().toString(36)}`;

    const ghHeaders = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    // 1. Create repo with auto_init so the git database is ready
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: ghHeaders,
      body: ghBody({
        name: repoName,
        description: `Built with Sviber AI - ${safeStr(ideaTitle)}`,
        private: false,
        auto_init: true,
      }),
    });
    const repo = await createRes.json();
    if (!createRes.ok) throw new Error(repo.message || 'Failed to create repo');
    const owner = repo.owner.login;

    // 2. Get the SHA of the auto-init commit so we can parent off it
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/ref/heads/main`, {
      headers: ghHeaders,
    });
    const refData = await refRes.json();
    const baseSha = refData.object?.sha;
    if (!baseSha) throw new Error('Could not read initial commit SHA');

    // 3. Build the full Vite project file tree
    const appJsx = `import React, { useState, useEffect, useRef, useCallback } from 'react';\n\n${appCode}\n\nexport default App;\n`;

    const files = {
      'package.json': JSON.stringify({
        name: repoName,
        private: true,
        version: '0.0.1',
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        devDependencies: { '@vitejs/plugin-react': '^4.0.0', vite: '^4.4.0' },
      }, null, 2),

      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
    <title>${ideaTitle}</title>
  </head>
  <body style="margin:0">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,

      'vite.config.js': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()] });`,

      'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);`,

      'src/App.jsx': appJsx,

      'README.md': `# ${ideaTitle}\n\nBuilt with [Sviber AI](https://sviber.com).\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`,
    };

    // 4. Create blobs for all files in parallel
    const treeEntries = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const r = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/blobs`, {
          method: 'POST',
          headers: ghHeaders,
          body: ghBody({ content: Buffer.from(content, 'utf-8').toString('base64'), encoding: 'base64' }),
        });
        const b = await r.json();
        if (!r.ok) throw new Error(b.message || `Failed to create blob for ${path}`);
        return { path, sha: b.sha, mode: '100644', type: 'blob' };
      })
    );

    // 5. Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees`, {
      method: 'POST',
      headers: ghHeaders,
      body: ghBody({ tree: treeEntries }),
    });
    const tree = await treeRes.json();
    if (!treeRes.ok) throw new Error(tree.message || 'Failed to create tree');

    // 6. Create commit on top of the auto-init commit
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/commits`, {
      method: 'POST',
      headers: ghHeaders,
      body: ghBody({
        message: 'feat: initial app - generated by Sviber AI',
        tree: tree.sha,
        parents: [baseSha],
      }),
    });
    const commit = await commitRes.json();
    if (!commitRes.ok) throw new Error(commit.message || 'Failed to create commit');

    // 7. Advance main to the new commit
    const updateRefRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/refs/heads/main`, {
      method: 'PATCH',
      headers: ghHeaders,
      body: ghBody({ sha: commit.sha, force: true }),
    });
    if (!updateRefRes.ok) {
      const e = await updateRefRes.json();
      throw new Error(e.message || 'Failed to update branch');
    }

    // 8. Add both founders as collaborators
    for (const username of [github1, github2].filter(Boolean)) {
      await fetch(`https://api.github.com/repos/${owner}/${repoName}/collaborators/${encodeURIComponent(username)}`, {
        method: 'PUT',
        headers: ghHeaders,
        body: ghBody({ permission: 'push' }),
      }).catch(() => {});
    }

    res.json({ repoUrl: repo.html_url });
  } catch (err) {
    console.error('Publish error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
