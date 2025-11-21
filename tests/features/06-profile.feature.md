# Feature: User Profile & Settings

## Description

This feature covers user profile management and settings:
- View user profile information
- Edit profile (name, referral source)
- Update dietary preferences (allergies, dislikes, diet type)
- View subscription status and usage stats
- Avatar/profile picture selection (placeholder functionality)
- Log out functionality

## Business Rules

**Profile Information:**
- First name: required during onboarding
- Last name: required during onboarding
- Email: cannot be changed (tied to authentication)
- Referral source: optional, set during onboarding
- Dietary preferences: optional, can be updated anytime

**Dietary Preferences:**
- Allergies: list of allergens (never included in recipes)
- Dislikes: list of ingredients (substituted when possible)
- Diet type: None, Vegetarian, Vegan, Pescatarian, Gluten-free, etc.
- Changes apply to all future recipe analyses

**Subscription Status:**
- Free tier: shows usage (analyses X/5, saved recipes X/3)
- Premium tier: shows "unlimited" for all limits
- Displays premium badge for premium users
- Shows "Upgrade to Premium" button for free tier users

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

### @P1-high @profile @view
### Scenario: View user profile

```gherkin
Given I am logged in with the following profile:
  | Field           | Value              |
  | First Name      | John               |
  | Last Name       | Smith              |
  | Email           | john@example.com   |
  | Referral Source | Instagram          |
  | Subscription    | Free               |
  | Analyses Used   | 3 / 5 this month   |
  | Saved Recipes   | 2 / 3              |

And I have the following dietary preferences:
  | Field      | Value                  |
  | Allergies  | peanuts, shellfish     |
  | Dislikes   | mushrooms, blue cheese |
  | Diet Type  | Pescatarian            |

When I navigate to the Profile tab

Then I should see the profile screen with:
  | Section             | Content                              |
  | Avatar              | Placeholder avatar image             |
  | Name                | "John Smith"                         |
  | Email               | "john@example.com"                   |
  | Subscription badge  | "Free" (or standard badge)           |
  | Usage stats         | "Analyses: 3 / 5", "Saved: 2 / 3"    |
  | Edit button         | "Edit Profile"                       |
  | Preferences button  | "Dietary Preferences"                |
  | Upgrade button      | "Upgrade to Premium"                 |
  | Logout button       | "Log Out"                            |
```

---

### @P1-high @profile @view-premium
### Scenario: View premium user profile

```gherkin
Given I am logged in as a premium user
And I have the following profile:
  | Field           | Value                   |
  | First Name      | Jane                    |
  | Last Name       | Doe                     |
  | Email           | jane@example.com        |
  | Subscription    | Premium                 |
  | Premium Since   | 2025-01-01              |

When I navigate to the Profile tab

Then I should see the profile screen with:
  | Section             | Content                          |
  | Avatar              | Placeholder avatar image         |
  | Name                | "Jane Doe"                       |
  | Email               | "jane@example.com"               |
  | Subscription badge  | "Premium" with gold badge icon   |
  | Subscription info   | "Active since Jan 1, 2025"       |
  | Usage stats         | "Analyses: Unlimited", "Saved: Unlimited" |
  | Edit button         | "Edit Profile"                   |
  | Preferences button  | "Dietary Preferences"            |

And I should NOT see "Upgrade to Premium" button
```

---

### @P1-high @profile @edit
### Scenario: Edit profile information

```gherkin
Given I am on the Profile tab
When I tap "Edit Profile"

Then I should see the edit profile screen with:
  | Field           | Current Value | Editable |
  | First Name      | "John"        | Yes      |
  | Last Name       | "Smith"       | Yes      |
  | Email           | "john@..."    | No       |
  | Referral Source | "Instagram"   | Yes      |

When I change the following fields:
  | Field           | New Value   |
  | First Name      | Jonathan    |
  | Last Name       | Smithson    |
  | Referral Source | App Store   |

And I tap "Save Changes"

Then my profile should be updated in the `user_profiles` table:
  | Field           | Value      |
  | first_name      | Jonathan   |
  | last_name       | Smithson   |
  | referral_source | App Store  |

And I should see a success message "Profile updated!"
And I should navigate back to the Profile tab
And I should see "Jonathan Smithson" as my name
```

---

### @P2-medium @profile @edit-validation
### Scenario: Profile edit validation

```gherkin
Given I am on the edit profile screen
When I clear the "First Name" field
And I tap "Save Changes"

Then I should see a validation error:
  | Field      | Error Message               |
  | First Name | "First name is required"    |

And the profile should NOT be updated
And I should remain on the edit profile screen

When I enter a valid first name "John"
And I tap "Save Changes"
Then the profile should be updated successfully
```

---

### @P0-critical @profile @dietary-preferences
### Scenario: Update dietary preferences

