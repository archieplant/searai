# Feature: Recipe Management

## Description

This feature covers how users manage their recipes:
- Save recipes from recent recipes to "My Recipes"
- View saved recipes in the Library tab
- Delete saved recipes
- Free tier saved recipe limit (3 maximum)
- Premium tier unlimited saved recipes
- Recent recipes automatic cleanup
- Recipe detail view with complexity slider

## Business Rules

- **Free tier**: Maximum 3 saved recipes
- **Premium tier**: Unlimited saved recipes
- Recent recipes: Maximum 3 stored (unsaved)
- Recent recipes auto-delete oldest unsaved when limit exceeded
- Saved recipes are NEVER auto-deleted
- Recipes can be viewed at any of 5 complexity levels (0-4)
- Complexity level selection is persisted per recipe
- Deleting a saved recipe frees up a slot for free tier users

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

### @P0-critical @recipe-management @save
### Scenario: Save recipe from recent recipes to My Recipes

```gherkin
Given I am logged in as a free tier user
And I have 1 saved recipe (2 slots remaining)
And I have just analysed a recipe "Spaghetti Carbonara"
And I am on the recipe detail screen

When I tap the "Save" button
Then I should see a loading indicator on the button
And the recipe should be marked as saved in the database:
  | Field    | Value |
  | is_saved | true  |
And I should see the button change to "Saved" with a checkmark icon
And the button should be disabled

When I navigate to the Library tab "My Recipes"
Then I should see "Spaghetti Carbonara" in my saved recipes
And the count should show "2 recipes"
```

---

### @P0-critical @recipe-management @save-limit
### Scenario: Free tier cannot save more than 3 recipes

```gherkin
Given I am logged in as a free tier user
And I have 3 saved recipes (limit reached):
  | Recipe Name        | Saved Date |
  | Pasta Carbonara    | 2025-01-15 |
  | Chicken Curry      | 2025-01-16 |
  | Chocolate Cake     | 2025-01-17 |

When I analyse a new recipe "Beef Tacos"
And I am on the recipe detail screen
And I tap the "Save" button

Then I should see an alert with:
  | Field   | Value                                                                    |
  | Title   | "Save Limit Reached"                                                     |
  | Message | "You've reached the free limit of 3 saved recipes. Delete a recipe or upgrade to Premium for unlimited saves!" |
  | Buttons | "Maybe Later", "Upgrade"                                                 |

When I tap "Upgrade"
Then I should navigate to the paywall screen

When I return and tap "Maybe Later"
Then the recipe should NOT be saved
And I should remain on the recipe detail screen
And my saved recipe count should remain at 3
```

---

### @P1-high @recipe-management @premium-save
### Scenario: Premium user has unlimited saved recipes

```gherkin
Given I am logged in as a premium user
And I have 50 saved recipes
When I analyse a new recipe "Beef Wellington"
And I tap the "Save" button

Then the recipe should be saved successfully
And I should NOT see any limit warnings
And my saved recipe count should be 51
And I should see "Beef Wellington" in my Library
```

---

### @P0-critical @recipe-management @view-library
### Scenario: View saved recipes in Library tab

```gherkin
Given I am logged in
And I have 3 saved recipes:
  | Recipe Name        | Image URL                | Complexity Level |
  | Pasta Carbonara    | https://...carbonara.jpg | 2                |
  | Chicken Curry      | null                     | 1                |
  | Chocolate Cake     | https://...cake.jpg      | 3                |

When I navigate to the Library tab
Then I should see "My Recipes" as the header
And I should see "3 recipes" as the subtitle
And I should see a grid layout with 2 columns

And I should see the following recipe cards:
  | Recipe Name     | Has Image | Position |
  | Pasta Carbonara | Yes       | Top left |
  | Chicken Curry   | No        | Top right|
  | Chocolate Cake  | Yes       | Bottom   |

When I scroll down
Then I should be able to refresh by pulling down
And the recipes should reload
```

---

### @P0-critical @recipe-management @view-recipe-detail
### Scenario: View saved recipe from Library

```gherkin
Given I am on the Library tab
And I have a saved recipe "Chicken Tikka Masala" with complexity level 2
When I tap on "Chicken Tikka Masala"

Then I should navigate to the recipe detail screen
And I should see the recipe title "Chicken Tikka Masala"
And the complexity slider should be at level 2
And I should see the ingredients for level 2
And I should see the instructions for level 2
And I should see the "Saved" button (disabled, with checkmark)
And I should see the "View Full Recipe" button
```

---

### @P0-critical @recipe-management @delete
### Scenario: Delete saved recipe

