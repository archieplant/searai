# Data Models Reference

## Overview

This document provides a comprehensive reference of all database tables, their schemas, relationships, and data structures used in the Recipe Killer AI app. Use this when implementing features that interact with the database or when writing tests that verify data integrity.

---

## Database Tables

### 1. user_profiles

**Purpose:** Store user profile information

**Schema:**
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  referral_source TEXT,
  avatar_color TEXT DEFAULT '#FF6B35',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

**Columns:**

| Column          | Type         | Nullable | Default      | Description                           |
|-----------------|--------------|----------|--------------|---------------------------------------|
| id              | UUID         | No       | Auto         | Primary key                           |
| user_id         | TEXT         | No       | -            | Supabase Auth user ID (unique)        |
| first_name      | TEXT         | Yes      | NULL         | User's first name                     |
| last_name       | TEXT         | Yes      | NULL         | User's last name                      |
| referral_source | TEXT         | Yes      | NULL         | How user heard about app              |
| avatar_color    | TEXT         | Yes      | '#FF6B35'    | Hex color for profile avatar          |
| created_at      | TIMESTAMPTZ  | No       | NOW()        | Record creation timestamp             |
| updated_at      | TIMESTAMPTZ  | No       | NOW()        | Record last update timestamp          |

**Relationships:**
- One-to-one with Supabase Auth user (via `user_id`)
- One-to-one with `dietary_preferences` (via `user_id`)
- One-to-one with `user_limits` (via `user_id`)
- One-to-one with `legal_consents` (via `user_id`)

**Business Rules:**
- Created during onboarding (after account creation)
- `first_name` and `last_name` required during signup
- `referral_source` optional
- `avatar_color` defaults to orange, user can change in profile

**Available Avatar Colors:**
- Purple: `#8B7FE8`
- Teal: `#4ECDC4`
- Orange: `#FF6B35` (default)
- Pink: `#E74C9E`
- Blue: `#45B7D1`

---

### 2. dietary_preferences

**Purpose:** Store user's dietary restrictions and preferences

**Schema:**
```sql
CREATE TABLE dietary_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  allergies JSONB DEFAULT '[]'::jsonb,
  dislikes JSONB DEFAULT '[]'::jsonb,
  diet_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dietary_preferences_user_id ON dietary_preferences(user_id);
```

**Columns:**

| Column     | Type        | Nullable | Default | Description                              |
|------------|-------------|----------|---------|------------------------------------------|
| id         | UUID        | No       | Auto    | Primary key                              |
| user_id    | TEXT        | No       | -       | Supabase Auth user ID (unique)           |
| allergies  | JSONB       | Yes      | []      | Array of allergen strings                |
| dislikes   | JSONB       | Yes      | []      | Array of disliked ingredient strings     |
| diet_type  | TEXT        | Yes      | NULL    | Diet type (Vegetarian, Vegan, etc.)      |
| created_at | TIMESTAMPTZ | No       | NOW()   | Record creation timestamp                |
| updated_at | TIMESTAMPTZ | No       | NOW()   | Record last update timestamp             |

**Relationships:**
- One-to-one with `user_profiles` (via `user_id`)

**Data Examples:**

**Vegetarian with allergies:**
```json
{
  "allergies": ["peanuts", "tree nuts", "shellfish"],
  "dislikes": ["mushrooms", "olives", "blue cheese"],
  "diet_type": "Vegetarian"
}
```

**Vegan:**
```json
{
  "allergies": [],
  "dislikes": ["coconut"],
  "diet_type": "Vegan"
}
```

**No restrictions:**
```json
{
  "allergies": [],
  "dislikes": [],
  "diet_type": null
}
```

**Diet Type Options:**
- `null` or empty: No dietary restrictions
- `"Vegetarian"`: No meat, poultry, fish, seafood
- `"Vegan"`: No animal products (meat, dairy, eggs, honey)
- `"Pescatarian"`: No meat or poultry (fish/seafood allowed)
- `"Gluten-free"`: No wheat, barley, rye
- Custom values possible

**Business Rules:**
- Created during onboarding (can be skipped)
- Can be updated anytime in Profile settings
- Allergies are **safety critical** - NEVER included in recipes
- Dislikes are preferences - substituted when possible
- Diet type enforced strictly across all complexity levels

---

### 3. legal_consents

**Purpose:** Track user consent to legal documents (GDPR/COPPA compliance)