```gherkin
Given I am on the Profile tab
And my current dietary preferences are:
  | Field      | Value              |
  | Allergies  | peanuts            |
  | Dislikes   | mushrooms          |
  | Diet Type  | None               |

When I tap "Dietary Preferences"

Then I should see the dietary preferences screen with:
  | Field      | Current Value | Editable |
  | Allergies  | "peanuts"     | Yes      |
  | Dislikes   | "mushrooms"   | Yes      |
  | Diet Type  | "None"        | Yes      |

When I update the preferences:
  | Field      | New Value                    |
  | Allergies  | peanuts, shellfish, tree nuts|
  | Dislikes   | mushrooms, blue cheese, olives|
  | Diet Type  | Vegetarian                   |

And I tap "Save Changes"

Then my preferences should be updated in `dietary_preferences` table:
  | Field      | Value                                  |
  | allergies  | ["peanuts", "shellfish", "tree nuts"]  |
  | dislikes   | ["mushrooms", "blue cheese", "olives"] |
  | diet_type  | Vegetarian                             |

And I should see a success message "Preferences updated!"
And I should navigate back to the Profile tab

# Important: Future recipe analyses should use these new preferences
When I analyse a new recipe
Then the AI should respect my updated dietary preferences
And the recipe should be vegetarian
And the recipe should NOT contain peanuts, shellfish, or tree nuts
```

---

### @P1-high @profile @dietary-preferences-clear
### Scenario: Clear dietary preferences

```gherkin
Given I am on the dietary preferences screen
And I have existing dietary preferences
When I clear all fields:
  | Field      | New Value |
  | Allergies  | (empty)   |
  | Dislikes   | (empty)   |
  | Diet Type  | None      |

And I tap "Save Changes"

Then my preferences should be updated to null/empty:
  | Field      | Value |
  | allergies  | []    |
  | dislikes   | []    |
  | diet_type  | null  |

And future recipe analyses should have no dietary restrictions
```

---

### @P0-critical @profile @logout
### Scenario: Log out from profile

```gherkin
Given I am logged in
And I am on the Profile tab
When I tap "Log Out"

Then I should see a confirmation alert:
  | Field   | Value                                |
  | Title   | "Log Out?"                           |
  | Message | "Are you sure you want to log out?"  |
  | Buttons | "Cancel", "Log Out"                  |

When I tap "Log Out"
Then I should be logged out of Supabase Auth
And my session should be cleared
And I should navigate to the welcome screen
And I should see "Get Started" and "Sign In" buttons
```

---

### @P1-high @profile @logout-cancel
### Scenario: Cancel logout

```gherkin
Given I am on the Profile tab
When I tap "Log Out"
And I see the confirmation alert
And I tap "Cancel"

Then the alert should close
And I should remain logged in
And I should remain on the Profile tab
And my session should be preserved
```

---

### @P2-medium @profile @upgrade-navigation
### Scenario: Navigate to paywall from profile

```gherkin
Given I am logged in as a free tier user
And I am on the Profile tab
When I tap "Upgrade to Premium"

Then I should navigate to the paywall screen
And I should see Premium subscription options
And I should be able to purchase or go back
```

---

### @P3-low @profile @avatar-placeholder
### Scenario: Avatar is placeholder (future feature)

```gherkin
Given I am on the Profile tab
Then I should see a placeholder avatar image
# Note: Avatar upload/selection is not yet implemented
# This is a placeholder for future functionality
```

---

## Test Data

### Profile Examples

**Free Tier User:**
```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@example.com",
  "referral_source": "Instagram",
  "is_premium": false,
  "analyses_this_month": 3,
  "saved_recipes_count": 2
}
```

**Premium User:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "referral_source": "Friend",
  "is_premium": true,
  "premium_since": "2025-01-01T00:00:00Z"
}
```

### Dietary Preferences Examples

**Vegetarian with Allergies:**
```json
{
  "allergies": ["peanuts", "tree nuts"],
  "dislikes": ["mushrooms", "olives"],
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

**No Restrictions:**
```json
{
  "allergies": [],
  "dislikes": [],
  "diet_type": null
}
```

---

## Dependencies

- Supabase Database (`user_profiles`, `dietary_preferences`, `user_limits`)
- Supabase Auth (for logout)
- Network connectivity

---

## Notes

- Email cannot be changed (managed by Supabase Auth)
- Dietary preferences apply to ALL future recipe analyses
- Changes to dietary preferences do NOT retroactively update existing recipes
- Free tier users see usage stats (X / limit)
- Premium users see "Unlimited" for all limits
- Premium badge is a visual indicator (gold/special icon)
- Logout clears local session and returns to welcome screen
- Profile edits are saved to `user_profiles` table
- Dietary preferences are saved to `dietary_preferences` table
- Avatar is currently a placeholder (upload not implemented)
- Referral source is optional and can be changed
- First name and last name are required fields
- Profile screen accessible via bottom tab navigation
- All profile changes require network connection
- Validation errors are shown inline on forms
- Success messages are shown as toasts or alerts
- Profile changes sync immediately to backend
