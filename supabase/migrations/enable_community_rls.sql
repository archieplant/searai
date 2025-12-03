-- =====================================================
-- ENABLE ROW LEVEL SECURITY FOR COMMUNITY TABLES
-- =====================================================
-- This file enables RLS policies for community_recipes
-- Run this in Supabase SQL Editor before production launch
--
-- IMPORTANT: Test these policies thoroughly before enabling!
-- =====================================================

-- =====================================================
-- TABLE: community_recipes
-- =====================================================

-- Enable RLS on community_recipes table
ALTER TABLE community_recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for re-running this script)
DROP POLICY IF EXISTS "Anyone can view published community recipes" ON community_recipes;
DROP POLICY IF EXISTS "Authenticated users can share recipes" ON community_recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON community_recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON community_recipes;
DROP POLICY IF EXISTS "Service role can manage all community recipes" ON community_recipes;

-- Policy 1: Anyone (including anonymous) can view published recipes
-- This allows the Discover page to work for all users
CREATE POLICY "Anyone can view published community recipes"
  ON community_recipes
  FOR SELECT
  USING (is_published = TRUE);

-- Policy 2: Authenticated users can share (insert) recipes
-- Only authenticated users can share recipes to the community
CREATE POLICY "Authenticated users can share recipes"
  ON community_recipes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

-- Policy 3: Users can update their own recipes
-- Users can edit recipes they've shared (e.g., unpublish)
CREATE POLICY "Users can update own recipes"
  ON community_recipes
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policy 4: Users can delete their own recipes
-- Users can remove recipes they've shared
CREATE POLICY "Users can delete own recipes"
  ON community_recipes
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Policy 5: Service role has full access (for admin/backend operations)
CREATE POLICY "Service role can manage all community recipes"
  ON community_recipes
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- TABLE: community_recipe_saves (if it exists)
-- =====================================================
-- If you have a community_recipe_saves table, enable RLS here

-- Check if table exists first
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'community_recipe_saves'
  ) THEN
    -- Enable RLS
    ALTER TABLE community_recipe_saves ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies
    DROP POLICY IF EXISTS "Users can view own saves" ON community_recipe_saves;
    DROP POLICY IF EXISTS "Users can save recipes" ON community_recipe_saves;
    DROP POLICY IF EXISTS "Users can unsave recipes" ON community_recipe_saves;
    DROP POLICY IF EXISTS "Service role can manage all saves" ON community_recipe_saves;

    -- Policy: Users can view their own saves
    CREATE POLICY "Users can view own saves"
      ON community_recipe_saves
      FOR SELECT
      TO authenticated
      USING (auth.uid()::text = user_id);

    -- Policy: Users can save recipes
    CREATE POLICY "Users can save recipes"
      ON community_recipe_saves
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = user_id);

    -- Policy: Users can unsave (delete) their saves
    CREATE POLICY "Users can unsave recipes"
      ON community_recipe_saves
      FOR DELETE
      TO authenticated
      USING (auth.uid()::text = user_id);

    -- Policy: Service role has full access
    CREATE POLICY "Service role can manage all saves"
      ON community_recipe_saves
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run these queries to verify RLS is enabled:

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('community_recipes', 'community_recipe_saves')
  AND schemaname = 'public';

-- Should show 'true' for rowsecurity column

-- List all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('community_recipes', 'community_recipe_saves')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- TESTING
-- =====================================================
-- Test these scenarios after enabling RLS:

-- 1. As anonymous user:
--    - Can view published community recipes ✓
--    - Cannot insert/update/delete recipes ✗

-- 2. As authenticated user:
--    - Can view published community recipes ✓
--    - Can insert own recipes ✓
--    - Can update own recipes ✓
--    - Can delete own recipes ✓
--    - Cannot update/delete other users' recipes ✗

-- 3. As service role:
--    - Can do everything ✓

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To disable RLS (for development only):
-- ALTER TABLE community_recipes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE community_recipe_saves DISABLE ROW LEVEL SECURITY;
