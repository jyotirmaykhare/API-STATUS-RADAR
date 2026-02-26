/**
 * StatusRadar — apis.js
 * ─────────────────────────────────────────────────────────────
 * Defines all monitored APIs and their realistic mock profiles.
 * Mock profiles simulate each API's real-world latency personality
 * so the dashboard always shows meaningful data even if live
 * fetch fails (CORS, network, rate-limit etc.)
 *
 * Fields:
 *   id       — unique identifier (used as DOM id suffix)
 *   name     — display name
 *   emoji    — icon shown on card
 *   cat      — category label
 *   desc     — short description shown on card
 *   url      — Atlassian Statuspage v2 JSON endpoint
 *   hp       — official status page homepage
 */

'use strict';

/* ── API List ───────────────────────────────────────────────── */
const APIS = [
  // ── AI / LLM ──────────────────────────────────────────────
  {
    id: 'openai',
    name: 'OpenAI',
    emoji: '🤖',
    cat: 'AI / LLM',
    desc: 'GPT-4, DALL-E, Whisper & API services',
    url: 'https://status.openai.com/api/v2/status.json',
    hp:  'https://status.openai.com',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    emoji: '🧠',
    cat: 'AI / LLM',
    desc: 'Claude API & claude.ai services',
    url: 'https://status.anthropic.com/api/v2/status.json',
    hp:  'https://status.anthropic.com',
  },
  {
    id: 'groq',
    name: 'Groq',
    emoji: '⚡',
    cat: 'AI / LLM',
    desc: 'Ultra-fast LLM inference API',
    url: 'https://groqstatus.com/api/v2/status.json',
    hp:  'https://groqstatus.com',
  },
  {
    id: 'hf',
    name: 'Hugging Face',
    emoji: '🤗',
    cat: 'AI / LLM',
    desc: 'Model hub & Inference API',
    url: 'https://status.huggingface.co/api/v2/status.json',
    hp:  'https://status.huggingface.co',
  },

  // ── Dev Tools ─────────────────────────────────────────────
  {
    id: 'github',
    name: 'GitHub',
    emoji: '🐙',
    cat: 'Dev Tools',
    desc: 'Git hosting, Actions & Packages',
    url: 'https://www.githubstatus.com/api/v2/status.json',
    hp:  'https://githubstatus.com',
  },
  {
    id: 'npm',
    name: 'npm Registry',
    emoji: '📦',
    cat: 'Dev Tools',
    desc: 'Node.js package registry',
    url: 'https://status.npmjs.org/api/v2/status.json',
    hp:  'https://status.npmjs.org',
  },
  {
    id: 'docker',
    name: 'Docker Hub',
    emoji: '🐳',
    cat: 'Dev Tools',
    desc: 'Container registry & image hosting',
    url: 'https://www.dockerstatus.com/api/v2/status.json',
    hp:  'https://www.dockerstatus.com',
  },
  {
    id: 'atlassian',
    name: 'Atlassian',
    emoji: '🔷',
    cat: 'Dev Tools',
    desc: 'Jira, Confluence & Bitbucket cloud',
    url: 'https://jira-software.status.atlassian.com/api/v2/status.json',
    hp:  'https://status.atlassian.com',
  },
  {
    id: 'linear',
    name: 'Linear',
    emoji: '📐',
    cat: 'Dev Tools',
    desc: 'Issue tracking for modern teams',
    url: 'https://linearstatus.com/api/v2/status.json',
    hp:  'https://linearstatus.com',
  },

  // ── Hosting ───────────────────────────────────────────────
  {
    id: 'vercel',
    name: 'Vercel',
    emoji: '▲',
    cat: 'Hosting',
    desc: 'Edge deployments, Functions & CDN',
    url: 'https://www.vercel-status.com/api/v2/status.json',
    hp:  'https://vercel-status.com',
  },
  {
    id: 'netlify',
    name: 'Netlify',
    emoji: '🌿',
    cat: 'Hosting',
    desc: 'JAMstack hosting & CDN',
    url: 'https://www.netlifystatus.com/api/v2/status.json',
    hp:  'https://www.netlifystatus.com',
  },
  {
    id: 'railway',
    name: 'Railway',
    emoji: '🚂',
    cat: 'Hosting',
    desc: 'App deployments & managed databases',
    url: 'https://status.railway.app/api/v2/status.json',
    hp:  'https://status.railway.app',
  },

  // ── CDN / Edge ────────────────────────────────────────────
  {
    id: 'cf',
    name: 'Cloudflare',
    emoji: '☁️',
    cat: 'CDN / Edge',
    desc: 'CDN, Workers, DNS & security',
    url: 'https://www.cloudflarestatus.com/api/v2/status.json',
    hp:  'https://www.cloudflarestatus.com',
  },

  // ── Backend / DB ──────────────────────────────────────────
  {
    id: 'supabase',
    name: 'Supabase',
    emoji: '🔋',
    cat: 'Backend / DB',
    desc: 'Postgres, Auth, Storage & Realtime',
    url: 'https://status.supabase.com/api/v2/status.json',
    hp:  'https://status.supabase.com',
  },
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    emoji: '🍃',
    cat: 'Backend / DB',
    desc: 'Cloud database services',
    url: 'https://status.mongodb.com/api/v2/status.json',
    hp:  'https://status.mongodb.com',
  },

  // ── Cloud ─────────────────────────────────────────────────
  {
    id: 'do',
    name: 'DigitalOcean',
    emoji: '🌊',
    cat: 'Cloud',
    desc: 'Droplets, App Platform & Managed DBs',
    url: 'https://status.digitalocean.com/api/v2/status.json',
    hp:  'https://status.digitalocean.com',
  },

  // ── Payments ──────────────────────────────────────────────
  {
    id: 'stripe',
    name: 'Stripe',
    emoji: '💳',
    cat: 'Payments',
    desc: 'Payment processing & billing API',
    url: 'https://status.stripe.com/api/v2/status.json',
    hp:  'https://status.stripe.com',
  },

  // ── Communication ─────────────────────────────────────────
  {
    id: 'twilio',
    name: 'Twilio',
    emoji: '📱',
    cat: 'Communication',
    desc: 'SMS, Voice, Video & email APIs',
    url: 'https://status.twilio.com/api/v2/status.json',
    hp:  'https://status.twilio.com',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    emoji: '📧',
    cat: 'Communication',
    desc: 'Transactional & marketing email API',
    url: 'https://status.sendgrid.com/api/v2/status.json',
    hp:  'https://status.sendgrid.com',
  },

  // ── Design ────────────────────────────────────────────────
  {
    id: 'figma',
    name: 'Figma',
    emoji: '🎨',
    cat: 'Design',
    desc: 'Collaborative design & prototyping',
    url: 'https://status.figma.com/api/v2/status.json',
    hp:  'https://status.figma.com',
  },
];

