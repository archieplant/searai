# User Flows Reference

## Overview

This document provides visual journey maps for all major user flows in the Recipe Killer AI app. Use these flows when implementing features, designing UX, or writing test scenarios.

---

## Flow Notation

```
[Screen Name] → Action/Event → [Next Screen]
    ↓
  Decision Point
    ├─ Yes → [Path A]
    └─ No  → [Path B]

✅ Success outcome
❌ Error outcome
⚠️  Warning/limit reached
```

---

## 1. New User Onboarding Flow

### Complete Signup Journey

```
[App Launch]
    ↓
Is onboarding complete?
    ├─ Yes → [Home Screen (tabs)]
    └─ No  → [Welcome Screen]
              ↓
          Tap "Get Started"
              ↓
        [Onboarding Modal]
              ↓
      ┌───────────────────────────────┐
      │  Step 1: How It Works         │
      │  - Show 3 step explanation    │
      │  - Upload, Slide, Save        │
      │  - Tap "Next"                 │
      └───────────────────────────────┘
              ↓
      ┌───────────────────────────────┐
      │  Step 2: Personal Info        │
      │  - First Name (required)      │
      │  - Last Name (required)       │
      │  - Referral Source (optional) │
      │  - Tap "Next"                 │
      └───────────────────────────────┘
              ↓
      ┌───────────────────────────────┐
      │  Step 3: Preferences          │
      │  - Allergies (optional)       │
      │  - Dislikes (optional)        │
      │  - Diet Type (optional)       │
      │  - Tap "Next" or "Skip"       │
      └───────────────────────────────┘
              ↓
      ┌───────────────────────────────┐
      │  Step 4: Create Account       │
      │  1. Check "I am 13+"          │
      │  2. Check "Terms & Privacy"   │
      │  3. Enter email               │
      │  4. Enter password (6+ chars) │
      │  5. Confirm password          │
      │  6. Tap "Create Account"      │
      └───────────────────────────────┘
              ↓
        Validation
              ├─ Error → ❌ Show error message, stay on Step 4
              └─ Success → Continue
                    ↓
            Create Auth Account
                    ├─ Error → ❌ Show error (existing email, network, etc.)
                    └─ Success → Continue
                          ↓
                  Save Profile Data
                      ↓
              Save Dietary Preferences
                      ↓
              Save Legal Consents
                      ↓
          Set onboardingComplete_v2 = true
                      ↓
          ✅ [Home Screen (tabs)]
```

### Back Navigation During Onboarding

```
[Step 4: Create Account] ← Tap Back ← [Step 3: Preferences]
[Step 3: Preferences]    ← Tap Back ← [Step 2: Personal Info]
[Step 2: Personal Info]  ← Tap Back ← [Step 1: How It Works]
[Step 1: How It Works]   ← Tap Back ← Close Modal → [Welcome Screen]
```

---

## 2. Returning User Login Flow

```
[Welcome Screen]
    ↓
Tap "Sign In"
    ↓
[Login Modal]
    ↓
Enter email + password
    ↓
Tap "Log In"
    ↓
Validate & Authenticate
    ├─ Error → ❌ "Invalid email or password", stay on [Login Modal]
    └─ Success → Continue
          ↓
    Check onboardingComplete_v2
          ├─ False → [Onboarding Modal] (should be rare)
          └─ True  → ✅ [Home Screen (tabs)]
```

---

## 3. Recipe Analysis Flow

### Upload & Analyze Recipe

```
[Home Screen (tabs)]
    ↓
Tap "Analyse Recipe" button
    ↓
[Upload Screen]
    ↓
Choose Input Method
    ├─ Take Photo ────┐
    ├─ Choose Photo ──┤
    └─ Paste Text ────┤
                      ↓
            Input Provided?
                ├─ No  → ❌ "Analyse Recipe" button disabled
                └─ Yes → "Analyse Recipe" button enabled
                            ↓
                    Tap "Analyse Recipe"
                            ↓
                  Check Subscription Limits
                      ├─ Free tier limit reached (5/month) → ⚠️ Show Paywall Alert
                      │                                       ├─ Upgrade → [Paywall Screen]
                      │                                       └─ Cancel  → Stay on [Upload Screen]
                      └─ Within limits → Continue
                                ↓
                      [Analysis Loading Screen]
                          "Analysing your recipe..."
                                ↓
                        Call OpenAI API
                          ├─ Error → ❌ "Analysis Failed" → Return to [Upload Screen]
                          └─ Success → Continue
                                    ↓
                          Upload Image (if provided)
                                    ↓
                            Save to recent_recipes
                                    ↓
                        Increment analysis count
                                    ↓
                    Auto-cleanup old recent recipes
                    (delete oldest if count > 3)
                                    ↓
                      ✅ [Recipe Detail Screen]
                          - Show complexity level 2 (default)
                          - Slider at level 2
                          - Display ingredients & instructions
```