**Schema:**
```sql
CREATE TABLE legal_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  accepted BOOLEAN NOT NULL,
  version TEXT,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legal_consents_user_id ON legal_consents(user_id);
CREATE UNIQUE INDEX idx_legal_consents_user_type ON legal_consents(user_id, consent_type);
```

**Columns:**

| Column       | Type        | Nullable | Default | Description                          |
|--------------|-------------|----------|---------|--------------------------------------|
| id           | UUID        | No       | Auto    | Primary key                          |
| user_id      | TEXT        | No       | -       | Supabase Auth user ID                |
| consent_type | TEXT        | No       | -       | Type of consent                      |
| accepted     | BOOLEAN     | No       | -       | Whether consent was given            |
| version      | TEXT        | Yes      | NULL    | Version of document accepted         |
| accepted_at  | TIMESTAMPTZ | No       | NOW()   | When consent was given               |
| created_at   | TIMESTAMPTZ | No       | NOW()   | Record creation timestamp            |

**Relationships:**
- One-to-many with `user_profiles` (via `user_id`)
- Multiple consent records per user (one per consent_type)

**Consent Types:**

| consent_type      | Required When       | Versioned | Example Version |
|-------------------|---------------------|-----------|-----------------|
| age_verified      | Account creation    | No        | NULL            |
| terms_accepted    | Account creation    | Yes       | "1.0"           |
| privacy_accepted  | Account creation    | Yes       | "1.0"           |
| content_policy    | Community sharing   | Yes       | "1.0"           |

**Data Examples:**

**Account creation consents:**
```sql
INSERT INTO legal_consents (user_id, consent_type, accepted, version, accepted_at) VALUES
  ('user-123', 'age_verified', true, NULL, '2025-01-15 10:30:00'),
  ('user-123', 'terms_accepted', true, '1.0', '2025-01-15 10:30:00'),
  ('user-123', 'privacy_accepted', true, '1.0', '2025-01-15 10:30:00');
```

**Community sharing consent:**
```sql
INSERT INTO legal_consents (user_id, consent_type, accepted, version, accepted_at) VALUES
  ('user-123', 'content_policy', true, '1.0', '2025-01-16 14:20:00');
```

**Business Rules:**
- All consents are immutable (no UPDATE, only INSERT)
- Age verification required before Terms/Privacy
- Terms and Privacy required for account creation
- Content Policy required only for community sharing (one-time)
- Versioned consents require re-acceptance when version changes

---

### 4. user_limits (formerly user_subscriptions)

**Purpose:** Track subscription status and usage limits

**Schema:**
```sql
CREATE TABLE user_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  is_premium BOOLEAN DEFAULT FALSE,
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'annual')),
  premium_since TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_limits_user_id ON user_limits(user_id);
```

**Columns:**

| Column            | Type        | Nullable | Default | Description                           |
|-------------------|-------------|----------|---------|---------------------------------------|
| id                | UUID        | No       | Auto    | Primary key                           |
| user_id           | TEXT        | No       | -       | Supabase Auth user ID (unique)        |
| is_premium        | BOOLEAN     | Yes      | FALSE   | Whether user has active premium       |
| subscription_type | TEXT        | Yes      | NULL    | 'monthly' or 'annual'                 |
| premium_since     | TIMESTAMPTZ | Yes      | NULL    | When premium started                  |
| expires_at        | TIMESTAMPTZ | Yes      | NULL    | When premium expires (for tracking)   |
| created_at        | TIMESTAMPTZ | No       | NOW()   | Record creation timestamp             |
| updated_at        | TIMESTAMPTZ | No       | NOW()   | Record last update timestamp          |

**Relationships:**
- One-to-one with `user_profiles` (via `user_id`)

**Data Examples:**

**Free tier user:**
```json
{
  "user_id": "user-123",
  "is_premium": false,
  "subscription_type": null,
  "premium_since": null,
  "expires_at": null
}
```

**Premium user:**
```json
{
  "user_id": "user-456",
  "is_premium": true,
  "subscription_type": "monthly",
  "premium_since": "2025-01-01T00:00:00Z",
  "expires_at": "2025-02-01T00:00:00Z"
}
```

**Business Rules:**
- Created when user signs up (defaults to free tier)
- Updated by RevenueCat webhook when subscription purchased
- `is_premium = true` grants unlimited analyses and saves
- Free tier limits: 5 analyses/month, 3 saved recipes
- Premium tier limits: Unlimited analyses, unlimited saved recipes

