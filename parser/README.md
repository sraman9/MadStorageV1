# Storage rate parser

Scrapes **Madison-area commercial self-storage** prices (unit size + monthly rate) from 20+ sites and writes a single JSON file for the backend—so the app can show *"You're saving $X vs local commercial."*

- **Output:** `data/scraped/rates.json` — one array of `{ source, unit_size, price_value, location, sanity_flag, ... }`
- **No API keys or login** — Playwright + BeautifulSoup, config-driven URLs
- **Backend-ready** — normalized sizes, optional `location` per source, `sanity_flag` for bad rows

---

## Quick start

From the **repo root** (where `requirements.txt` lives):

```bash
pip install -r requirements.txt
playwright install chromium
python parser/scripts/run_scraper.py --max-sources 3
python parser/scripts/analyze_rates.py
```

First command installs deps; second installs the browser (required once per machine). The last two run a 3-site test and print stats. For a full run, drop `--max-sources 3`.

---

## Setup (first time on a machine)

| Step | Command |
|------|--------|
| 1. Venv | `python -m venv .venv` then `source .venv/bin/activate` (Windows: `.venv\Scripts\activate`) |
| 2. Deps | `pip install -r requirements.txt` (from repo root) |
| 3. Browser | `playwright install chromium` — **required** or the scraper won't start |

---

## Commands

| What | From repo root | From `parser/` |
|------|----------------|-----------------|
| **Scrape** (writes `parser/data/scraped/rates.json`) | `python parser/scripts/run_scraper.py` | `python scripts/run_scraper.py` |
| **Analyze** (prints stats + best deals) | `python parser/scripts/analyze_rates.py` | `python scripts/analyze_rates.py` |

**Scraper options:** `--size 5x5 --size 10x10` · `-o path/to/rates.json` · `--config config/scraper_urls.yaml` · `--max-sources N` (quick test with first N URLs).

**Analyze option:** `python scripts/analyze_rates.py data/scraped/other_rates.json`

---

## Docs

| Doc | What's in it |
|-----|----------------|
| [**SCRAPER_FOR_BACKEND.md**](docs/SCRAPER_FOR_BACKEND.md) | JSON schema, `sanity_flag` rule, example row for TypeScript |
| [**BACKEND_INTEGRATION.md**](docs/BACKEND_INTEGRATION.md) | Ingest → DB → API → frontend "You're saving $X" (step-by-step) |
| [**FULL_DESCRIPTION.md**](docs/FULL_DESCRIPTION.md) | Purpose, architecture, data model, extending the parser |

---

## Folder layout

```
parser/
├── README.md
├── config/scraper_urls.yaml    # URLs + adapter per source (Madison, Fitchburg, …)
├── data/scraped/               # rates.json (gitignored)
├── docs/                       # SCRAPER_FOR_BACKEND, BACKEND_INTEGRATION, FULL_DESCRIPTION
├── src/scrapers/               # public_storage, uhaul, playwright_generic, generic_static
└── scripts/
    ├── run_scraper.py
    └── analyze_rates.py
```

Dependencies are in the repo root `requirements.txt` (Playwright, BeautifulSoup, PyYAML, etc.).
