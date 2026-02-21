# Full description: Storage rate parser (DOTData)

This document is the single reference for what the parser does, how it fits the project, how to run and analyze it, and how your friend’s backend can integrate with it.

---

## 1. Purpose and role

The **storage rate parser** is the data pipeline that supplies **real-time commercial storage benchmarks** for the Madison-area P2P storage marketplace. It:

- Visits **20+ commercial self-storage sites** (Public Storage, U-Haul, Extra Space, CubeSmart, StorQuest, and others) across Madison, Fitchburg, Middleton, Verona, and Sun Prairie.
- Extracts **unit size** (e.g. 5×5, 10×10) and **monthly price** from each facility’s listing page.
- Writes a **single JSON file** (`data/scraped/rates.json`) with normalized, sanity-checked rows.

The backend uses this file to power the **“You’re saving $X”** comparison: e.g. *“Local 5×5 commercial average in Madison is $Y; you’re listing at $Z, so storer saves $X.”* No login or API keys are required; the parser uses browser automation (Playwright) and static HTML parsing (BeautifulSoup) with config-driven URLs.

---

## 2. Architecture

**Config-driven, adapter-based:**

- **Configuration:** All sources are defined in `config/scraper_urls.yaml`. Each entry has:
  - `name` (e.g. `uhaul_madison`, `cubesmart_fitchburg`)
  - `url` (facility or location page)
  - `adapter` (which scraper implementation to use)
  - optional `location` (e.g. `"Madison"`, `"Fitchburg"`) for backend geography
  - optional `target_sizes` (e.g. `["5x5","10x10"]`) to filter what is kept

- **Registry:** Adapters are registered by name in `src/scrapers/registry.py`. The runner loads the config, looks up the adapter per source, and calls `scraper.scrape(url, source_name=name)`.

- **Adapters:**
  - **`public_storage`** — Playwright; tuned for Public Storage DOM (cards, data-testid/class selectors + body-text fallback).
  - **`uhaul`** — Playwright; tuned for U-Haul unit cards + same-line size/price fallback.
  - **`playwright_generic`** — Playwright; portable. Uses container-based extraction (elements that contain both “N×N” and “$”), iframe support, and body-text fallback. Used for Extra Space, CubeSmart, StorQuest, and most other JS-heavy sites.
  - **`generic_static`** — BeautifulSoup; for static HTML. Optional per-URL selectors or heuristic same-line size+price.

- **Pipeline:**  
  `run_scraper.py` loads YAML → for each source, gets scraper by adapter → runs `scrape(url, source_name=name)` → collects `StorageListing` objects → normalizes `unit_size` to canonical form and adds `standard_size` → builds a row dict (source, unit_size, standard_size, price, price_value, url, location?, sanity_flag) → runs sanity check (5×5 vs 10×10) → writes one JSON array to disk.

---

## 3. Data model and normalization

- **In-memory (scrapers):** Each scraper yields `StorageListing(source, unit_size, price, price_value, url)`. `unit_size` can be raw site text (e.g. `"5' x 5'"`, `"Small Locker"`).

- **Normalization (in run_scraper):** Before appending to results, `normalize_storage_unit_size(unit_size)` is called. It returns:
  - **Canonical `unit_size`:** e.g. `"5x5"`, `"10x10"`, `"5x10"`, `"10x15"`. Regex extracts dimensions; aliases like “Small”, “Locker”, “Closet” map to `"5x5"`, etc.
  - **`standard_size`:** `"small"` | `"medium"` | `"large"` for grouping (e.g. 5×5 → small, 10×10 → medium). The backend can use this without fuzzy matching.

- **Sanity check:** After all sources are scraped, `apply_sanity_check_inverted_price(results)` runs. For each source, if a 5×5 price is higher than the max 10×10 price, that 5×5 row gets `sanity_flag: "inverted_price"`. Those rows stay in the JSON for debugging but must not be used for user-facing “saving $X” or averages.

---

## 4. Output: rates.json

- **Path:** `data/scraped/rates.json` (or path given by `-o`).
- **Format:** JSON array of objects. Every object has the same fields; `location` is optional (present when set in config).

