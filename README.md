# MadStorage - Student Storage Marketplace
<img width="250" height="234" alt="logo" src="https://github.com/user-attachments/assets/6e300b44-0279-4769-aab6-b9be897842cf" />

A responsive desktop/web React application for connecting students with storage solutions, built initially at the MadData26 Hackathon.

## Inspiration
As a student who had to navigate the friction of finding short-term storage between moving from dorms to an apartment, I realized there was a massive gap in the market for an affordable, peer-to-peer storage solution. I wanted to build a platform that bypassed expensive commercial units and "cookie-cutter" storage solutions by directly connecting students who have extra space with those who need it.

## My Technical Contributions
I took end-to-end ownership of the user experience and frontend architecture for this project:
* **UI/UX Design:** Architected the initial user flows, wireframes, and component designs using **Figma**.
* **Frontend Development:** Built the responsive web application from the ground up utilizing **React** and **TypeScript**, leveraging Tailwind CSS for a scalable design system. 
* **Backend Integration:** Managed the integration with **Supabase**, establishing the database connections and handling API key rotations to ensure secure and seamless data flow between the frontend UI and the backend infrastructure. 

## Features
- Desktop-optimized layout with header navigation
- Responsive CSS Grid layout for storage request cards
- Dynamic neighborhood tags
- Budget and Timeframe tags with color coding
- Built with React, TypeScript, Vite, and Tailwind CSS v4

## The Data Pipeline (Backend)
To provide real-time value to users, the application includes a data pipeline that fetches commercial storage prices from local Madison-area sites. This allows MadStorage to dynamically display exactly how much money a student is saving compared to local commercial rates. 
*(Note: See `parser/README.md` and `parser/docs/SCRAPER_FOR_BACKEND.md` for specific backend data contracts and JSON schemas).*

## Local Setup

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