/* ── Mock Profiles ──────────────────────────────────────────────
   Used as fallback when live fetch fails.
   base     = typical latency in ms
   variance = how much it fluctuates (±)
   upProb   = probability of being operational (0–1)
────────────────────────────────────────────────────────────── */
const MOCK_PROFILE = {
  openai:    { base: 180, variance: 120, upProb: 0.92 },
  anthropic: { base: 150, variance:  80, upProb: 0.97 },
  groq:      { base:  80, variance:  60, upProb: 0.96 },
  hf:        { base: 220, variance: 150, upProb: 0.90 },
  github:    { base:  90, variance:  60, upProb: 0.97 },
  npm:       { base:  90, variance:  70, upProb: 0.94 },
  docker:    { base: 160, variance: 100, upProb: 0.93 },
  atlassian: { base: 200, variance: 120, upProb: 0.92 },
  linear:    { base: 110, variance:  60, upProb: 0.97 },
  vercel:    { base:  70, variance:  50, upProb: 0.98 },
  netlify:   { base: 110, variance:  70, upProb: 0.96 },
  railway:   { base: 140, variance:  90, upProb: 0.93 },
  cf:        { base:  55, variance:  35, upProb: 0.99 },
  supabase:  { base: 130, variance:  80, upProb: 0.95 },
  mongodb:   { base: 160, variance: 100, upProb: 0.94 },
  do:        { base: 120, variance:  70, upProb: 0.96 },
  stripe:    { base: 100, variance:  60, upProb: 0.98 },
  twilio:    { base: 170, variance: 100, upProb: 0.95 },
  sendgrid:  { base: 200, variance: 120, upProb: 0.93 },
  figma:     { base: 140, variance:  80, upProb: 0.95 },
};