### Apply Dietary Preferences During Analysis

```
OpenAI API Call
    ↓
Retrieve user's dietary_preferences
    ↓
Include in system prompt:
    - Allergies: NEVER include
    - Dislikes: Substitute when possible
    - Diet Type: Strictly enforce
    ↓
AI generates 5 complexity levels
    ↓
All levels respect dietary preferences
    ↓
Return recipe_data to app
```

---

## 4. Recipe Management Flow

### Save Recipe to My Recipes

```
[Recipe Detail Screen]
    ↓
Recipe is unsaved (from recent recipes)
    ↓
Tap "Save" button
    ↓
Check Save Limit
    ├─ Free tier at limit (3/3) → ⚠️ Show Paywall Alert
    │                              ├─ Upgrade → [Paywall Screen]
    │                              └─ Cancel  → Stay on [Recipe Detail Screen]
    └─ Within limit → Continue
              ↓
      Update is_saved = true
              ↓
    ✅ Success message "Saved!"
    Button changes to "Saved" (disabled)
              ↓
    Recipe now appears in Library tab
```

### View Saved Recipes

```
[Home Screen (tabs)]
    ↓
Navigate to Library tab
    ↓
[Library Screen]
    ↓
Display: "My Recipes" | "X recipes"
    ↓
Fetch saved recipes (is_saved = true)
    ↓
    ├─ 0 recipes → Show empty state
    └─ 1+ recipes → Show grid (2 columns)
                    ↓
              Tap on recipe card
                    ↓
          [Recipe Detail Screen]
          - Show at saved complexity level
          - "Saved" button (disabled)
          - "Delete" button visible
```

### Delete Saved Recipe

```
[Recipe Detail Screen]
(Saved recipe)
    ↓
Tap "Delete" button
    ↓
Confirmation alert:
"Delete Recipe?"
"Are you sure? This cannot be undone."
    ├─ Cancel → Stay on screen
    └─ Delete → Continue
              ↓
      Delete from database
              ↓
      Free up save slot (free tier)
              ↓
    Navigate back to [Library Screen]
              ↓
    ✅ Recipe removed from list
```

### Change Complexity Level

```
[Recipe Detail Screen]
    ↓
Current: Level 2 displayed
    ↓
User drags slider to Level 4
    ↓
Update UI immediately:
    - Ingredients for level 4
    - Instructions for level 4
    ↓
Save selected_complexity = 4 to database
    ↓
Next time user opens this recipe:
    - Slider at level 4
    - Display level 4 content
```

---

## 5. Subscription & Purchase Flow

### Free Tier Limit Reached → Paywall

```
[User Action]
(Analyse recipe when 5/5 used)
OR
(Save recipe when 3/3 saved)
    ↓
Pre-flight limit check
    ↓
⚠️ Limit reached alert:
"Analysis Limit Reached" OR "Save Limit Reached"
    ├─ Maybe Later → Stay on current screen
    └─ Upgrade     → [Paywall Screen]
                          ↓
                  ┌─────────────────────────────┐
                  │  Paywall Screen             │
                  │  ┌─────────────────────┐    │
                  │  │ FREE (Current Plan) │    │
                  │  │ - 5 analyses/month  │    │
                  │  │ - 3 saved recipes   │    │
                  │  └─────────────────────┘    │
                  │  ┌─────────────────────┐    │
                  │  │ PREMIUM ⭐           │    │
                  │  │ - Unlimited analyses│    │
                  │  │ - Unlimited saves   │    │
                  │  └─────────────────────┘    │
                  │                             │
                  │  [Start Premium - £4.99]    │
                  │  [Restore Purchases]        │
                  └─────────────────────────────┘
```

### Purchase Premium Subscription

```
[Paywall Screen]
    ↓
Tap "Start Premium - £4.99/month"
    ↓
App Store / Play Store Modal
"Confirm purchase with Face ID"
    ├─ Cancel → Return to [Paywall Screen]
    └─ Confirm → Continue
              ↓
      RevenueCat processes purchase
              ↓
        Purchase result
          ├─ Error → ❌ "Purchase Failed"
          └─ Success → Continue
                    ↓
            Webhook updates backend
                    ↓
        Update user_limits.is_premium = true
                    ↓
        ✅ Success alert: "Welcome to Premium!"
                    ↓
            Return to previous screen
                    ↓
        Premium features now available:
        - Unlimited analyses
        - Unlimited saved recipes
        - Premium badge in profile
```

### Restore Purchases

