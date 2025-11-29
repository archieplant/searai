# Feature: Recipe Analysis

## Description

This feature covers the core functionality of the Recipe Killer AI app:
- Upload recipe via photo (camera or library)
- Paste recipe as text
- AI-powered recipe analysis using OpenAI GPT-4o
- Apply user dietary preferences (allergies, dislikes, diet type)
- Generate 5 complexity levels (0-4)
- Free tier limit enforcement (5 analyses per calendar month)
- Store results in recent_recipes table
- Navigate to recipe detail view

## Business Rules

- Free tier: 5 recipe analyses per calendar month
- Premium tier: Unlimited analyses
- Dietary preferences are applied to all complexity levels:
  - **Allergies**: NEVER include (safety requirement)
  - **Dislikes**: Substitute when possible
  - **Diet types**: Strict adherence (e.g., no meat for vegetarian)
- Output format: British English, metric measurements
- Recent recipes: Maximum 3 stored, oldest auto-deleted when exceeded
- Analysis requires either image OR text input (or both)
- Images are uploaded to Supabase Storage
- Recipe data stored as JSONB in database

Note: This app was previously known as Recipe Killer AI and is now called SearAI.

---

## Background

```gherkin
Background:
  Given I am logged in as a user
  And I have completed onboarding
  And the OpenAI API is available
  And the Supabase services are available
```

---

## Scenarios

### @P0-critical @recipe-analysis @image
### Scenario: Analyse recipe from photo with camera

```gherkin
Given I am on the home screen
And I have camera permissions granted
And I have 2 analyses remaining this month (free tier)
When I tap the large "Analyse Recipe" button
Then I should navigate to the upload screen

When I tap "Take Photo"
Then the camera should open
When I take a photo of a recipe
And I tap "Use Photo"
Then the photo should be selected
And I should see "Photo selected" with a green checkmark

When I tap "Analyse Recipe"
Then I should see the analysis loading screen with:
  | Element                    | Status  |
  | Progress indicator         | visible |
  | "Analysing your recipe..." | visible |
  | Loading animation          | visible |
And the OpenAI API should receive the photo for vision analysis
And the AI should extract:
  | Data                | Example                          |
  | Dish name           | "Classic Spaghetti Carbonara"    |
  | Ingredients         | List of ingredients with amounts |
  | Cooking time        | "30 minutes"                     |
  | Dietary info        | Allergens, cuisine type          |
And the AI should generate 5 complexity levels (0-4)
And each level should have British English and metric measurements

When analysis completes
Then my analysis count should be incremented to 3
And the recipe should be saved to `recent_recipes` table with:
  | Field               | Value                                      |
  | user_id             | current user's ID                          |
  | recipe_data         | Full JSONB recipe with 5 complexity levels |
  | selected_complexity | 2 (default mid-level)                      |
  | image_url           | Supabase Storage URL                       |
  | created_at          | Current timestamp                          |
And I should navigate to the recipe detail screen
And I should see the recipe with complexity level 2 selected
And I should see my uploaded photo
```

---

### @P0-critical @recipe-analysis @text
### Scenario: Analyse recipe from pasted text

```gherkin
Given I am on the upload screen
And I have 1 analysis remaining this month (free tier)
When I paste the following recipe text:
  """
  Chocolate Chip Cookies

  Ingredients:
  - 200g butter
  - 150g sugar
  - 2 eggs
  - 300g flour
  - 200g chocolate chips

  Instructions:
  1. Cream butter and sugar
  2. Add eggs and mix
  3. Fold in flour and chocolate chips
  4. Bake at 180°C for 12 minutes
  """
And I tap "Analyse Recipe"
Then I should see the analysis loading screen
And the OpenAI API should receive the text for analysis
And the AI should generate 5 complexity levels

When analysis completes
Then my analysis count should be incremented to 5 (limit reached)
And the recipe should be saved to `recent_recipes` without an image
And I should navigate to the recipe detail screen
And I should see the recipe "Chocolate Chip Cookies"
And I should NOT see an uploaded photo (placeholder instead)
```

---

### @P0-critical @recipe-analysis @dietary-preferences
### Scenario: Apply dietary preferences during recipe analysis

