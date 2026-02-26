# StatusRadar 🛰️
### Real-time API Health Monitor

> Monitor 20+ developer APIs live — built with vanilla HTML, CSS & JS. No framework, no backend, no login.

---

## 📁 File Structure

```
StatusRadar/
├── index.html   — Markup only. Clean semantic HTML.
├── style.css    — All styles. Design tokens, layout, animations, responsive.
├── apis.js      — API definitions + mock latency profiles. Load BEFORE app.js.
├── app.js       — All logic: fetch, render, filter, sort, search, countdown.
└── README.md    — This file.
```

---

## 🚀 How to Run

**Locally:**
```bash
# Simplest — just open in browser
open index.html

# Or serve with any static server
npx serve .
python -m http.server 3000
```

**Deploy (free, instant):**
- Drag the folder into [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
- Share the live URL

---

## ⚙️ How It Works

### Fetch Strategy (3-layer, no backend needed)
1. **Try `corsproxy.io`** — primary CORS proxy
2. **Try `allorigins.win`** — secondary fallback proxy
3. **Realistic mock data** — if both fail, uses per-API latency profiles so the dashboard always shows meaningful data

### API Format
All 20 APIs use the **Atlassian Statuspage v2 JSON** format:
```
GET https://status.{service}.com/api/v2/status.json

Response:
{
  "status": {
    "indicator": "none" | "minor" | "major" | "critical" | "maintenance",
    "description": "All Systems Operational"
  }
}
```
- `none` → Operational 🟢
- `minor` / `maintenance` → Degraded 🟡
- `major` / `critical` → Down 🔴

---

## ✨ Features

| Feature | Description |
|---|---|
| **Live fetch** | Hits real status endpoints via CORS proxy |
| **Mock fallback** | Realistic per-API simulation if fetch fails |
| **Auto-refresh** | Every 30 seconds with live countdown |
| **Manual refresh** | Click "Refresh Now" anytime |
| **Per-card Ping** | Re-check a single API instantly |
| **Click to expand** | See full status message, timestamps, category |
| **Search** | Filter by name or category |
| **Filter** | All / Up / Slow / Down |
| **Sort** | Default / A–Z / Latency / Status |
| **Sparkline history** | Last 12 checks visualized per card |
| **Live ticker** | Scrolling banner showing current status |
| **Toast notifications** | Feedback after every refresh |
| **Live clock** | Real-time date & time in header |
| **Fully responsive** | Works on mobile |
| **Keyboard accessible** | Tab + Enter to expand cards |

---

## 🎨 Design

- **Theme:** Warm Editorial Newsroom
- **Palette:** Cream · Charcoal · Amber · Brick Red · Sage Green
- **Display font:** [Bebas Neue](https://fonts.google.com/specimen/Bebas+Neue)
- **Body font:** [DM Sans](https://fonts.google.com/specimen/DM+Sans)
- **Mono font:** [JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)

---

## 📡 Monitored APIs

| Service | Category |
|---|---|
| OpenAI | AI / LLM |
| Anthropic | AI / LLM |
| Groq | AI / LLM |
| Hugging Face | AI / LLM |
| GitHub | Dev Tools |
| npm Registry | Dev Tools |
| Docker Hub | Dev Tools |
| Atlassian | Dev Tools |
| Linear | Dev Tools |
| Vercel | Hosting |
| Netlify | Hosting |
| Railway | Hosting |
| Cloudflare | CDN / Edge |
| Supabase | Backend / DB |
| MongoDB Atlas | Backend / DB |
| DigitalOcean | Cloud |
| Stripe | Payments |
| Twilio | Communication |
| SendGrid | Communication |
| Figma | Design |

---

## 🔧 Adding More APIs

Open `apis.js` and add an entry to the `APIS` array:
```js
{
  id:    'myservice',           // unique, lowercase, no spaces
  name:  'My Service',
  emoji: '🔧',
  cat:   'Category',
  desc:  'Short description shown on card',
  url:   'https://status.myservice.com/api/v2/status.json',
  hp:    'https://status.myservice.com',
},
```
Then add a mock profile in `MOCK_PROFILE`:
```js
myservice: { base: 120, variance: 80, upProb: 0.95 },
```

---

**Built by Jyotirmay Khare · StatusRadar © 2025**
