# Storage rate parser

This folder contains the **storage rate scraper** that fetches commercial self-storage prices (unit size + monthly rate) from Madison-area sites and writes `data/scraped/rates.json` for the backend.

**Full description:** [docs/FULL_DESCRIPTION.md](docs/FULL_DESCRIPTION.md) — purpose, architecture, output schema, backend integration, extending.

**Backend contract:** [docs/SCRAPER_FOR_BACKEND.md](docs/SCRAPER_FOR_BACKEND.md) — JSON schema, `sanity_flag` rule, example row for TypeScript.

---

## Setup (once per machine)

From the **repo root** (DOTData/):

```bash
cd /path/to/DOTData
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium   # required; scraper won't launch without it
```

---

## Run and analyze

From **repo root**:

```bash
python parser/scripts/run_scraper.py
python parser/scripts/analyze_rates.py
```

Or from **inside parser/**:

```bash
cd parser
python scripts/run_scraper.py
python scripts/analyze_rates.py
```

- **Run:** Writes `parser/data/scraped/rates.json` by default.  
  Options: `--size 5x5 --size 10x10` · `-o path/to/rates.json` · `--config config/scraper_urls.yaml` · `--max-sources 3` (quick test).
- **Analyze:** Reads `parser/data/scraped/rates.json` by default.  
  Option: `python scripts/analyze_rates.py data/scraped/other_rates.json`

Quick test (first 3 sources only):

```bash
python parser/scripts/run_scraper.py --max-sources 3
python parser/scripts/analyze_rates.py
```

---

## Layout

```
parser/
├── README.md           # This file
├── config/
│   └── scraper_urls.yaml
├── data/
│   └── scraped/       # rates.json (gitignored)
├── docs/
│   ├── SCRAPER_FOR_BACKEND.md
│   └── FULL_DESCRIPTION.md
├── src/
│   └── scrapers/      # adapters: public_storage, uhaul, playwright_generic, generic_static
└── scripts/
    ├── run_scraper.py
    └── analyze_rates.py
```

Dependencies (Playwright, BeautifulSoup, PyYAML, etc.) are in the repo root `requirements.txt`.
