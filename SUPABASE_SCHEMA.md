# Supabase Database Schema

This document outlines the required database tables for the Recipe Killer app.

## Tables

### 1. user_subscriptions

Tracks user subscription status and limits.

**SQL to create table:**

```sql
CREATE TABLE user_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  is_premium BOOLEAN DEFAULT FALSE,
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'annual')),
  started_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);

-- Row Level Security is ENABLED with proper policies
-- See: supabase/migrations/enable_rls_policies.sql
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id` (int8, primary key) - Auto-incrementing ID
- `user_id` (text, unique, not null) - References Supabase Auth user ID
- `is_premium` (boolean, default false) - Whether user has active premium subscription
- `subscription_type` (text, nullable) - Type of subscription: 'monthly' or 'annual'
- `started_at` (timestamptz, nullable) - When subscription started
- `expires_at` (timestamptz, nullable) - When subscription expires
- `created_at` (timestamptz, default NOW()) - When record was created

**Notes:**
- User can only have one subscription record (enforced by UNIQUE constraint on user_id)
- **RLS is ENABLED** - Users can only access their own subscription data

---

### 2. recipe_analyses

Tracks recipe analysis requests for rate limiting only (5 requests/minute per user).

**SQL to create table:**

```sql
CREATE TABLE recipe_analyses (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster monthly count queries
CREATE INDEX idx_recipe_analyses_user_created ON recipe_analyses(user_id, created_at);

-- Row Level Security is ENABLED with proper policies
-- See: supabase/migrations/enable_rls_policies.sql
ALTER TABLE recipe_analyses ENABLE ROW LEVEL SECURITY;
```

**Columns:**
- `id` (int8, primary key) - Auto-incrementing ID
- `user_id` (text, not null) - References Supabase Auth user ID
- `created_at` (timestamptz, default NOW()) - When analysis was performed

**Notes:**
- Used for rate limiting only (5 requests per minute per user)
- No foreign key constraint to allow analysis tracking even if user is deleted
- Records could be archived/deleted after X months for storage optimization

---

### 3. user_profiles

Stores user profile information including name, referral source, and avatar color.

**SQL to create/update table:**

```sql
-- Add avatar_color column to existing user_profiles table
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_color TEXT DEFAULT '#FF6B35';

-- Update existing users to have default orange color
UPDATE user_profiles
SET avatar_color = '#FF6B35'
WHERE avatar_color IS NULL;
```

**Columns:**
- `id` (uuid, primary key)
- `user_id` (text, not null, unique)
- `first_name` (text, nullable)
- `last_name` (text, nullable)
- `referral_source` (text, nullable)
- `avatar_color` (text, default '#FF6B35') - Hex color code for profile avatar
- `created_at` (timestamptz, default NOW())
- `updated_at` (timestamptz, default NOW())

**Available Avatar Colors:**
- Purple: `#8B7FE8`
- Teal: `#4ECDC4`
- Orange: `#FF6B35` (default)
- Pink: `#E74C9E`
- Blue: `#45B7D1`

---

### 4. saved_recipes (already exists)

Already created in previous implementation. Stores user's saved recipes.

**Columns:**
- `id` (uuid, primary key)
- `user_id` (text, not null)
- `recipe_data` (jsonb, not null)
- `saved_complexity_level` (int, not null)
- `created_at` (timestamptz, default NOW())
- `updated_at` (timestamptz, default NOW())

---

## Subscription Model

- **3-Day Free Trial**: Full access to all features
- **After Trial**: £3.99/month or £39.99/year
- **All Features Included**: Unlimited recipe analysis and saving
- **Cancel Anytime**: Manage subscription in App Store/Play Store
- **Rate Limiting**: 5 recipe analyses per minute (prevents API abuse)

---

## Setup Instructions

1. Go to Supabase Dashboard → SQL Editor
2. Run the SQL commands above to create the tables
3. Verify tables are created in Table Editor
4. Test by running queries in SQL Editor

---

## Security

**Row Level Security (RLS) is ENABLED** on all tables. See `supabase/migrations/enable_rls_policies.sql` for the complete security policy implementation.

- Users can only access their own data
- Service role (Edge Functions/webhooks) can manage all data
- Anonymous users have no access

## Future Enhancements

- Add webhook integration with RevenueCat
- Add `subscription_id` from RevenueCat for reference
- Add `cancelled_at` field for cancellation tracking
- Add analytics tables for usage tracking
