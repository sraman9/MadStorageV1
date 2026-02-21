# Scraper contract for backend/frontend

This doc describes the scraper output so your backend can ingest it without changing scraper code.

---

## Output file

- **Path:** `parser/data/scraped/rates.json` (or path from `-o`)
- **How it’s produced:** Run `python scripts/run_scraper.py` (or call it from your backend/cron). No API inside the scraper repo—backend reads the file or runs the script.

---

## Sanity flag (important)

Scrapers can be brittle; sites may change their HTML mid-hackathon.

**Rule for backend:** If `sanity_flag` is **not** `null`, **do not show this specific price to the user** (e.g. do not use it for “You’re saving $X” or for displayed averages). **Still store the row in the DB** for debugging. When `sanity_flag` is `"inverted_price"`, it means 5×5 was higher than 10×10 at that source (likely a scrape/parsing quirk).

---

## JSON schema (market prices)

Each item in the `rates.json` array has this shape:

| Field           | Type    | Description |
|----------------|---------|-------------|
| `source`       | string  | Scraper/source name (e.g. `uhaul_madison`, `public_storage_madison`). |
| `unit_size`    | string  | Canonical size: `"5x5"`, `"10x10"`, `"5x10"`, etc. (normalized from site text). |
| `standard_size`| string  | Tier for grouping: `"small"` \| `"medium"` \| `"large"` (e.g. 5×5 → small, 10×10 → medium). |
| `price`        | string  | Display string (e.g. `"$44.95/mo"`). |
| `price_value`  | number  | Numeric monthly price for comparisons and “saving $X”. |
| `url`          | string  | Source URL. |
| `location`     | string? | **Optional.** City or zip from config (e.g. `"Madison"`). Use for same-market comparison. |
| `sanity_flag`  | string? | `null` or `"inverted_price"`. If not null, **do not show to user**; store for debugging only. |

---

## Example (for TypeScript interface)

Use this to generate your interface and types:

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

Example with a flagged row (do not use for user-facing “saving $X” or displayed averages):

```json
{
  "source": "fitchburg_self_storage",
  "unit_size": "5x5",
  "standard_size": "small",
  "price": "$250/mo",
  "price_value": 250,
  "url": "https://www.fitchburgselfstorage.com/",
  "location": "Fitchburg",
  "sanity_flag": "inverted_price"
}
```

---

## How to use it in the backend

1. **Ingest:** After the scraper runs, read `data/scraped/rates.json` and upsert into your `market_prices` (or equivalent) table.
2. **User-facing queries:** Filter out rows where `sanity_flag !== null`. Example for “You’re saving $X”:
   ```sql
   SELECT AVG(price_value) FROM market_prices
   WHERE location = 'Madison' AND unit_size = '5x5' AND (sanity_flag IS NULL OR sanity_flag = '');
   ```
3. **Geography:** Filter by `location` so “local commercial rate” matches the student listing’s city/zip.
4. **standard_size:** Use `standard_size` (`"small"` / `"medium"` / `"large"`) to group or match listings without fuzzy matching—the scraper normalizes “Small”, “5' x 5'”, “Locker”, “Closet” to `unit_size` + `standard_size`.

---

## Madison coverage

The scraper is configured for the Madison area. Each source in `config/scraper_urls.yaml` can set `location` (e.g. `"Madison"`, `"Fitchburg"`, `"Middleton"`). You can scale by neighborhood by adding more sources with different `location` values; the JSON schema does not change.

---

## Running the scraper

**Required:** Install Playwright’s Chromium once per environment, or the scraper will fail to launch:

```bash
playwright install chromium
```

Full run (from repo root):

```bash
cd /path/to/DOTData
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium
python parser/scripts/run_scraper.py
```

- **Optional:** `--size 5x5 --size 10x10` to restrict sizes; `-o path/to/rates.json` to write elsewhere.

---

## Config (for the person maintaining the scraper)

- **Config file:** `config/scraper_urls.yaml`
- **Adding a location:** In each source entry, add `location: "Madison"` (or a zip/neighborhood) so the output includes `location` and the backend can filter by market.
- **Adding new URLs:** Add a new entry under `sources` with `name`, `url`, `adapter` (`public_storage`, `uhaul`, or `playwright_generic`), and optional `location` and `target_sizes`.

No backend/frontend code changes required when new sources or locations are added—only the JSON content changes.
