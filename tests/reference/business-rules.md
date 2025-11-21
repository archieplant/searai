# Business Rules Reference

## Overview

This document provides a comprehensive reference of all business rules, limits, constraints, and policies governing the Recipe Killer AI app. Use this as a quick reference when implementing features or reviewing test scenarios.

---

## Subscription Tiers & Limits

### Free Tier

**Monthly Limits:**
- Recipe analyses: **5 per calendar month**
- Saved recipes: **3 maximum**
- Reset cycle: 1st of each month (server-side)

**Allowed Actions:**
- Community sharing: ✅ Unlimited
- Community recipe saving: ✅ Allowed (counts toward saved recipe limit)
- View community recipes: ✅ Unlimited
- Profile management: ✅ Full access
- Dietary preferences: ✅ Full access

**Restrictions:**
- Analysis limit enforced before AI call
- Save limit enforced before database write
- Paywall shown when limits reached

### Premium Tier

**Limits:**
- Recipe analyses: **Unlimited**
- Saved recipes: **Unlimited**
- All other features: **Unlimited**

**Benefits:**
- Priority support (future)
- Ad-free experience (future)
- Early access to new features (future)

**Pricing:**
- Monthly subscription: £4.99/month (or regional equivalent)
- Managed via RevenueCat
- Auto-renewing subscription

---

## Legal Compliance & Consent Tracking

### COPPA (Children's Online Privacy Protection Act)

**Age Verification:**
- Minimum age: **13 years old**
- Verification method: User checkbox confirmation
- Enforcement: Age verification MUST be checked BEFORE Terms/Privacy acceptance
- UI constraint: Terms checkbox disabled until age verified

**Database Tracking:**
```
Table: legal_consents
Field: age_verified
Value: true/false
Version: N/A (not versioned)
```

### GDPR (General Data Protection Regulation)

**Required Consents:**

1. **Terms of Service**
   - Version: 1.0 (current)
   - Required: Yes (account creation)
   - Versioned: Yes
   - Table: `legal_consents.terms_accepted`

2. **Privacy Policy**
   - Version: 1.0 (current)
   - Required: Yes (account creation)
   - Versioned: Yes
   - Table: `legal_consents.privacy_accepted`

3. **Content Policy** (Community Sharing)
   - Version: 1.0 (current)
   - Required: Only for community sharing (one-time)
   - Versioned: Yes
   - Table: `legal_consents.content_policy`

**Consent Tracking Requirements:**
- All consents timestamped: `accepted_at`
- All consents versioned: `version`
- User ID tracked: `user_id`
- Immutable audit trail

---

## Authentication & User Management

### Account Creation

**Required Fields:**
- Email: Valid email format
- Password: Minimum 6 characters
- First name: Required (non-empty)
- Last name: Required (non-empty)
- Age verification: Must be checked
- Terms acceptance: Must be checked (after age verification)
- Privacy acceptance: Must be checked (after age verification)

**Optional Fields:**
- Referral source: Optional text field

**Validation Rules:**
```
Email regex: Standard email format (enforced by Supabase)
Password: 6+ characters
First name: Non-empty string
Last name: Non-empty string
```

### Login

**Required:**
- Email: Registered email address
- Password: Correct password

**Session:**
- Managed by Supabase Auth
- Persists across app restarts
- Stored in secure device storage
- Expires after 7 days (Supabase default)

### Onboarding

**Completion Flag:**
- Key: `onboardingComplete_v2`
- Storage: AsyncStorage
- Value: `'true'` (string)
- Purpose: Skip onboarding on subsequent app launches

**Version Note:**
- `v2` indicates current onboarding version
- Increment version if onboarding flow changes significantly

---

## Recipe Analysis Rules

### Input Requirements

**Valid Inputs:**
- Photo (camera or library): `.jpg`, `.png`, `.heic`
- Text: Pasted recipe text
- Both: Photo AND text (combined analysis)

**Invalid Inputs:**
- Neither photo nor text provided → Error: "Input Required"
- Corrupted image file → Error: "Invalid Image"
- Text >10,000 characters → Warning or truncation

