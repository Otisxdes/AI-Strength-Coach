-- AI Strength Coach Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text,
  age integer,
  height_cm numeric,
  weight_kg numeric,
  training_experience text check (training_experience in ('beginner', 'intermediate', 'advanced')),
  goal text check (goal in ('strength', 'hypertrophy', 'endurance', 'general')),
  split jsonb default '["Chest + Biceps", "Back + Triceps", "Legs", "Shoulders"]'::jsonb,
  created_at timestamptz default now()
);

-- Exercises table
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  muscle_group text not null,
  progression_type text check (progression_type in ('linear', 'double_progression', 'rep_first')) default 'double_progression',
  is_bodyweight boolean default false,
  rep_range_min integer default 6,
  rep_range_max integer default 12,
  created_at timestamptz default now()
);

-- Workout sessions table
create table if not exists workout_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  workout_type text not null,
  notes text,
  created_at timestamptz default now()
);

-- Sets table
create table if not exists sets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  workout_session_id uuid references workout_sessions(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade not null,
  set_number integer not null default 1,
  weight_kg numeric,
  reps integer not null,
  is_bodyweight boolean default false,
  rir integer,
  notes text,
  created_at timestamptz default now()
);

-- AI suggestions table
create table if not exists ai_suggestions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  exercise_id uuid references exercises(id) on delete cascade,
  workout_session_id uuid references workout_sessions(id) on delete set null,
  suggestion text not null,
  reason text,
  target_weight_kg numeric,
  target_reps integer,
  created_at timestamptz default now()
);

-- RLS Policies
alter table profiles enable row level security;
alter table exercises enable row level security;
alter table workout_sessions enable row level security;
alter table sets enable row level security;
alter table ai_suggestions enable row level security;

create policy "Users can manage their own profile" on profiles for all using (auth.uid() = user_id);
create policy "Users can manage their own exercises" on exercises for all using (auth.uid() = user_id);
create policy "Users can manage their own sessions" on workout_sessions for all using (auth.uid() = user_id);
create policy "Users can manage their own sets" on sets for all using (auth.uid() = user_id);
create policy "Users can manage their own suggestions" on ai_suggestions for all using (auth.uid() = user_id);

-- Indexes
create index if not exists sets_workout_session_id_idx on sets(workout_session_id);
create index if not exists sets_exercise_id_idx on sets(exercise_id);
create index if not exists sets_user_id_idx on sets(user_id);
create index if not exists workout_sessions_user_id_date_idx on workout_sessions(user_id, date desc);