```
[Paywall Screen]
    ↓
Tap "Restore Purchases"
    ↓
RevenueCat checks App Store / Play Store
    ↓
    ├─ No subscription found → ℹ️ "No Purchases Found"
    └─ Subscription found → Continue
                          ↓
                Update user status to premium
                          ↓
              ✅ "Purchase Restored!"
                          ↓
              Return to previous screen
                          ↓
              Premium features active
```

---

## 6. Community Sharing Flow

### Share Recipe to Community

```
[Recipe Detail Screen]
(Saved or recent recipe)
    ↓
Tap "Share" button
    ↓
Check Content Policy acceptance
    ├─ Already accepted → Skip modal
    └─ Not accepted → [Content Policy Modal]
                        ┌──────────────────────────────┐
                        │ Community Sharing            │
                        │                              │
                        │ [Content Policy text]        │
                        │                              │
                        │ ☐ I agree to Content Policy  │
                        │                              │
                        │ [Cancel] [Share to Community]│
                        │ (Share button disabled until │
                        │  checkbox checked)           │
                        └──────────────────────────────┘
                              ├─ Cancel → Return to [Recipe Detail]
                              └─ Check box + Share → Continue
                                                    ↓
                              Save consent to legal_consents
                                                    ↓
                          Copy recipe to community_recipes
                          (anonymous - no username shown)
                                                    ↓
                          ✅ Success: "Shared to Community!"
                                                    ↓
                          Button changes to "Shared" (disabled)
                                                    ↓
                          Recipe now in Discover tab (all users)
```

### Discover & Save Community Recipes

```
[Home Screen (tabs)]
    ↓
Navigate to Discover tab
    ↓
[Discover Screen]
"Discover" | "Community Recipes"
    ↓
Fetch community_recipes (newest first)
    ↓
    ├─ 0 recipes → Empty state: "No Community Recipes Yet!"
    └─ 1+ recipes → Grid (2 columns)
                    ↓
              Tap on recipe card
                    ↓
          [Recipe Detail Screen]
          (Community recipe view)
          - No "Share" button (already shared)
          - No "Delete" button (not yours)
          - "Save" button visible
                    ↓
              Tap "Save" button
                    ↓
          Check save limit (same as regular save)
              ├─ At limit → ⚠️ Show paywall alert
              └─ Within limit → Continue
                              ↓
                  Copy recipe to user's saved_recipes
                              ↓
                  ✅ "Saved!" alert
                  "Recipe added to your My Recipes"
                      ├─ View My Recipes → [Library Screen]
                      └─ OK → Stay on [Recipe Detail]
```

---

## 7. Profile Management Flow

### View Profile

```
[Home Screen (tabs)]
    ↓
Navigate to Profile tab
    ↓
[Profile Screen]
    ↓
Display:
    - Avatar (placeholder with color)
    - Name (First Last)
    - Email
    - Subscription status
      ├─ Free: "Free" badge + usage stats
      │        "Analyses: X / 5"
      │        "Saved: X / 3"
      │        [Upgrade to Premium] button
      │
      └─ Premium: "Premium" badge + "Unlimited"
                  "Active since [date]"
    - [Edit Profile] button
    - [Dietary Preferences] button
    - [Log Out] button
```

### Edit Profile

```
[Profile Screen]
    ↓
Tap "Edit Profile"
    ↓
[Edit Profile Screen]
    ↓
Form with:
    - First Name (editable)
    - Last Name (editable)
    - Email (read-only, greyed out)
    - Referral Source (editable)
    - Avatar Color picker (5 colors)
    ↓
Make changes
    ↓
Tap "Save Changes"
    ↓
Validation
    ├─ Error (empty name) → ❌ Show validation error
    └─ Valid → Continue
              ↓
      Update user_profiles
              ↓
      ✅ Success: "Profile updated!"
              ↓
      Return to [Profile Screen]
      with updated info
```

### Update Dietary Preferences

```
[Profile Screen]
    ↓
Tap "Dietary Preferences"
    ↓
[Dietary Preferences Screen]
    ↓
Form with:
    - Allergies (text input, comma-separated)
    - Dislikes (text input, comma-separated)
    - Diet Type (dropdown: None, Vegetarian, Vegan, etc.)
    ↓
Make changes
    ↓
Tap "Save Changes"
    ↓
Update dietary_preferences table
    ↓
✅ Success: "Preferences updated!"
    ↓
Return to [Profile Screen]
    ↓
Future recipe analyses will use new preferences
```

### Log Out

```
[Profile Screen]
    ↓
Tap "Log Out"
    ↓
Confirmation alert:
"Log Out?"
"Are you sure you want to log out?"
    ├─ Cancel → Stay on [Profile Screen]
    └─ Log Out → Continue
              ↓
      Clear Supabase Auth session
              ↓
      Clear local storage
              ↓
      ✅ Navigate to [Welcome Screen]
          - "Get Started" button
          - "Sign In" button
```

