# Supabase Row Level Security (RLS) Checklist

## 🚨 Critical Security Issue

You have **unrestricted tables** in your Supabase database. This means anyone can read, write, update, or delete data without authentication. This must be fixed before production!

## Current Status

### ✅ Tables With RLS Enabled
- `user_profiles` - ✅ Properly secured
  - Users can read own profile
  - Users can insert own profile
  - Users can update own profile
  - Service role can manage all profiles

### ⚠️ Tables Showing "Unrestricted" (Need RLS)
- `community_recipes` - ❌ **NEEDS RLS POLICIES**
- `saved_recipes` - ❌ Check if showing unrestricted
- `recent_recipes` - ❌ Check if showing unrestricted
- `dietary_preferences` - ❌ Check if showing unrestricted
- `recipe_analyses` - ❌ Check if showing unrestricted
- `user_subscriptions` - ❌ Check if showing unrestricted
- `legal_consents` - ❌ Check if showing unrestricted

## Step-by-Step Fix

### Step 1: Enable RLS for Community Tables

1. **Go to Supabase Dashboard** → Your Project → SQL Editor

2. **Run the community RLS script:**
   - Open `supabase/migrations/enable_community_rls.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click "Run"

3. **Verify it worked:**
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'community_recipes'
     AND schemaname = 'public';
   ```
   Should show `rowsecurity = true`

### Step 2: Check Other Tables

Run this query to see ALL your tables and their RLS status:

```sql
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;
```

### Step 3: Enable RLS for Core User Tables

If `enable_rls_policies.sql` hasn't been run, run it now:

1. **Open Supabase SQL Editor**
2. **Open** `supabase/migrations/enable_rls_policies.sql`
3. **Copy and paste** entire file
4. **Click "Run"**

This should enable RLS for:
- `user_profiles`
- `user_subscriptions`
- `recipe_analyses`
- `saved_recipes`
- `recent_recipes`
- `dietary_preferences`
- `legal_consents`

### Step 4: Verify All Tables Are Protected

Run this comprehensive check:

```sql
-- Check all tables have RLS enabled
SELECT
  tablename,
  CASE
    WHEN rowsecurity = true THEN '✅ Protected'
    ELSE '❌ UNPROTECTED - FIX THIS!'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'user_subscriptions',
    'recipe_analyses',
    'saved_recipes',
    'recent_recipes',
    'dietary_preferences',
    'legal_consents',
    'community_recipes',
    'community_recipe_saves'
  )
ORDER BY tablename;
```

**Expected Result:** All tables should show "✅ Protected"

### Step 5: Verify Policies Exist

Check that each table has the right policies:

```sql
SELECT
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Required Policies by Table

### user_profiles
- ✅ Users can read own profile (SELECT)
- ✅ Users can insert own profile (INSERT)
- ✅ Users can update own profile (UPDATE)
- ✅ Service role can manage all (ALL)

### community_recipes
- ✅ Anyone can view published recipes (SELECT)
- ✅ Authenticated users can share recipes (INSERT)
- ✅ Users can update own recipes (UPDATE)
- ✅ Users can delete own recipes (DELETE)
- ✅ Service role can manage all (ALL)

### saved_recipes
- ✅ Users can read own saved recipes (SELECT)
- ✅ Users can insert own saved recipes (INSERT)
- ✅ Users can delete own saved recipes (DELETE)
- ✅ Service role can manage all (ALL)

### recent_recipes
- ✅ Users can read own recent recipes (SELECT)
- ✅ Users can insert own recent recipes (INSERT)
- ✅ Users can update own recent recipes (UPDATE)
- ✅ Users can delete own recent recipes (DELETE)
- ✅ Service role can manage all (ALL)

### dietary_preferences
- ✅ Users can read own preferences (SELECT)
- ✅ Users can insert own preferences (INSERT)
- ✅ Users can update own preferences (UPDATE)
- ✅ Service role can manage all (ALL)

### recipe_analyses (rate limiting)
- ✅ Users can read own analyses (SELECT)
- ✅ System can insert analyses (INSERT) - service role
- ✅ Service role can manage all (ALL)

### user_subscriptions
- ✅ Users can read own subscription (SELECT)
- ✅ System can manage subscriptions (ALL) - service role

### legal_consents
- ✅ Users can read own consents (SELECT)
- ✅ Users can insert consents (INSERT)
- ✅ Users can update own consents (UPDATE)
- ✅ Service role can manage all (ALL)

## Testing Your RLS Policies

### Test 1: Anonymous User Access
Open an incognito browser window and try to:
- ❌ Should NOT be able to directly query any table
- ✅ Should be able to view community recipes (through your app)

### Test 2: Authenticated User Access
Log in as a test user and verify:
- ✅ Can read their own saved recipes
- ❌ Cannot read other users' saved recipes
- ✅ Can share recipes to community
- ❌ Cannot edit/delete other users' community recipes

### Test 3: Use Supabase SQL Editor
Try these queries with your JWT token:

```sql
-- This should only return YOUR data
SELECT * FROM saved_recipes;

-- This should only return YOUR data
SELECT * FROM user_profiles;

-- This should return ALL published community recipes
SELECT * FROM community_recipes WHERE is_published = true;
```

## Common Issues

### Issue: "permission denied for table"
**Cause:** RLS is enabled but no policies allow the operation
**Fix:** Check policies exist for that table and operation

### Issue: "row-level security policy for table violated"
**Cause:** Policy exists but user doesn't meet the criteria (e.g., trying to access another user's data)
**Fix:** This is correct behavior! The policy is working.

### Issue: Still showing "unrestricted"
**Cause:** RLS not enabled or policies not created
**Fix:** Re-run the RLS migration scripts

## Quick Fix Script

If tables are still unrestricted, run this in SQL Editor:

```sql
-- Enable RLS on all main tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dietary_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_recipes ENABLE ROW LEVEL SECURITY;

-- Verify all are enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'user_profiles',
    'user_subscriptions',
    'recipe_analyses',
    'saved_recipes',
    'recent_recipes',
    'dietary_preferences',
    'legal_consents',
    'community_recipes'
  );
```

## Final Checklist Before Production

- [ ] All tables show RLS enabled (not "unrestricted")
- [ ] Each table has appropriate policies
- [ ] Tested with multiple user accounts
- [ ] Verified users can't access each other's data
- [ ] Verified community recipes are publicly readable
- [ ] Verified service role still has full access
- [ ] Tested app functionality with RLS enabled

## Need Help?

If you're stuck:
1. Check Supabase logs for detailed error messages
2. Review the migration files in `supabase/migrations/`
3. Test queries in SQL Editor with "Use service role" toggled OFF
4. Verify your app is sending the Authorization header with JWT

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- Migration files: `supabase/migrations/enable_rls_policies.sql`
- Community RLS: `supabase/migrations/enable_community_rls.sql`
