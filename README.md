# AI Strength Coach

A mobile-first web app to track progressive overload and never forget what you lifted last time.

## What it does

- **Log sets fast** — type naturally ("Bench press 50kg 7 reps") or speak it
- **See last session** — instantly check previous performance
- **AI progression targets** — tells you what to attempt next and why
- **AI Coach** — chat backed by your real lift data
- **Exercise history** — e1RM chart, trend analysis, session history

## Stack

- Next.js 16 App Router + TypeScript
- Tailwind CSS v4
- Supabase (Auth + Postgres with RLS)
- Claude API (Haiku for parsing, Sonnet for coaching)
- Browser Web Speech API for voice input

## Setup

### 1. Install
```bash
npm install
```

### 2. Supabase

1. Create a project at supabase.com
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and anon key

### 3. Environment variables
```bash
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Run
```bash
npm run dev
```

## Deploy to Vercel

```bash
npx vercel
```

Set the same env vars in the Vercel dashboard. In Supabase → Auth → URL Config, add:
- Site URL: `https://your-app.vercel.app`
- Redirect URL: `https://your-app.vercel.app/auth/callback`

## Logging examples

```
Bench press 50kg 7 reps
Bench 50 x 7
Incline dumbbell 22.5 each hand for 8
Pull ups 15 reps bodyweight
Today: pullups 15, 10, 8, lat pulldown 55x10, 55x9
```

## App screens

| Screen | Path | Description |
|--------|------|-------------|
| Dashboard | `/dashboard` | Today's plan + last session |
| Log | `/log` | Text/voice set logging |
| Preview | `/preview` | Pre-workout targets per exercise |
| History | `/history` | All sessions |
| Session | `/history/[id]` | Session detail |
| Exercise | `/exercises/[id]` | e1RM chart + progression |
| Coach | `/coach` | AI chat |
| Profile | `/profile` | Stats + settings |
