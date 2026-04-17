# MadStorage - Student Storage Marketplace
<img width="250" height="234" alt="logo" src="https://github.com/user-attachments/assets/6e300b44-0279-4769-aab6-b9be897842cf" />

**[Watch the 5-Minute Demo Video Here](https://www.youtube.com/watch?v=ZFEIIM4YCR4)**

A responsive peer-to-peer storage marketplace connecting students, built initially during the 24-hour MadData '26 Hackathon.

## Inspiration
As a student navigating the friction of finding short-term storage between dorm and apartment leases, I realized there was a gap for an affordable, peer-to-peer storage solution. MadStorage bypasses expensive commercial units by directly connecting students who have extra space with those who need it, scraping local rates to prove real-time savings.

## System Architecture & Technical Decisions
* **UI/UX Design:** Architected the initial user flows, wireframes, and component designs using **Figma**.
* **Frontend UI:** Built a responsive, component-driven architecture from the ground up utilizing **React** and **TypeScript**, leveraging **Tailwind CSS v4** for a scalable design system.
* **Type Safety & Correctness:** Enforced strict TypeScript interfaces across the frontend to ensure reliable state management, predictable data mapping, and zero runtime type errors.
* **Backend Integration:** Managed the integration with **Supabase**, establishing database connections, implementing secure API key management, and configuring environment variables.

## Features
- Desktop-optimized layout with header navigation
- Responsive CSS Grid layout for storage request cards
- Dynamic neighborhood tags
- Budget and Timeframe tags with color coding

## The Data Pipeline (Backend)
To provide real-time value to users, the application includes a data pipeline that fetches commercial storage prices from local Madison-area sites. This allows MadStorage to dynamically display exactly how much money a student is saving compared to local commercial rates. 
*(Note: See `parser/README.md` and `parser/docs/SCRAPER_FOR_BACKEND.md` for specific backend data contracts and JSON schemas).*

## Local Setup

**1. Install dependencies:**
```bash
npm install
```

**2. Environment Variables:**
Create a `.env.local` file in the root directory based on the provided example to connect to the database.
```bash
cp .env.example .env.local
```
*(Note: Replace the placeholder values in `.env.local` with your active Supabase URL and Anon Key before running the server).*

**3. Start the development server:**
```bash
npm run dev
```

**4. Build for production:**
```bash
npm run build
```