---

### 5. recipe_analyses

**Purpose:** Track recipe analysis requests for usage limits

**Schema:**
```sql
CREATE TABLE recipe_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipe_analyses_user_created ON recipe_analyses(user_id, created_at);
```

**Columns:**

| Column     | Type        | Nullable | Default | Description                       |
|------------|-------------|----------|---------|-----------------------------------|
| id         | UUID        | No       | Auto    | Primary key                       |
| user_id    | TEXT        | No       | -       | Supabase Auth user ID             |
| created_at | TIMESTAMPTZ | No       | NOW()   | When analysis was performed       |

**Relationships:**
- Many-to-one with `user_profiles` (via `user_id`)

**Usage:**
- One record inserted per recipe analysis
- Used to count monthly analyses for free tier limit (5/month)
- Query: `SELECT COUNT(*) WHERE user_id = X AND created_at >= start_of_month`

**Business Rules:**
- Record created when analysis starts
- If analysis fails, record should be deleted (to avoid charging user)
- Premium users still have records (for analytics), but no limit enforcement
- Monthly limit resets on 1st of each month (server-side)

**Data Examples:**

**User with 3 analyses this month:**
```sql
SELECT COUNT(*) FROM recipe_analyses
WHERE user_id = 'user-123'
AND created_at >= date_trunc('month', CURRENT_DATE);
-- Result: 3
```

---

### 6. recent_recipes

**Purpose:** Store temporary analyzed recipes (max 3 unsaved per user)

**Schema:**
```sql
CREATE TABLE recent_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  selected_complexity INT NOT NULL DEFAULT 2,
  image_url TEXT,
  is_saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recent_recipes_user_id ON recent_recipes(user_id);
CREATE INDEX idx_recent_recipes_user_saved ON recent_recipes(user_id, is_saved, created_at);
```

**Columns:**

| Column              | Type        | Nullable | Default | Description                           |
|---------------------|-------------|----------|---------|---------------------------------------|
| id                  | UUID        | No       | Auto    | Primary key                           |
| user_id             | TEXT        | No       | -       | Supabase Auth user ID                 |
| recipe_data         | JSONB       | No       | -       | Full recipe JSON (5 complexity levels)|
| selected_complexity | INT         | No       | 2       | Currently selected complexity (0-4)   |
| image_url           | TEXT        | Yes      | NULL    | Supabase Storage URL for recipe image |
| is_saved            | BOOLEAN     | Yes      | FALSE   | Whether recipe is saved to My Recipes |
| created_at          | TIMESTAMPTZ | No       | NOW()   | Record creation timestamp             |
| updated_at          | TIMESTAMPTZ | No       | NOW()   | Record last update timestamp          |

**Relationships:**
- Many-to-one with `user_profiles` (via `user_id`)

**Recipe Data Structure (JSONB):**
```json
{
  "dishName": "Classic Spaghetti Carbonara",
  "originalServings": 4,
  "cookingTime": "30 minutes",
  "cuisine": "Italian",
  "allergenInfo": ["eggs", "dairy"],
  "complexityLevels": [
    {
      "level": 0,
      "title": "Ultra Simple",
      "servings": 4,
      "prepTime": "5 minutes",
      "cookTime": "15 minutes",
      "ingredients": [
        {"item": "Spaghetti", "amount": "400g"},
        {"item": "Bacon bits", "amount": "200g"},
        {"item": "Eggs", "amount": "4 large"},
        {"item": "Parmesan cheese", "amount": "100g grated"}
      ],
      "instructions": [
        "Cook spaghetti according to package directions",
        "Fry bacon bits until crispy",
        "Mix eggs and parmesan",
        "Toss hot pasta with bacon and egg mixture",
        "Serve immediately"
      ],
      "nutritionalInfo": {
        "calories": 650,
        "protein": "28g",
        "carbs": "75g",
        "fat": "25g"
      }
    },
    // ... levels 1-4 with increasing complexity
  ]
}
```

**Business Rules:**
- Max 3 recent recipes per user where `is_saved = false`
- When 4th recipe analyzed, oldest unsaved recipe auto-deleted
- Saved recipes (`is_saved = true`) are NEVER auto-deleted
- Saving a recipe sets `is_saved = true` (moves to "saved recipes")
- Complexity selection persisted per recipe

