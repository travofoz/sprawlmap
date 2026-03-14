# Sprawlmap 🗺
**Public land finder — Columbus, OH. Humanitarian field tool.**

Identifies city-owned, land bank, and public parcels. Overlays resources (bus, laundry, water, power, mental health, food, shelters). Natural language AI queries via any provider.

No backend. No required API keys. Free to deploy.

## Quick deploy
```bash
gh repo create sprawlmap --public --push --source=.
# Repo → Settings → Pages → main / root
# Live at https://travofoz.github.io/sprawlmap
```

## Local (Termux)
```bash
python -m http.server 8000
# open http://localhost:8000 in Chrome
```

## Files
| File | Purpose |
|------|---------|
| `index.html` | Map UI — standalone, no build step |
| `api.js` | Query engine — importable ES module |
| `providers.js` | Multi-LLM adapter |
| `tools.json` | OpenAI-compatible tool schema for agents |
| `scripts/fetch_parcels.js` | Nightly data refresh (Node 18+) |
| `.github/workflows/refresh.yml` | GH Action cron |

## AI providers supported
Anthropic, OpenAI, xAI Grok, OpenRouter (incl. GLM), Cloudflare AI, self-hosted proxy.
**Free fallback**: OpenRouter Llama 3 8B — no key needed.

## LLM agent usage
Point any tool-calling LLM at `tools.json`. Works with opencode + GLM out of the box.
Import `dispatch()` from `api.js` to handle tool call responses.

## Risk levels
| Color | LUC | Meaning |
|-------|-----|---------|
| 🟢 LOW | 640, 605 | City of Columbus / Land Bank. CPD trespass auth required, rarely filed. |
| 🟡 MED | 600–699 other | Other public entities. Verify before use. |
| 🔴 HIGH | All others | Private. Avoid. |

## Data sources
- Franklin County Auditor GIS — nightly refresh
- OpenStreetMap Overpass — realtime
- Nominatim — free geocoding

*Built for people who need it.*