```gherkin
Given I am logged in with the following dietary preferences:
  | Preference | Value                    |
  | Allergies  | peanuts, shellfish       |
  | Dislikes   | mushrooms, blue cheese   |
  | Diet Type  | Vegetarian               |
And I am on the upload screen
And I have analyses remaining this month

When I paste a recipe containing:
  """
  Thai Peanut Noodles with Shrimp
  - Rice noodles
  - Shrimp
  - Peanut sauce
  - Mushrooms
  - Vegetables
  """
And I tap "Analyse Recipe"

Then the AI should:
  | Action                             | Result                                          |
  | Remove allergies (peanuts)         | Replace peanut sauce with alternative           |
  | Remove allergies (shellfish/shrimp)| Replace shrimp with tofu/tempeh                 |
  | Substitute dislikes (mushrooms)    | Replace mushrooms with alternative vegetables   |
  | Apply diet type (vegetarian)       | Ensure no meat/fish in any complexity level     |

And I should see the modified recipe "Thai Noodles with Tofu"
And all 5 complexity levels should be vegetarian
And NO complexity level should contain peanuts or shellfish
And mushrooms should be substituted in all levels
```

---

### @P0-critical @recipe-analysis @free-tier-limit
### Scenario: Free tier analysis limit reached

```gherkin
Given I am logged in as a free tier user
And I have used 5 analyses this calendar month (limit reached)
When I navigate to the upload screen
And I enter a recipe (photo or text)
And I tap "Analyse Recipe"

Then I should see the analysis loading screen briefly
And the analysis should be stopped
And I should see an alert with:
  | Field   | Value                                                                |
  | Title   | "Analysis Limit Reached"                                             |
  | Message | "You've reached the free limit of 5 analyses this month. Upgrade to Premium for unlimited analyses!" |
  | Buttons | "Maybe Later", "Upgrade"                                             |

When I tap "Upgrade"
Then I should navigate to the paywall screen
And I should see Premium benefits

When I tap back and try again
And I tap "Maybe Later"
Then I should remain on the upload screen
And no analysis should be performed
And my analysis count should remain at 5
And no recipe should be saved to `recent_recipes`
```

---

### @P1-high @recipe-analysis @premium
### Scenario: Premium user has unlimited analyses

```gherkin
Given I am logged in as a premium user
And I have used 50 analyses this calendar month
When I navigate to the upload screen
And I enter a recipe
And I tap "Analyse Recipe"

Then the analysis should proceed normally
And I should NOT see any limit warnings
And my analysis count should be incremented to 51
And the recipe should be saved successfully
```

---

### @P1-high @recipe-analysis @recent-cleanup
### Scenario: Recent recipes auto-cleanup when limit exceeded

```gherkin
Given I am logged in
And I have 3 recent recipes (maximum):
  | Recipe Name        | Created At          | Saved |
  | Pasta Carbonara    | 2025-01-15 10:00:00 | No    |
  | Chicken Curry      | 2025-01-16 12:00:00 | No    |
  | Chocolate Cake     | 2025-01-17 14:00:00 | No    |

When I analyse a new recipe "Beef Tacos"
Then the oldest unsaved recipe should be deleted:
  | Deleted Recipe  | Pasta Carbonara |
And I should have 3 recent recipes:
  | Recipe Name    | Status |
  | Chicken Curry  | Recent |
  | Chocolate Cake | Recent |
  | Beef Tacos     | Recent |
```

---

### @P1-high @recipe-analysis @recent-cleanup-skip-saved
### Scenario: Recent recipes cleanup skips saved recipes

```gherkin
Given I am logged in as a free tier user (3 saved recipes max)
And I have 3 recent recipes:
  | Recipe Name        | Created At          | Saved |
  | Pasta Carbonara    | 2025-01-15 10:00:00 | Yes   |
  | Chicken Curry      | 2025-01-16 12:00:00 | No    |
  | Chocolate Cake     | 2025-01-17 14:00:00 | No    |

When I analyse a new recipe "Beef Tacos"
Then the oldest UNSAVED recipe should be deleted:
  | Deleted Recipe  | Chicken Curry |
And the saved recipe should be preserved:
  | Preserved Recipe | Pasta Carbonara |
And I should have 3 recent recipes:
  | Recipe Name        | Saved Status |
  | Pasta Carbonara    | Saved (kept) |
  | Chocolate Cake     | Unsaved      |
  | Beef Tacos         | Unsaved      |
```

---

### @P2-medium @recipe-analysis @validation
### Scenario: Analysis fails when no input provided