**Auto-Cleanup Logic:**
```sql
-- Count unsaved recent recipes
SELECT COUNT(*) FROM recent_recipes
WHERE user_id = 'user-123' AND is_saved = false;

-- If count >= 3, delete oldest before inserting new
DELETE FROM recent_recipes
WHERE id = (
  SELECT id FROM recent_recipes
  WHERE user_id = 'user-123' AND is_saved = false
  ORDER BY created_at ASC
  LIMIT 1
);
```

---

### 7. saved_recipes (deprecated - now using recent_recipes with is_saved flag)

**Note:** The app now uses `recent_recipes` table with `is_saved = true` instead of a separate `saved_recipes` table. This section is included for historical reference.

**If separate table exists:**
- Schema identical to `recent_recipes`
- No auto-deletion logic
- Free tier limit: 3 recipes max
- Premium tier: unlimited

---

### 8. community_recipes

**Purpose:** Store recipes shared to community feed

**Schema:**
```sql
CREATE TABLE community_recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_by_user_id TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  complexity_level INT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_community_recipes_created ON community_recipes(created_at DESC);
CREATE INDEX idx_community_recipes_user ON community_recipes(shared_by_user_id);
```

**Columns:**

| Column            | Type        | Nullable | Default | Description                              |
|-------------------|-------------|----------|---------|------------------------------------------|
| id                | UUID        | No       | Auto    | Primary key                              |
| shared_by_user_id | TEXT        | No       | -       | Supabase Auth user ID (not displayed)    |
| recipe_data       | JSONB       | No       | -       | Full recipe JSON (same as recent_recipes)|
| complexity_level  | INT         | No       | -       | Complexity level shared (0-4)            |
| image_url         | TEXT        | Yes      | NULL    | Supabase Storage URL for recipe image    |
| created_at        | TIMESTAMPTZ | No       | NOW()   | Record creation timestamp                |

**Relationships:**
- Many-to-one with `user_profiles` (via `shared_by_user_id`)
- No direct relationship - recipes are copied when saved by other users

**Business Rules:**
- All shared recipes are anonymous (user_id stored but not displayed)
- Same recipe can be shared only once per user (prevent duplicates)
- Recipe data is a copy from user's recent/saved recipes
- Displayed in Discover tab, sorted by `created_at DESC`
- Users can save community recipes to their own My Recipes (creates copy)

**Data Example:**
```json
{
  "id": "recipe-abc-123",
  "shared_by_user_id": "user-789",
  "recipe_data": {
    "dishName": "Thai Green Curry",
    // ... full recipe structure
  },
  "complexity_level": 2,
  "image_url": "https://storage.supabase.co/.../curry.jpg",
  "created_at": "2025-01-18T10:30:00Z"
}
```

---

## Supabase Storage

### Bucket: recipe-images

**Purpose:** Store user-uploaded recipe photos

**Configuration:**
- Public access: Yes (anyone can view)
- File size limit: 5 MB
- Allowed file types: `.jpg`, `.png`, `.heic`, `.webp`
- Path structure: `{user_id}/{recipe_id}.jpg`

**Upload Process:**
1. User selects/takes photo
2. Image compressed to 0.8 quality
3. Uploaded to `recipe-images/{user_id}/{uuid}.jpg`
4. URL stored in `recent_recipes.image_url` or `community_recipes.image_url`

**URL Format:**
```
https://{project}.supabase.co/storage/v1/object/public/recipe-images/{user_id}/{filename}.jpg
```

**Business Rules:**
- Images are public (anyone with URL can view)
- Deletion: Manual or when recipe deleted
- Fallback: Placeholder icon if `image_url` is null

---

## Supabase Auth

### User Authentication

**Auth Provider:** Supabase Auth (email/password)

**User Object:**
```typescript
{
  id: string;                    // UUID
  email: string;                 // User's email
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  last_sign_in_at: string;       // ISO timestamp
  // ... other Supabase Auth fields
}
```

**Session:**
- Stored in secure device storage
- Auto-refreshed by Supabase SDK
- Expires after 7 days (default)
- Persists across app restarts

**Relationships:**
- One-to-one with `user_profiles` (via `user_id`)
- `user_id` in all app tables references `auth.users.id`

---

## Data Relationships Diagram

```
auth.users (Supabase Auth)
    |
    | (user_id)
    |
    +-- user_profiles (1:1)
    |       |
    |       +-- dietary_preferences (1:1)
    |       +-- user_limits (1:1)
    |       +-- legal_consents (1:many)
    |
    +-- recent_recipes (1:many)
    |
    +-- recipe_analyses (1:many)
    |
    +-- community_recipes (1:many)
```

