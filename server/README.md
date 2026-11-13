# Proxy Server

This server hides your API key and forwards requests to Gemini. Requires Node.js 18+.

**Run**
```bash
node server/server.js
```

**Environment**
- `API_KEY` (required)
- `MODEL` (optional, default: `gemini-2.5-flash`)
- `VISION_MODEL` (optional, default: `MODEL` or `gemini-2.5-flash`)
- `PORT` (optional, default: `8787`)
- `RATE_LIMIT_MAX` (optional, default: `60` per window)
- `RATE_LIMIT_WINDOW_MS` (optional, default: `60000`)
- `MODEL_LIST_TTL_MS` (optional, default: `43200000` / 12 hours)

**Endpoints**
- `POST /api/gemini?model=...` → `v1beta/models/{model}:generateContent`
- `POST /api/gemini/vision?model=...` → `v1beta/models/{model}:generateContent`
- `GET /api/models` → `v1beta/models` (cached)
