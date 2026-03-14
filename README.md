# Sprawlmap 🗺
Public land finder for Columbus, OH. Humanitarian field tool.

Identifies city-owned, land bank, and other public parcels. Overlays nearby resources (bus, laundry, water, power, mental health, food). Natural language AI queries via any LLM provider.

No backend. No required API keys. Free to deploy.

## Deploy
```bash
gh repo create sprawlmap --public --push --source=.
# then: repo Settings → Pages → main / root
```

Live at `https://travofoz.github.io/sprawlmap`

## Files
- `index.html` — map UI, works standalone
- `api.js` — query engine, importable
- `providers.js` — multi-LLM adapter (Anthropic, OpenAI, xAI, OpenRouter, Cloudflare)
- `tools.json` — OpenAI-compatible tool schema for LLM agents
- `scripts/fetch_parcels.js` — nightly data refresh (Node 18+)
- `.github/workflows/refresh.yml` — GH Action cron

## LLM integration
Point any tool-calling LLM at `tools.json`. Works with opencode + GLM, GPT-4, Claude, Grok.
Free fallback: OpenRouter Llama 3 8B, no API key needed.

## Risk levels
- 🟢 LUC 640/605 — City of Columbus / Land Bank. CPD trespass auth required, rarely filed.
- 🟡 LUC 600-699 other — Other public entities. Verify.
- 🔴 Everything else — Private. Avoid.

## Data sources
- Franklin County Auditor GIS (nightly)
- OpenStreetMap Overpass API (realtime)
- Nominatim geocoding (free)

*Built for people who need it.*
