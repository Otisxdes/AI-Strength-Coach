-- Seed exercises for a specific user
-- Replace 'USER_ID' with actual user UUID after creating account

-- This seed is meant to be run after sign-up via the app's onboarding
-- Or you can call the /api/exercises/seed endpoint after signing in

-- Example exercises (insert with your user_id):
/*
insert into exercises (user_id, name, muscle_group, progression_type, is_bodyweight, rep_range_min, rep_range_max) values
  ('USER_ID', 'Bench Press', 'Chest', 'double_progression', false, 6, 10),
  ('USER_ID', 'Incline Dumbbell Press', 'Chest', 'double_progression', false, 8, 12),
  ('USER_ID', 'Cable Fly', 'Chest', 'double_progression', false, 12, 15),
  ('USER_ID', 'Pull Ups', 'Back', 'rep_first', true, 6, 12),
  ('USER_ID', 'Lat Pulldown', 'Back', 'double_progression', false, 8, 12),
  ('USER_ID', 'Seated Cable Row', 'Back', 'double_progression', false, 8, 12),
  ('USER_ID', 'Barbell Row', 'Back', 'double_progression', false, 6, 10),
  ('USER_ID', 'Shoulder Press', 'Shoulders', 'double_progression', false, 8, 12),
  ('USER_ID', 'Lateral Raise', 'Shoulders', 'double_progression', false, 12, 15),
  ('USER_ID', 'Face Pull', 'Shoulders', 'double_progression', false, 12, 15),
  ('USER_ID', 'Squat', 'Legs', 'double_progression', false, 6, 10),
  ('USER_ID', 'Leg Press', 'Legs', 'double_progression', false, 8, 12),
  ('USER_ID', 'Romanian Deadlift', 'Legs', 'double_progression', false, 8, 12),
  ('USER_ID', 'Leg Curl', 'Legs', 'double_progression', false, 10, 15),
  ('USER_ID', 'Leg Extension', 'Legs', 'double_progression', false, 10, 15),
  ('USER_ID', 'Calf Raise', 'Legs', 'double_progression', false, 12, 20),
  ('USER_ID', 'Bicep Curl', 'Biceps', 'double_progression', false, 10, 15),
  ('USER_ID', 'Hammer Curl', 'Biceps', 'double_progression', false, 10, 15),
  ('USER_ID', 'Incline Curl', 'Biceps', 'double_progression', false, 10, 15),
  ('USER_ID', 'Tricep Pushdown', 'Triceps', 'double_progression', false, 10, 15),
  ('USER_ID', 'Overhead Tricep Extension', 'Triceps', 'double_progression', false, 10, 15),
  ('USER_ID', 'Skull Crusher', 'Triceps', 'double_progression', false, 8, 12);
*/
