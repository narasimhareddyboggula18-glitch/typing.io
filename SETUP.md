# TypeForge — Setup & Deployment Guide

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a name, password, and region
3. Wait ~2 minutes for provisioning

### Get Credentials
- **Settings → API** → copy `Project URL` and `anon public` key

### Update `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJ...
```

### Run Database Schema
In **Supabase SQL Editor**, paste and run:

```sql
-- Profiles (auto-created on signup)
create table profiles (
  id uuid references auth.users primary key,
  username text unique,
  avatar_url text,
  xp integer default 0,
  rank text default 'Bronze',
  rating integer default 800,
  best_wpm integer default 0,
  avg_wpm integer default 0,
  total_words integer default 0,
  total_time integer default 0,
  streak_days integer default 0,
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

-- Level progress
create table level_progress (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  level_id integer not null,
  stars integer default 0,
  wpm integer default 0,
  accuracy integer default 0,
  completed_at timestamptz default now(),
  unique(user_id, level_id)
);

-- Typing sessions
create table typing_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  wpm integer not null,
  accuracy integer not null,
  duration integer not null,
  mode text not null,
  created_at timestamptz default now()
);

-- Mistake log (per-key error counts)
create table mistake_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  key text not null,
  count integer default 1,
  unique(user_id, key)
);

-- User achievements
create table user_achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, achievement_id)
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Row Level Security
alter table profiles enable row level security;
alter table level_progress enable row level security;
alter table typing_sessions enable row level security;
alter table mistake_log enable row level security;
alter table user_achievements enable row level security;

create policy "Public profiles" on profiles for select using (true);
create policy "Own profile" on profiles for update using (auth.uid() = id);
create policy "Own level progress" on level_progress for all using (auth.uid() = user_id);
create policy "Own sessions" on typing_sessions for all using (auth.uid() = user_id);
create policy "Own mistakes" on mistake_log for all using (auth.uid() = user_id);
create policy "Own achievements" on user_achievements for all using (auth.uid() = user_id);
```

---

## 2. Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 3. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import Repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy!

---

## 4. Optional: Google OAuth (for sign in with Google)

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Authorized redirect URI: `https://xxxx.supabase.co/auth/v1/callback`
5. In Supabase → **Authentication → Providers → Google** → paste Client ID + Secret

---

## 5. Sound Themes

The app uses the **Web Audio API** (no dependencies) for three themes:
- ⌨️ **Mechanical** — classic mechanical keyboard
- 🎵 **Soft** — gentle tones
- 🖱️ **Click** — crisp click sounds

Sound theme selector is available in the Practice typing arena.

---

## Feature Summary

| Feature | Status |
|---|---|
| Home — 4 animated mode cards | ✅ |
| Practice — 100 levels, WPM/accuracy, stars | ✅ |
| Practice — letter-by-letter highlighting | ✅ |
| Practice — confetti on completion | ✅ |
| Practice — sound effects (3 themes) | ✅ |
| Learn — interactive keyboard + finger colors | ✅ |
| Learn — 10 progressive lessons | ✅ |
| Learn — blind typing mode | ✅ |
| Learn — wrong-key finger hints | ✅ |
| Multiplayer — private rooms + matchmaking | ✅ |
| Multiplayer — animated race track | ✅ |
| Multiplayer — rank system (Bronze→Master) | ✅ |
| Stats — WPM/accuracy charts | ✅ |
| Stats — skill radar chart | ✅ |
| Stats — keyboard error heatmap | ✅ |
| Stats — streak calendar | ✅ |
| Stats — achievements gallery (20 badges) | ✅ |
| Supabase auth + DB schema | ✅ |
| Particle canvas background | ✅ |
| Glassmorphism + neon dark theme | ✅ |