| Field           | Type    | Description |
|----------------|---------|-------------|
| `source`       | string  | Config entry name (e.g. `uhaul_madison`, `public_storage_madison`). |
| `unit_size`    | string  | Canonical size: `"5x5"`, `"10x10"`, `"5x10"`, etc. |
| `standard_size`| string  | `"small"` \| `"medium"` \| `"large"` for grouping. |
| `price`        | string  | Display string (e.g. `"$44.95/mo"`). |
| `price_value`  | number  | Numeric monthly price for comparisons. |
| `url`          | string  | Source facility/location URL. |
| `location`     | string? | City/area from config (e.g. `"Madison"`, `"Fitchburg"`). |
| `sanity_flag`  | string? | `null` or `"inverted_price"`. If not null, do not show to user. |

Example row:

```json
{
  "source": "uhaul_madison",
  "unit_size": "5x5",
  "standard_size": "small",
  "price": "$44.95/mo",
  "price_value": 44.95,
  "url": "https://www.uhaul.com/Locations/Self-Storage-near-Madison-WI-53704/",
  "location": "Madison",
  "sanity_flag": null
}
```

Full schema and a second example (flagged row) are in `docs/SCRAPER_FOR_BACKEND.md`.

---

## 5. Backend integration

Integration is **file-based and contract-first**: the backend does not depend on this repo’s internals.

1. **Ingest:** Read `data/scraped/rates.json` (or the path from `-o`) and upsert into a `market_prices` (or equivalent) table. The backend can run `python scripts/run_scraper.py` itself (e.g. from cron) or read the file after someone else runs it.

2. **User-facing logic:** For “You’re saving $X” and any displayed averages, **exclude** rows where `sanity_flag` is not null. Example:
   ```sql
   SELECT AVG(price_value) FROM market_prices
   WHERE location = 'Madison' AND unit_size = '5x5' AND (sanity_flag IS NULL OR sanity_flag = '');
   ```
   Flagged rows should still be stored for debugging.

3. **Geography:** Use `location` so “local commercial rate” matches the listing’s market (Madison, Fitchburg, Middleton, Verona, Sun Prairie).

4. **Types:** The backend can generate a TypeScript/Go/etc. interface from the JSON examples in `docs/SCRAPER_FOR_BACKEND.md`.

5. **Extending coverage:** When new URLs or locations are added in `scraper_urls.yaml`, only the JSON content changes; no backend code changes are required.

---

## 6. Commands: setup, run, analyze

**One-time setup (per machine):** From repo root (DOTData/): `pip install -r requirements.txt`, `playwright install chromium`.

**Run the parser (from repo root):**

```bash
python parser/scripts/run_scraper.py
```

Or from inside `parser/`: `python scripts/run_scraper.py`.

- Default output: `parser/data/scraped/rates.json`.
- Restrict sizes: `--size 5x5 --size 10x10`
- Custom output: `-o /path/to/rates.json`
- Quick test: `--max-sources 3`

**Analyze (from repo root):**

```bash
python parser/scripts/analyze_rates.py
```

- Default input: `parser/data/scraped/rates.json`.
- Other file: `python parser/scripts/analyze_rates.py parser/data/scraped/other_rates.json`

---

## 7. Project layout (parser folder)

```
parser/
├── README.md
├── config/scraper_urls.yaml
├── data/scraped/rates.json   # Output (or path from -o)
├── docs/
│   ├── SCRAPER_FOR_BACKEND.md
│   └── FULL_DESCRIPTION.md   # This file
├── src/scrapers/             # base, registry, utils, playwright_scraper, beautifulsoup_scraper
└── scripts/
    ├── run_scraper.py
    └── analyze_rates.py
```

Repo root holds `requirements.txt` and (optional) `.venv`.

---

## 8. Extending the parser

- **New URL, same adapter:** Add an entry under `sources` in `config/scraper_urls.yaml` with `name`, `url`, `adapter`, and optional `location` and `target_sizes`.
- **New site, custom logic:** Implement a class that extends `BaseStorageScraper`, implement `scrape(url, **kwargs)` to yield `StorageListing` objects, and register it with `@register("adapter_name")` in the scraper module; add that module to `_load_adapters()` in `registry.py`. Then add YAML entries that use the new `adapter` name.

This is the **full description** of the storage rate parser: purpose, architecture, data model, output schema, backend integration, commands, and how to extend it.
