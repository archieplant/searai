# Feature: Community Sharing & Discovery

## Description

This feature covers the social/community aspects of the app:
- Share recipes to community feed
- Content Policy acceptance requirement
- Anonymous sharing (username not shown)
- Discover community recipes in Discover tab
- Save community recipes to My Recipes
- Community recipe viewing
- Free tier users can share and save from community

## Business Rules

**Sharing to Community:**
- Requires Content Policy v1.0 acceptance (one-time)
- All shared recipes are anonymous (no username/profile shown)
- Users can share any recipe (saved or recent)
- Free tier users can share unlimited recipes
- Premium users can share unlimited recipes

**Discovering Community Recipes:**
- All users can browse community recipes
- Community feed shows most recent recipes first
- Recipe images are displayed (or placeholder if none)
- Users can save any community recipe to their My Recipes
- Saving from community counts toward saved recipe limit (free tier: 3)

**Content Policy:**
- Must be accepted before first community share
- Acceptance tracked in `legal_consents` table
- Version 1.0 currently
- Prohibits inappropriate content

---

## Background

```gherkin
Background:
  Given I am logged in as a user
  And I have completed onboarding
  And the Supabase services are available
```

---

## Scenarios

### @P0-critical @community @share-first-time
### Scenario: Share recipe to community (first time with Content Policy)

```gherkin
Given I have a recipe "Spaghetti Carbonara" (saved or recent)
And I have NOT yet accepted the Content Policy
And I am on the recipe detail screen
When I tap the "Share" button

Then I should see the Content Policy modal with:
  | Element              | Content                                                              |
  | Title                | "Community Sharing"                                                  |
  | Policy text          | Summary of Content Policy                                            |
  | Checkbox             | "I agree to the Content Policy"                                      |
  | Buttons              | "Cancel", "Share to Community" (disabled until checkbox is checked)  |
  | Full policy link     | "View Full Content Policy"                                           |

When I check "I agree to the Content Policy"
Then the "Share to Community" button should become enabled

When I tap "Share to Community"
Then my consent should be recorded in `legal_consents` table:
  | Consent Type        | Accepted | Version |
  | content_policy      | true     | 1.0     |
And the recipe should be shared to `community_recipes` table with:
  | Field               | Value                          |
  | recipe_data         | Full recipe JSONB              |
  | complexity_level    | Current selected level         |
  | image_url           | Recipe image URL or null       |
  | shared_by_user_id   | Current user ID (not displayed)|
  | created_at          | Current timestamp              |
And I should see a success alert:
  | Field   | Value                                         |
  | Title   | "Shared to Community!"                        |
  | Message | "Your recipe is now visible to all users."    |
  | Button  | "OK"                                          |
And the "Share" button should show "Shared" (disabled)
```

---

### @P0-critical @community @share-subsequent
### Scenario: Share another recipe after accepting Content Policy

```gherkin
Given I have previously accepted the Content Policy
And I have a recipe "Chicken Tikka Masala"
And I am on the recipe detail screen
When I tap the "Share" button

Then I should NOT see the Content Policy modal
And the recipe should be immediately shared to the community
And I should see a success alert:
  | Field   | Value                                      |
  | Title   | "Shared to Community!"                     |
  | Message | "Your recipe is now visible to all users." |
  | Button  | "OK"                                       |
```

---

### @P1-high @community @share-cancel
### Scenario: Cancel Content Policy acceptance

```gherkin
Given I have NOT accepted the Content Policy
And I am on the recipe detail screen
When I tap the "Share" button
And I see the Content Policy modal
And I tap "Cancel"

Then the modal should close
And the recipe should NOT be shared to the community
And I should remain on the recipe detail screen
And my Content Policy consent should remain null
```

---

### @P0-critical @community @discover-recipes
### Scenario: Discover community recipes in Discover tab

```gherkin
Given there are 50 community recipes in the database
And I am on the home screen
When I navigate to the Discover tab

Then I should see the header "Discover"
And I should see the subtitle "Community Recipes"
And I should see a grid layout with 2 columns
And recipes should be displayed newest first

And I should see recipe cards with:
  | Element           | Content                              |
  | Recipe image      | Photo or placeholder icon            |
  | Recipe name       | Dish name (e.g., "Thai Green Curry") |
  | Save button       | "Save" button with bookmark icon     |

And I should be able to scroll through all recipes
And I should be able to pull to refresh
```

---

### @P0-critical @community @save-from-community
### Scenario: Save community recipe to My Recipes

```gherkin
Given I am logged in as a free tier user
And I have 1 saved recipe (2 slots remaining)
And I am on the Discover tab
And I see a community recipe "Pad Thai"

When I tap the "Save" button on the "Pad Thai" card
Then the button should show a loading state "Saving..."
And the recipe should be copied to my `saved_recipes` table with:
  | Field               | Value                                  |
  | recipe_data         | Copy of community recipe data          |
  | complexity_level    | Community recipe's complexity level    |
  | image_url           | Community recipe's image URL           |
  | is_saved            | true                                   |
  | created_at          | Current timestamp                      |

And I should see a success alert:
  | Field   | Value                                         |
  | Title   | "Saved!"                                      |
  | Message | "Recipe added to your My Recipes"             |
  | Buttons | "View My Recipes", "OK"                       |

When I tap "View My Recipes"
Then I should navigate to the Library tab
And I should see "Pad Thai" in my saved recipes
```

