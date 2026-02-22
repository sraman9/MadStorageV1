# MadStorage - Student Storage Marketplace
<img width="250" height="234" alt="logo" src="https://github.com/user-attachments/assets/6e300b44-0279-4769-aab6-b9be897842cf" />

A responsive desktop/web React application for connecting students with storage solutions.

## Features

- Desktop-optimized layout with header navigation
- Responsive CSS Grid layout for storage request cards
- Dynamic neighborhood tags
- Budget and Timeframe tags with color coding
- Built with React, TypeScript, Vite, and Tailwind CSS v4

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Customization

- **App Name**: Change "MadStorage" in `src/App.tsx` (line 53) to your desired app name
- **Primary Color**: The primary red color `#C5050C` is configured in `src/index.css` via the `@theme` block
- **Font**: Inter font is loaded from Google Fonts in `index.html`

## Project Structure

- `src/App.tsx` - Main application component with desktop header and grid layout
- `src/components/StorageRequestCard.tsx` - Individual storage request card component
- `src/index.css` - Global styles with Tailwind CSS v4 configuration
- `src/main.tsx` - Application entry point

---

## Storage rate parser (data pipeline)

The **parser** fetches commercial storage prices (unit size + monthly rate) from Madison-area sites so the app can show "You're saving $X" vs local rates.

- **Docs and commands:** See **[parser/README.md](parser/README.md)** for setup, run, and analyze.
- **Backend contract:** See **parser/docs/SCRAPER_FOR_BACKEND.md** for JSON schema and how to ingest.

**Quick run (from repo root):**

```bash
pip install -r requirements.txt
playwright install chromium
python parser/scripts/run_scraper.py --max-sources 3
python parser/scripts/analyze_rates.py
```

Repo layout: `parser/` contains the scraper (config, scripts, docs); app code lives in the repo root or its usual locations.
