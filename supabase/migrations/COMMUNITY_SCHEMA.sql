-- SearAI - Community Recipes Schema
-- This file contains the SQL schema for the community recipe sharing feature

-- =====================================================
-- TABLE: community_recipes
-- =====================================================
-- Stores recipes shared anonymously by users to the community
-- Features:
-- - Anonymous sharing (user_id tracked internally but not displayed)
-- - Auto-publish (no review queue for v1)
-- - Simple save count tracking
-- - Chronological ordering for "Recent" feed

CREATE TABLE IF NOT EXISTS community_recipes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User tracking (internal only, not displayed publicly)
  user_id TEXT NOT NULL,

  -- Recipe content
  recipe_data JSONB NOT NULL,
  complexity_level INT NOT NULL CHECK (complexity_level >= 0 AND complexity_level <= 4),

  -- Image storage
  image_url TEXT,
  image_path TEXT,

  -- Publishing status
  is_published BOOLEAN DEFAULT TRUE,  -- Auto-publish for v1

  -- Engagement metrics (simple for v1)
  save_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
-- Index for chronological feed (Recent tab)
CREATE INDEX IF NOT EXISTS idx_community_recipes_created_at
  ON community_recipes(created_at DESC)
  WHERE is_published = TRUE;

-- Index for user's shared recipes
CREATE INDEX IF NOT EXISTS idx_community_recipes_user_id
  ON community_recipes(user_id);

-- Index for save count (for future trending/popularity sorting)
CREATE INDEX IF NOT EXISTS idx_community_recipes_save_count
  ON community_recipes(save_count DESC)
  WHERE is_published = TRUE;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE community_recipes IS 'Stores recipes shared anonymously by users to the community feed';
COMMENT ON COLUMN community_recipes.user_id IS 'User who shared the recipe (internal tracking, not displayed publicly)';
COMMENT ON COLUMN community_recipes.recipe_data IS 'Full recipe analysis data in JSONB format';
COMMENT ON COLUMN community_recipes.complexity_level IS 'Complexity level user selected when sharing (0=Recipe Killer, 1=Simple, 2=Average, 3=Complex, 4=Very Complex)';
COMMENT ON COLUMN community_recipes.is_published IS 'Whether recipe is visible in community feed (auto-true for v1)';
COMMENT ON COLUMN community_recipes.save_count IS 'Number of times recipe has been saved to users My Recipes';

-- =====================================================
-- SAMPLE DATA (for testing)
-- =====================================================
-- Uncomment to insert sample community recipes for testing

/*
INSERT INTO community_recipes (user_id, recipe_data, complexity_level, save_count)
VALUES
  ('test-user-1', '{"dishName": "Classic Margherita Pizza", "cuisine": "Italian"}', 1, 5),
  ('test-user-2', '{"dishName": "Chicken Tikka Masala", "cuisine": "Indian"}', 2, 12),
  ('test-user-3', '{"dishName": "Simple Pasta Carbonara", "cuisine": "Italian"}', 0, 8);
*/

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================
-- For future implementation when RLS is enabled
-- Users can:
-- - Read all published community recipes
-- - Insert their own recipes
-- - Update/delete only their own recipes

/*
-- Enable RLS
ALTER TABLE community_recipes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published recipes
CREATE POLICY "Public can view published community recipes"
  ON community_recipes
  FOR SELECT
  USING (is_published = TRUE);

-- Policy: Authenticated users can share recipes
CREATE POLICY "Authenticated users can share recipes"
  ON community_recipes
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON community_recipes
  FOR UPDATE
  USING (auth.uid()::text = user_id);

-- Policy: Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON community_recipes
  FOR DELETE
  USING (auth.uid()::text = user_id);
*/

-- =====================================================
-- NOTES
-- =====================================================
--
-- FUTURE ENHANCEMENTS:
-- 1. Add 'category' field for filtering (Italian, Asian, etc.)
-- 2. Add 'report_count' for moderation
-- 3. Add 'is_featured' for admin curation
-- 4. Create separate 'recipe_interactions' table for likes/saves
-- 5. Add triggers to auto-update save_count
-- 6. Enable RLS for production security
-- 7. Add image moderation/validation
--
-- ANONYMOUS DISPLAY:
-- User anonymity is maintained by:
-- - Not exposing user_id in API responses
-- - Not showing user names/avatars
-- - Generating anonymous IDs from user_id hash if needed
--
-- PERFORMANCE:
-- - Indexes ensure fast chronological and popularity queries
-- - JSONB allows flexible recipe data storage
-- - Pagination recommended for large feeds (LIMIT/OFFSET)