```gherkin
Given I am logged in as a free tier user
And I have 3 saved recipes (limit reached)
And I am on the Library tab
When I tap on "Pasta Carbonara"
And I am on the recipe detail screen

When I tap the "Delete" button
Then I should see a confirmation alert:
  | Field   | Value                                                   |
  | Title   | "Delete Recipe?"                                        |
  | Message | "Are you sure you want to delete this recipe? This cannot be undone." |
  | Buttons | "Cancel", "Delete"                                      |

When I tap "Delete"
Then the recipe should be deleted from the database
And I should navigate back to the Library tab
And I should see "2 recipes" in the subtitle
And "Pasta Carbonara" should NOT appear in the list
And I should now have 1 available save slot (free tier)
```

---

### @P1-high @recipe-management @delete-cancel
### Scenario: Cancel recipe deletion

```gherkin
Given I am on the recipe detail screen for a saved recipe
When I tap the "Delete" button
And I see the confirmation alert
And I tap "Cancel"

Then the alert should close
And the recipe should NOT be deleted
And I should remain on the recipe detail screen
And the recipe should still appear in my Library
```

---

### @P1-high @recipe-management @complexity-switch
### Scenario: Change recipe complexity level

```gherkin
Given I am viewing a saved recipe "Beef Stroganoff"
And the complexity slider is at level 2
When I drag the slider to level 4

Then the ingredients should update to show level 4 ingredients
And the instructions should update to show level 4 instructions
And the recipe title should remain "Beef Stroganoff"
And the selected complexity should be saved to the database:
  | Field               | Value |
  | selected_complexity | 4     |

When I navigate away and return to this recipe
Then the slider should still be at level 4
And I should see the level 4 version of the recipe
```

---

### @P2-medium @recipe-management @empty-library
### Scenario: View empty Library when no saved recipes

```gherkin
Given I am logged in
And I have 0 saved recipes
When I navigate to the Library tab

Then I should see the header "My Recipes"
And I should see "0 recipes" in the subtitle
And I should see an empty state with:
  | Element      | Value                                    |
  | Icon         | Bookmark icon                            |
  | Title        | "No Saved Recipes Yet!"                  |
  | Subtitle     | "Save your favorite recipes to find them here" |
And I should NOT see any recipe cards
```

---

### @P2-medium @recipe-management @library-refresh
### Scenario: Pull to refresh Library

```gherkin
Given I am on the Library tab
And I have saved recipes
When I pull down on the screen to refresh

Then I should see a loading indicator
And the recipes should be reloaded from the database
And the recipe count should be updated
And I should see the refreshed recipe list
```

---

### @P3-low @recipe-management @share-recipe
### Scenario: Share recipe to community from recipe detail

```gherkin
Given I am viewing a saved recipe "Thai Green Curry"
And I have not yet shared this recipe to the community
When I tap the "Share" button

Then I should see the share to community modal
And I should see Content Policy acceptance checkbox
And I should be able to proceed with sharing
# (Full sharing flow covered in 05-community.feature.md)
```

---

## Test Data

### Sample Saved Recipes

**Recipe 1:**
```
Name: Classic Margherita Pizza
Complexity: 2
Image: Yes
Saved: 2025-01-15 10:30:00
```

**Recipe 2:**
```
Name: Beef Bourguignon
Complexity: 4
Image: No
Saved: 2025-01-16 14:20:00
```

**Recipe 3:**
```
Name: Caesar Salad
Complexity: 0
Image: Yes
Saved: 2025-01-17 09:15:00
```

### Database States

**Free tier with 1 saved recipe:**
```sql
user_limits:
  is_premium: false

saved_recipes (is_saved = true):
  count: 1
```

**Free tier at limit (3 saved):**
```sql
user_limits:
  is_premium: false

saved_recipes (is_saved = true):
  count: 3
```

**Premium user:**
```sql
user_limits:
  is_premium: true

saved_recipes (is_saved = true):
  count: unlimited
```

---

## Dependencies

- Supabase Database (`saved_recipes` table)
- Supabase Storage (for recipe images)
- AsyncStorage (for local caching)
- Network connectivity

---

## Notes

- Recipes are stored in `saved_recipes` table when `is_saved = true`
- Recent recipes are stored in `recent_recipes` table when `is_saved = false`
- Deleting a saved recipe permanently removes it from the database
- Complexity level changes are persisted per user per recipe
- Library displays recipes in reverse chronological order (newest first)
- Images have placeholder icons when no photo was uploaded
- Pull-to-refresh reloads recipes from the database
- Recipe cards show dish name and Save/Saved status
- "Saved" button is disabled with green checkmark when already saved
- "Save" button shows loading state during save operation
- Sharing recipes to community requires separate Content Policy acceptance