### AI Analysis Process

**OpenAI Configuration:**
- Model: GPT-4o (vision + text)
- Vision: Enabled for image analysis
- Text understanding: Enabled

**Output Structure:**
```json
{
  "dishName": "String (e.g., 'Classic Spaghetti Carbonara')",
  "originalServings": "Number (e.g., 4)",
  "cookingTime": "String (e.g., '30 minutes')",
  "cuisine": "String (e.g., 'Italian')",
  "complexityLevels": [
    {
      "level": 0,
      "title": "Ultra Simple",
      "ingredients": ["..."],
      "instructions": ["..."],
      "nutritionalInfo": {...}
    },
    // Levels 1, 2, 3, 4...
  ]
}
```

**Complexity Levels:**
- Count: Always 5 levels (0-4)
- Default level: 2 (mid-level)
- Level 0: Ultra Simple
- Level 1: Simple
- Level 2: Medium
- Level 3: Complex
- Level 4: Gourmet/Advanced

**Format Requirements:**
- Language: British English
  - Examples: "flavour" not "flavor", "courgette" not "zucchini"
- Measurements: Metric only
  - Weight: grams (g), kilograms (kg)
  - Volume: milliliters (ml), liters (l)
  - Temperature: Celsius (°C)
- Spelling: UK conventions

### Dietary Preferences Application

**Allergies (Safety Critical):**
- Rule: **NEVER include** allergen ingredients
- Severity: Critical safety requirement
- Examples: peanuts, shellfish, tree nuts, dairy, eggs, soy, wheat
- Application: All 5 complexity levels MUST exclude allergens
- No exceptions

**Dislikes (Preference):**
- Rule: Substitute when possible
- Severity: User preference (not safety)
- Examples: mushrooms, olives, blue cheese
- Application: AI should find suitable alternatives
- May include if no alternative available (rare)

**Diet Types:**
- **None:** No restrictions
- **Vegetarian:** No meat, poultry, fish, seafood
  - Allowed: Dairy, eggs, plant-based
- **Vegan:** No animal products
  - Excluded: Meat, dairy, eggs, honey
- **Pescatarian:** No meat or poultry
  - Allowed: Fish, seafood, dairy, eggs
- **Gluten-free:** No wheat, barley, rye
- **Other:** Custom diet types may be added

**Application Logic:**
1. Retrieve user's dietary preferences from `dietary_preferences` table
2. Send preferences to OpenAI in system prompt
3. AI generates recipe adhering to all preferences
4. All 5 complexity levels must respect preferences

---

## Recipe Storage & Management

### Recent Recipes

**Purpose:** Temporary storage for analyzed recipes

**Rules:**
- Maximum: **3 recent recipes** per user
- Condition: `is_saved = false`
- Auto-cleanup: When 4th recipe analyzed, delete oldest unsaved
- Protection: Saved recipes (`is_saved = true`) are NEVER auto-deleted

**Cleanup Logic:**
```
IF recent_recipes_count >= 3 AND new recipe analyzed THEN
  DELETE oldest recipe WHERE is_saved = false
  INSERT new recipe
END IF
```

### Saved Recipes

**Purpose:** Permanent storage for user's favorite recipes

**Limits:**
- Free tier: **3 saved recipes maximum**
- Premium tier: **Unlimited**

**Rules:**
- Save action: Sets `is_saved = true` on existing recipe
- Cannot save if limit reached (free tier)
- Deletion: Frees up save slot (free tier)
- Saved recipes are NOT auto-deleted

