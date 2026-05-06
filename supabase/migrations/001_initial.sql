-- ============================================================
-- Wayer - Initial Schema
-- Run this in your Supabase SQL editor (or via supabase db push)
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  profile_color TEXT NOT NULL DEFAULT '#3b82f6',
  bio           TEXT,
  is_approved   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Categories (seeded below)
CREATE TABLE categories (
  id    SERIAL PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  icon  TEXT NOT NULL,
  color TEXT NOT NULL
);

INSERT INTO categories (name, label, icon, color) VALUES
  ('restaurant', 'Restaurant',       '🍽️', '#ef4444'),
  ('shop',       'Shop',             '🛍️', '#8b5cf6'),
  ('walk',       'Walk / Area',      '🚶', '#22c55e'),
  ('hike',       'Hike',             '🥾', '#f97316'),
  ('poi',        'Point of Interest','📍', '#3b82f6'),
  ('other',      'Other',            '⭐', '#6b7280');

-- Pins
CREATE TABLE pins (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  link        TEXT,
  tips        TEXT,
  cost_range  TEXT,
  added_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pin votes (one per user per pin)
CREATE TABLE pin_votes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id     UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (pin_id, user_id)
);

-- Pin comments
CREATE TABLE pin_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pin_id     UUID NOT NULL REFERENCES pins(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Helper: check if calling user is approved
-- ============================================================
CREATE OR REPLACE FUNCTION is_approved()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_approved FROM profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pins        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_votes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_comments ENABLE ROW LEVEL SECURITY;

-- profiles: users can always read their own profile (needed for approval check)
CREATE POLICY "own_profile_select" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- profiles: approved users can read all profiles
CREATE POLICY "approved_read_profiles" ON profiles
  FOR SELECT USING (is_approved());

-- profiles: users can insert their own row (signup)
CREATE POLICY "own_profile_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- profiles: users can update their own profile
CREATE POLICY "own_profile_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- categories: anyone authenticated can read
CREATE POLICY "auth_read_categories" ON categories
  FOR SELECT USING (auth.role() = 'authenticated');

-- pins: approved users can read all
CREATE POLICY "approved_read_pins" ON pins
  FOR SELECT USING (is_approved());

-- pins: approved users can insert (must be the adder)
CREATE POLICY "approved_insert_pins" ON pins
  FOR INSERT WITH CHECK (is_approved() AND auth.uid() = added_by);

-- pins: owner can update
CREATE POLICY "owner_update_pins" ON pins
  FOR UPDATE USING (auth.uid() = added_by);

-- pins: owner can delete
CREATE POLICY "owner_delete_pins" ON pins
  FOR DELETE USING (auth.uid() = added_by);

-- pin_votes: approved users can read all
CREATE POLICY "approved_read_votes" ON pin_votes
  FOR SELECT USING (is_approved());

-- pin_votes: approved users can insert their own vote
CREATE POLICY "approved_insert_votes" ON pin_votes
  FOR INSERT WITH CHECK (is_approved() AND auth.uid() = user_id);

-- pin_votes: users can delete their own vote
CREATE POLICY "own_delete_votes" ON pin_votes
  FOR DELETE USING (auth.uid() = user_id);

-- pin_comments: approved users can read all
CREATE POLICY "approved_read_comments" ON pin_comments
  FOR SELECT USING (is_approved());

-- pin_comments: approved users can insert their own
CREATE POLICY "approved_insert_comments" ON pin_comments
  FOR INSERT WITH CHECK (is_approved() AND auth.uid() = user_id);

-- pin_comments: users can delete their own
CREATE POLICY "own_delete_comments" ON pin_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Grants: allow the authenticated role to access tables
-- (required when "Automatically expose new tables" is disabled)
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles      TO authenticated;
GRANT SELECT                          ON categories   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE  ON pins         TO authenticated;
GRANT SELECT, INSERT, DELETE          ON pin_votes    TO authenticated;
GRANT SELECT, INSERT, DELETE          ON pin_comments TO authenticated;