---

## Query Examples

### Check user subscription status
```sql
SELECT is_premium FROM user_limits
WHERE user_id = 'user-123';
```

### Count monthly analyses (free tier limit check)
```sql
SELECT COUNT(*) FROM recipe_analyses
WHERE user_id = 'user-123'
AND created_at >= date_trunc('month', CURRENT_DATE);
```

### Count saved recipes (free tier limit check)
```sql
SELECT COUNT(*) FROM recent_recipes
WHERE user_id = 'user-123'
AND is_saved = true;
```

### Get user's recent recipes (unsaved)
```sql
SELECT * FROM recent_recipes
WHERE user_id = 'user-123'
AND is_saved = false
ORDER BY created_at DESC
LIMIT 3;
```

### Get user's saved recipes
```sql
SELECT * FROM recent_recipes
WHERE user_id = 'user-123'
AND is_saved = true
ORDER BY created_at DESC;
```

### Get community recipes for Discover tab
```sql
SELECT * FROM community_recipes
ORDER BY created_at DESC
LIMIT 50;
```

### Check if user has accepted Content Policy
```sql
SELECT accepted FROM legal_consents
WHERE user_id = 'user-123'
AND consent_type = 'content_policy'
AND accepted = true;
```

---

## Indexes

**Performance Optimization:**

| Table              | Index Name                           | Columns                       | Purpose                        |
|--------------------|--------------------------------------|-------------------------------|--------------------------------|
| user_profiles      | idx_user_profiles_user_id            | user_id                       | Fast user lookups              |
| dietary_preferences| idx_dietary_preferences_user_id      | user_id                       | Fast preference lookups        |
| legal_consents     | idx_legal_consents_user_id           | user_id                       | Fast consent lookups           |
| legal_consents     | idx_legal_consents_user_type         | user_id, consent_type (unique)| Enforce one consent per type   |
| user_limits        | idx_user_limits_user_id              | user_id                       | Fast subscription checks       |
| recipe_analyses    | idx_recipe_analyses_user_created     | user_id, created_at           | Fast monthly counts            |
| recent_recipes     | idx_recent_recipes_user_id           | user_id                       | Fast recipe queries            |
| recent_recipes     | idx_recent_recipes_user_saved        | user_id, is_saved, created_at | Fast saved/recent separation   |
| community_recipes  | idx_community_recipes_created        | created_at DESC               | Fast Discover tab sorting      |
| community_recipes  | idx_community_recipes_user           | shared_by_user_id             | Fast user recipe lookups       |

---

## Row Level Security (RLS)

**Current Status:** DISABLED (development)

**Production TODO:**
1. Enable RLS on all tables
2. Create policies for each table:

```sql
-- Example: user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Similar policies for other tables
```

---

## Data Migration Notes

**Version History:**
- v1.0: Initial schema with separate `saved_recipes` table
- v1.1: Migrated to `recent_recipes` with `is_saved` flag
- v2.0: Added `avatar_color` to `user_profiles`
- v2.1: Renamed `user_subscriptions` to `user_limits`

**Future Migrations:**
- Add `deleted_at` for soft deletes
- Add `shared_count` to track recipe popularity
- Add `tags` to recipes for categorization

---

## Testing Data Seeds

**Test User:**
```sql
-- Insert test user (assumes auth.users already exists)
INSERT INTO user_profiles (user_id, first_name, last_name, referral_source, avatar_color)
VALUES ('test-user-123', 'Test', 'User', 'Manual Test', '#FF6B35');

INSERT INTO dietary_preferences (user_id, allergies, dislikes, diet_type)
VALUES ('test-user-123', '["peanuts"]'::jsonb, '["mushrooms"]'::jsonb, 'Vegetarian');

INSERT INTO user_limits (user_id, is_premium)
VALUES ('test-user-123', false);

INSERT INTO legal_consents (user_id, consent_type, accepted, version) VALUES
  ('test-user-123', 'age_verified', true, NULL),
  ('test-user-123', 'terms_accepted', true, '1.0'),
  ('test-user-123', 'privacy_accepted', true, '1.0');
```

---

## Changelog

**v1.0 (2025-01-20):**
- Initial data models documentation
- All current tables documented
- Relationships mapped
- Query examples provided
- Aligned with BDD test suite v1.0