```gherkin
Given I am on the upload screen
And I have NOT uploaded a photo
And I have NOT entered any text
When I tap "Analyse Recipe"

Then I should see an alert with:
  | Field   | Value                                                   |
  | Title   | "Input Required"                                        |
  | Message | "Please upload a photo or paste a recipe to analyse."  |
  | Button  | "OK"                                                    |
And no analysis should be performed
And I should remain on the upload screen
And the "Analyse Recipe" button should be disabled/dimmed
```

---

### @P2-medium @recipe-analysis @error-openai-failure
### Scenario: OpenAI API failure during analysis

```gherkin
Given I am on the upload screen
And I have entered a valid recipe
And the OpenAI API is experiencing issues
When I tap "Analyse Recipe"

Then I should see the analysis loading screen
And after the API timeout
I should see an alert with:
  | Field   | Value                                              |
  | Title   | "Analysis Failed"                                  |
  | Message | "Failed to analyse recipe. Please try again."      |
  | Button  | "OK"                                               |
And my analysis count should NOT be incremented
And no recipe should be saved to `recent_recipes`
And I should return to the upload screen with my input preserved
```

---

### @P2-medium @recipe-analysis @error-network-failure
### Scenario: Network failure during recipe upload

```gherkin
Given I am on the upload screen
And I have taken a photo of a recipe
And the network connection is lost
When I tap "Analyse Recipe"

Then I should see the analysis loading screen
And after detecting the network error
I should see an alert with:
  | Field   | Value                                                              |
  | Title   | "Analysis Failed"                                                  |
  | Message | "Network error. Please check your connection and try again."       |
  | Button  | "OK"                                                               |
And my analysis count should NOT be incremented
And the photo should remain selected on the upload screen
```

---

### @P3-low @recipe-analysis @permissions
### Scenario: Camera permission denied

```gherkin
Given I am on the upload screen
And I have NOT granted camera permissions
When I tap "Take Photo"

Then I should see an alert with:
  | Field   | Value                                                              |
  | Title   | "Permissions Required"                                             |
  | Message | "Camera and photo library access are needed to upload recipe photos." |
  | Button  | "OK"                                                               |
And the camera should NOT open
And I should remain on the upload screen
```

---

### @P3-low @recipe-analysis @image-quality
### Scenario: Analyse recipe with edited photo

```gherkin
Given I am on the upload screen
When I tap "Choose Photo"
And I select a photo from my library
Then the image editor should open with:
  | Option      | Available |
  | Crop        | Yes       |
  | Aspect 4:3  | Yes       |
And I can adjust the photo crop

When I tap "Choose"
Then the edited photo should be selected
And I should see "Photo selected"

When I tap "Analyse Recipe"
Then the edited/cropped photo should be sent to OpenAI
And the analysis should complete successfully
```

---

## Test Data

### Valid Recipe Examples

**Text Recipe (Simple):**
```
Scrambled Eggs

Ingredients:
- 2 eggs
- 1 tablespoon butter
- Salt and pepper

Instructions:
1. Crack eggs into bowl
2. Whisk with salt and pepper
3. Melt butter in pan
4. Pour eggs and stir until cooked
```

**Text Recipe (Complex):**
```
Beef Wellington

Ingredients:
- 800g beef fillet
- 300g mushroom duxelles
- 6 slices Parma ham
- 500g puff pastry
- 2 egg yolks

Instructions:
[Full detailed instructions...]
```

### Expected AI Output Structure

```json
{
  "dishName": "Classic Spaghetti Carbonara",
  "originalServings": 4,
  "cookingTime": "30 minutes",
  "cuisine": "Italian",
  "complexityLevels": [
    {
      "level": 0,
      "title": "Ultra Simple",
      "ingredients": [...],
      "instructions": [...]
    },
    // ... levels 1-4
  ]
}
```

---

## Dependencies

- OpenAI GPT-4o API (vision + text)
- Supabase Storage (image uploads)
- Supabase Database (`recent_recipes`, `dietary_preferences`, `user_limits`)
- Expo ImagePicker (camera and photo library)
- Network connectivity
- Camera and photo library permissions

---

## Notes

- Analysis loading screen shows progress animation and motivational text
- Recipe data includes nutritional info when detectable
- All measurements converted to metric (grams, ml, °C)
- British English spelling enforced (e.g., "flavour" not "flavor")
- Default complexity level is 2 (mid-level) after analysis
- Images are compressed to 0.8 quality before upload
- Recipe analysis uses both vision (image) and text understanding
- Dietary preferences are retrieved from database before sending to AI
- Free tier monthly limit resets on 1st of each month
- Premium tier has no monthly analysis limits