**Save Sources:**
1. Recent recipes (after analysis)
2. Community recipes (copied to user's saved recipes)

### Complexity Level Selection

**Per-Recipe Storage:**
- Field: `selected_complexity` (0-4)
- Default: 2 (set after analysis)
- User can change via slider
- Persisted per recipe per user

**Behavior:**
- Changing slider updates database immediately
- Selected level persists when navigating away
- Returning to recipe shows last selected level

---

## Community Features

### Sharing to Community

**Requirements:**
- Content Policy v1.0 acceptance (one-time)
- Recipe can be from saved or recent recipes
- User must be logged in

**Anonymity:**
- **Username:** NOT shown
- **Profile picture:** NOT shown
- **User ID:** Stored but not displayed
- Purpose: Privacy and community safety

**Sharing Rules:**
- Same recipe cannot be shared twice by same user
- Recipe is copied to `community_recipes` table
- Includes: recipe_data, complexity_level, image_url
- Excludes: User identifying information

**Content Policy:**
- Prohibits: Inappropriate, offensive, copyrighted content
- Enforcement: User agreement (automated moderation future feature)
- Version: 1.0 (current)

### Discovering Community Recipes

**Feed:**
- Sort: Most recent first (`created_at DESC`)
- Limit: 50 recipes per load (pagination future feature)
- Filter: None (all recipes shown)

**Display:**
- Grid layout: 2 columns
- Card info: Dish name, image, Save button
- Anonymous: No user attribution shown

**Saving from Community:**
- Action: Copy recipe to user's `saved_recipes`
- Limit: Counts toward saved recipe limit (free tier: 3)
- Result: User owns a copy of the community recipe

---

## Data Retention & Cleanup

### Automatic Cleanup Rules

**Recent Recipes:**
```
Trigger: When analyzing new recipe and recent_count >= 3
Action: DELETE oldest WHERE is_saved = false
Frequency: On-demand (during analysis)
```

**User Data:**
```
Retention: Indefinite (until user account deleted)
Deletion: On user request or account deletion
Scope: All user data across all tables
```

### Manual Deletion

**Saved Recipes:**
- User can delete any saved recipe
- Confirmation required
- Permanent (cannot be undone)
- Frees up save slot (free tier)

**Account Deletion:**
- Future feature
- Would delete all user data (GDPR compliance)

---

## Permissions & Device Access

### Required Permissions

**Camera:**
- Platform: iOS, Android
- Purpose: Take photo of recipe
- Request timing: When "Take Photo" tapped
- Fallback: User can still use "Choose Photo" or text input

**Photo Library:**
- Platform: iOS, Android
- Purpose: Select existing photo
- Request timing: When "Choose Photo" tapped
- Fallback: User can still use camera or text input

**Optional Permissions:**
- None currently required

### Permission States

**Granted:**
- User can access feature normally

**Denied:**
- Show alert with explanation
- Offer "Open Settings" button (iOS)
- Fallback to alternative input methods

**Not Determined:**
- Request permission when feature accessed
- Show permission dialog (OS-level)

---

## Error Handling & Limits

### Rate Limiting

**Analysis Rate Limit:**
- Free tier: 5 per calendar month
- Premium: No limit
- Enforcement: Pre-flight check before API call
- Reset: 1st of each month (server-side cron job)

**API Rate Limits:**
- OpenAI: Subject to OpenAI's rate limits
- Supabase: Subject to plan limits
- Handling: Retry with exponential backoff

### Timeout Values

**Network Requests:**
- Default: 30 seconds
- OpenAI analysis: 60 seconds (longer for complex recipes)
- Image upload: 30 seconds

**User Experience:**
- Show loading state immediately
- Display timeout error after limit
- Offer retry option

### Error Recovery

**Transient Errors (Retry):**
- Network timeouts
- 5xx server errors
- Rate limit exceeded (after backoff)

**Permanent Errors (Show Error):**
- Invalid credentials (401)
- Forbidden (403)
- Not found (404)
- Malformed data

**User Data Preservation:**
- On error: Preserve user input (photo, text)
- Allow retry without re-entry
- Don't increment counters on error

---

## Payment & Subscription

### In-App Purchase Flow

**Products:**
- Monthly subscription: `rka_premium_monthly`
- Pricing: Regional (e.g., £4.99/month in UK)

**Purchase Flow:**
1. User taps "Upgrade to Premium"
2. App shows paywall with pricing
3. User taps "Start Premium"
4. OS shows App Store/Play Store modal
5. User confirms with Face ID/Touch ID/Password
6. RevenueCat processes purchase
7. Webhook updates backend
8. User status updates to premium

**Verification:**
- RevenueCat manages subscription status
- Backend verifies with RevenueCat API
- `user_limits.is_premium` updated to `true`

### Restore Purchases

**Purpose:** Restore subscription on new device

**Flow:**
1. User taps "Restore Purchases"
2. RevenueCat checks App Store/Play Store
3. If subscription found: Update user status to premium
4. If not found: Show "No Purchases Found" message

**Use Cases:**
- New device login
- Reinstall app
- Subscription status not syncing

---

## Version Management

### API Versions

**OpenAI:**
- Model: `gpt-4o` (current)
- Update strategy: Manual migration if model changes

**Supabase:**
- Database: PostgreSQL
- Schema versioning: Migrations tracked in version control

**RevenueCat:**
- SDK version: Check package.json
- Product IDs: Defined in RevenueCat dashboard

### App Versions

**Onboarding:**
- Current: `v2` (AsyncStorage key: `onboardingComplete_v2`)
- Increment when onboarding changes significantly

**Legal Consents:**
- Terms of Service: `v1.0`
- Privacy Policy: `v1.0`
- Content Policy: `v1.0`
- Update strategy: Require re-acceptance on version bump

---

## Testing & Quality Assurance

### Critical Paths (P0)

**Must Always Work:**
1. User signup with legal compliance
2. User login
3. Recipe analysis (core feature)
4. Recipe saving
5. Subscription purchase
6. Free tier limit enforcement

### High Priority (P1)

**Important But Not Blocking:**
1. Community sharing
2. Dietary preferences application
3. Profile management
4. Recipe deletion

### Medium Priority (P2)

**Secondary Features:**
1. Pull to refresh
2. Error message clarity
3. Navigation smoothness

### Low Priority (P3)

**Nice to Have:**
1. Empty states
2. Placeholder visuals
3. Animations

---

## Future Features (Not Yet Implemented)

**Planned:**
- Recipe search/filter in Library
- Recipe categories/tags
- Recipe notes/modifications
- Shopping list generation
- Meal planning
- Recipe sharing via link (outside app)
- Recipe ratings
- User profiles (public)
- Follow other users
- Notifications
- Dark mode enhancements
- Avatar upload

**Not Planned:**
- Recipe creation from scratch (AI-only)
- Video recipes
- Live cooking mode
- Ingredient substitution suggestions (separate from analysis)

---

## Quick Reference Tables

### Subscription Limits

| Feature              | Free Tier | Premium  |
|----------------------|-----------|----------|
| Analyses/month       | 5         | Unlimited|
| Saved recipes        | 3         | Unlimited|
| Community sharing    | ✅         | ✅        |
| Community saving     | ✅         | ✅        |
| Dietary preferences  | ✅         | ✅        |

### Legal Consents

| Consent Type    | Required When      | Version | Versioned |
|-----------------|--------------------|---------|-----------|
| Age Verified    | Account creation   | N/A     | No        |
| Terms of Service| Account creation   | 1.0     | Yes       |
| Privacy Policy  | Account creation   | 1.0     | Yes       |
| Content Policy  | Community sharing  | 1.0     | Yes       |

### Recipe Storage Limits

| Storage Type    | Max Count | Auto-Delete | User Delete |
|-----------------|-----------|-------------|-------------|
| Recent recipes  | 3         | ✅ Oldest    | ❌           |
| Saved (free)    | 3         | ❌           | ✅           |
| Saved (premium) | Unlimited | ❌           | ✅           |

### Dietary Preference Types

| Preference | Type      | Enforcement | Examples                    |
|------------|-----------|-------------|-----------------------------|
| Allergies  | Safety    | MUST NOT    | peanuts, shellfish, dairy   |
| Dislikes   | Preference| Substitute  | mushrooms, olives           |
| Diet Type  | Lifestyle | MUST        | Vegetarian, Vegan, etc.     |

---

## Changelog

**v1.0 (2025-01-20):**
- Initial business rules documentation
- Covers all current features
- Aligned with BDD test suite v1.0
