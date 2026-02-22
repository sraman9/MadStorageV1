# Supabase Setup for MadStorage

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Name it (e.g. `madstorage`), set a password, choose a region
4. Wait for the project to be ready

## 2. Get your API keys

1. In your project, go to **Settings** (gear icon) → **API**
2. Copy:
   - **Project URL**
   - **anon public** key (for frontend auth)
   - **service_role** key (for backend – keep this secret!)

## 3. Frontend `.env`

```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
```

## 4. Backend `.env`

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** Use the **service_role** key for the backend (not anon). Find it under "Project API keys" in Supabase Settings → API.

## 5. Run the database schema

1. In Supabase, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/schema.sql`
4. Paste and click **Run**

This creates the `storage_requests` and `storage_spaces` tables with Row Level Security.

## 6. Run the app

**Terminal 1 – Backend** (loads `.env` automatically):

```bash
cd backend
pip3 install -r requirements.txt   # if not done
python3 main.py
```

**Terminal 2 – Frontend:**

```bash
cd frontend
npm run dev
```

You're done. Sign up with an email (use @wisc.edu for signup), then create requests and list spaces. The frontend uses Supabase for auth; the backend reads/writes Supabase for requests and spaces (and adds savings from the scraper).
