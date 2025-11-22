-- =====================================================
-- Recipe Killer AI - Row Level Security (RLS) Migration
-- =====================================================
-- This migration enables RLS and creates security policies
-- for all tables to ensure users can only access their own data.
--
-- IMPORTANT: Run this in Supabase SQL Editor before production!
-- =====================================================

-- =====================================================
-- 1. USER_SUBSCRIPTIONS TABLE
-- =====================================================

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own subscription
CREATE POLICY "Users can view own subscription"
ON user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own subscription (for initial setup)
CREATE POLICY "Users can insert own subscription"
ON user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own subscription
CREATE POLICY "Users can update own subscription"
ON user_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Service role can manage all subscriptions (for RevenueCat webhooks)
CREATE POLICY "Service role can manage all subscriptions"
ON user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 2. RECIPE_ANALYSES TABLE
-- =====================================================

-- Enable RLS on recipe_analyses
ALTER TABLE recipe_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analyses
CREATE POLICY "Users can view own analyses"
ON recipe_analyses
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
ON recipe_analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Service role can manage all analyses (for admin/cleanup)
CREATE POLICY "Service role can manage all analyses"
ON recipe_analyses
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 3. USER_PROFILES TABLE
-- =====================================================

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Service role can manage all profiles
CREATE POLICY "Service role can manage all profiles"
ON user_profiles
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 4. SAVED_RECIPES TABLE
-- =====================================================

-- Enable RLS on saved_recipes
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved recipes
CREATE POLICY "Users can view own saved recipes"
ON saved_recipes
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own saved recipes
CREATE POLICY "Users can insert own saved recipes"
ON saved_recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own saved recipes
CREATE POLICY "Users can update own saved recipes"
ON saved_recipes
FOR UPDATE
TO authenticated
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own saved recipes
CREATE POLICY "Users can delete own saved recipes"
ON saved_recipes
FOR DELETE
TO authenticated
USING (auth.uid()::text = user_id);

-- Policy: Service role can manage all saved recipes
CREATE POLICY "Service role can manage all saved recipes"
ON saved_recipes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. LEGAL_CONSENTS TABLE (if exists)
-- =====================================================

-- Check if legal_consents table exists and enable RLS
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'legal_consents'
  ) THEN
    ALTER TABLE legal_consents ENABLE ROW LEVEL SECURITY;

    -- Policy: Users can view their own consents
    CREATE POLICY "Users can view own consents"
    ON legal_consents
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = user_id);

    -- Policy: Users can insert their own consents
    CREATE POLICY "Users can insert own consents"
    ON legal_consents
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

    -- Policy: Users can update their own consents
    CREATE POLICY "Users can update own consents"
    ON legal_consents
    FOR UPDATE
    TO authenticated
    USING (auth.uid()::text = user_id)
    WITH CHECK (auth.uid()::text = user_id);

    -- Policy: Service role can manage all consents
    CREATE POLICY "Service role can manage all consents"
    ON legal_consents
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify RLS is enabled:

-- Check RLS status for all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_subscriptions', 'recipe_analyses', 'user_profiles', 'saved_recipes', 'legal_consents')
ORDER BY tablename;

-- Check all policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- Uncomment and run these commands to disable RLS:

-- ALTER TABLE user_subscriptions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE recipe_analyses DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_recipes DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE legal_consents DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. Service role policies allow backend Edge Functions and webhooks to manage data
-- 2. Authenticated users can only access their own data
-- 3. Anonymous users have no access to any tables
-- 4. After running this migration, test thoroughly before deploying to production
-- 5. Remember to update SUPABASE_SCHEMA.md to reflect RLS is now enabled