---

### @P1-high @community @save-from-community-limit-reached
### Scenario: Cannot save from community when free tier limit reached

```gherkin
Given I am logged in as a free tier user
And I have 3 saved recipes (limit reached)
And I am on the Discover tab
When I tap the "Save" button on any community recipe

Then I should see an alert:
  | Field   | Value                                                                                |
  | Title   | "Save Limit Reached"                                                                 |
  | Message | "You've reached the free limit of 3 saved recipes. Delete a recipe or upgrade to Premium for unlimited saves!" |
  | Buttons | "Maybe Later", "Upgrade"                                                             |

And the recipe should NOT be saved
And my saved recipe count should remain at 3
```

---

### @P0-critical @community @view-community-recipe
### Scenario: View community recipe detail

```gherkin
Given I am on the Discover tab
And I see a community recipe "Beef Bourguignon" with complexity level 3
When I tap on the "Beef Bourguignon" card

Then I should navigate to the recipe detail screen
And I should see the recipe at complexity level 3
And I should see the ingredients for level 3
And I should see the instructions for level 3
And I should see a "Save" button (to save to My Recipes)
And I should NOT see a "Share" button (already shared)
And I should NOT see a "Delete" button (not mine)
And I can change the complexity level using the slider
```

---

### @P2-medium @community @empty-discover
### Scenario: Discover tab when no community recipes exist

```gherkin
Given there are 0 community recipes in the database
When I navigate to the Discover tab

Then I should see the header "Discover"
And I should see an empty state with:
  | Element      | Content                             |
  | Icon         | Compass icon                        |
  | Title        | "No Community Recipes Yet!"         |
  | Subtitle     | "Share your recipes to get started" |

And I should NOT see any recipe cards
```

---

### @P2-medium @community @discover-refresh
### Scenario: Pull to refresh community recipes

```gherkin
Given I am on the Discover tab
And there are community recipes displayed
When I pull down on the screen to refresh

Then I should see a loading indicator
And the community recipes should be reloaded from the database
And I should see the updated list of recipes
And the newest recipes should appear at the top
```

---

### @P3-low @community @share-already-shared
### Scenario: Cannot share recipe that is already shared

```gherkin
Given I have a recipe "Chicken Curry"
And I have already shared "Chicken Curry" to the community
And I am on the recipe detail screen

Then the "Share" button should show "Shared"
And the "Share" button should be disabled
And I should NOT be able to share the same recipe again
```

---

### @P3-low @community @anonymous-sharing
### Scenario: Shared recipes are anonymous

```gherkin
Given I have shared a recipe "Caesar Salad" to the community
When another user views the Discover tab
And they see "Caesar Salad"

Then they should see the recipe card with:
  | Element         | Content              |
  | Recipe name     | "Caesar Salad"       |
  | Recipe image    | My uploaded image    |
  | Author name     | NOT SHOWN            |
  | Profile picture | NOT SHOWN            |

And there should be NO indication of who shared the recipe
# This ensures user privacy and anonymous community sharing
```

---

## Test Data

### Sample Community Recipes

**Recipe 1:**
```json
{
  "dish_name": "Thai Green Curry",
  "image_url": "https://storage.supabase.co/.../curry.jpg",
  "complexity_level": 2,
  "shared_by_user_id": "user-123",
  "created_at": "2025-01-18T10:30:00Z"
}
```

**Recipe 2:**
```json
{
  "dish_name": "Margherita Pizza",
  "image_url": null,
  "complexity_level": 1,
  "shared_by_user_id": "user-456",
  "created_at": "2025-01-18T09:15:00Z"
}
```

### Content Policy Version

```
Current version: 1.0
Acceptance required: true (one-time)
Stored in: legal_consents.content_policy
```

---

## Dependencies

- Supabase Database (`community_recipes`, `saved_recipes`, `legal_consents`)
- Supabase Storage (for recipe images)
- Network connectivity

---

## Notes

- Community sharing is completely anonymous
- `shared_by_user_id` is stored but never displayed to users
- Content Policy acceptance is required only once (first share)
- Users can share recipes from both saved and recent recipes
- Saving from community creates a copy in user's saved recipes
- Saved community recipes count toward user's save limit (free tier: 3)
- Community recipes are sorted by `created_at` descending (newest first)
- Discover tab shows 50 most recent community recipes initially
- Pull-to-refresh reloads the community feed
- Users cannot edit or delete community recipes (not even their own)
- Recipe images in community use same Supabase Storage URLs
- Placeholder icon shown when no image available
- Community recipes can be viewed at any complexity level (slider works)
- Sharing the same recipe twice is prevented (UI shows "Shared" disabled button)
- No user profiles or usernames are displayed in community
- Content Policy v1.0 prohibits inappropriate, offensive, or copyrighted content