---

## 8. Error Handling Flows

### Network Error During Analysis

```
[Upload Screen]
    ↓
User taps "Analyse Recipe"
    ↓
[Analysis Loading Screen]
    ↓
Network request fails
    ↓
❌ Alert: "Analysis Failed"
"Network error. Please check your connection."
    ↓
Return to [Upload Screen]
with input preserved (photo/text)
    ↓
User can retry analysis
```

### OpenAI API Error

```
[Analysis Loading Screen]
    ↓
OpenAI API returns 500 error
    ↓
❌ Alert: "Analysis Failed"
"Failed to analyse recipe. Please try again."
    ↓
Analysis count NOT incremented
    ↓
Return to [Upload Screen]
with input preserved
```

### Session Expired

```
[Any Screen - User is logged in]
    ↓
Session token expires (after 7 days)
    ↓
User tries authenticated action
    ↓
❌ Alert: "Session Expired"
"Your session has expired. Please log in again."
    ↓
Clear session
    ↓
Navigate to [Welcome Screen]
    ↓
User can log in again
```

### Camera Permission Denied

```
[Upload Screen]
    ↓
User taps "Take Photo"
    ↓
Check camera permission
    ├─ Granted → Open camera
    └─ Denied → ❌ Alert: "Camera Access Denied"
                "Please enable camera access in Settings."
                [Cancel] [Open Settings]
                    ├─ Cancel → Stay on [Upload Screen]
                    └─ Open Settings → Open device Settings app
```

---

## 9. First-Time User Experience (FTUE)

### Day 1: Discovery

```
1. App Launch → [Welcome Screen]
2. Tap "Get Started" → [Onboarding Flow]
3. Complete signup → [Home Screen (tabs)]
4. Tap "Analyse Recipe" → [Upload Screen]
5. Take photo or paste recipe → Analyse
6. View recipe → [Recipe Detail Screen]
7. Adjust complexity slider → See different versions
8. Tap "Save" → Recipe saved to Library
9. Navigate to Library tab → See saved recipe
10. Navigate to Discover tab → See community recipes
```

### Day 2-7: Exploration

```
- Analyse more recipes (use up free tier)
- Save recipes to Library (use up save slots)
- Share favorite recipe to Community
- Discover and save community recipes
- Update dietary preferences
- Experience paywall (when limits reached)
```

### Day 7+: Power User or Premium

```
Free Tier User:
    - Monthly limit resets on 1st
    - Manage saved recipes carefully
    - Active in community sharing/saving

Premium User:
    - Unlimited analysis and saves
    - Premium badge in profile
    - No restrictions
```

---

## 10. Navigation Map

### Bottom Tab Navigation (Main Screens)

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  [Home] [Discover] [Library] [Profile]          │
│    ↓       ↓         ↓          ↓               │
├─────────────────────────────────────────────────┤
│  Home              Discover    Library  Profile │
│  - Welcome         - Community - My     - View  │
│  - Big Analyse     recipes    Recipes   info    │
│    button          (grid)     (grid)  - Edit    │
│  - Quick start               - Pull to - Prefs  │
│                                refresh - Logout │
│                              - Tap →            │
│                                Recipe           │
└─────────────────────────────────────────────────┘
```

### Modal/Stack Navigation

```
Modal Screens (slide up from bottom):
- Onboarding Flow (4 steps)
- Login Modal
- Paywall Screen
- Content Policy Modal

Stack Navigation (push/pop):
- [Upload Screen] → [Recipe Detail Screen]
- [Library Screen] → [Recipe Detail Screen]
- [Discover Screen] → [Recipe Detail Screen]
- [Profile Screen] → [Edit Profile Screen]
- [Profile Screen] → [Dietary Preferences Screen]
```

---

## Quick Reference: Critical Paths

### P0 Critical Paths (Must Always Work)

1. **New User Signup**
   ```
   Welcome → Get Started → Onboarding (4 steps) → Create Account → Home
   ```

2. **Login**
   ```
   Welcome → Sign In → Enter credentials → Home
   ```

3. **Recipe Analysis**
   ```
   Home → Analyse Recipe → Upload → Analyse → Recipe Detail
   ```

4. **Save Recipe**
   ```
   Recipe Detail → Save → Library (now contains recipe)
   ```

5. **Purchase Premium**
   ```
   Paywall → Start Premium → Confirm → Welcome to Premium
   ```

---

## Changelog

**v1.0 (2025-01-20):**
- Initial user flows documentation
- All major flows mapped
- Critical paths identified
- Aligned with BDD test suite v1.0
