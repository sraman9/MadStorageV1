# MadStorage - Student Storage Marketplace

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
