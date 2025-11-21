# Feature: Edge Cases & Error Handling

## Description

This feature covers edge cases, error scenarios, and exceptional situations:
- Network failures during various operations
- API errors (OpenAI, Supabase)
- Permission denials (camera, photo library)
- Invalid or malformed data
- Concurrent operations and race conditions
- Session expiration
- Storage errors
- Rate limiting
- Offline mode handling

## Business Rules

**Error Handling Principles:**
- User-friendly error messages (no technical jargon)
- Clear recovery instructions
- Preserve user data when possible
- Log errors for debugging
- Graceful degradation where appropriate
- Retry mechanisms for transient failures

---

## Background

```gherkin
Background:
  Given I am logged in as a user
  And I have completed onboarding
```

---

## Scenarios

### @P0-critical @edge-cases @network-failure-analysis
### Scenario: Network failure during recipe analysis

```gherkin
Given I am on the upload screen
And I have entered a valid recipe
And the network connection is available
When I tap "Analyse Recipe"
And the network connection is lost during the API call

Then I should see the analysis loading screen
And after the network timeout
I should see an error alert:
  | Field   | Value                                                        |
  | Title   | "Analysis Failed"                                            |
  | Message | "Network error. Please check your connection and try again." |
  | Button  | "OK"                                                         |

And my analysis count should NOT be incremented
And no recipe should be saved to the database
And I should return to the upload screen
And my input (photo or text) should be preserved
```

---

### @P0-critical @edge-cases @network-failure-login
### Scenario: Network failure during login

```gherkin
Given I am on the login screen
And I have entered valid credentials
And the network connection is lost
When I tap "Log In"

Then I should see a loading indicator briefly
And I should see an error alert:
  | Field   | Value                                                        |
  | Title   | "Login Failed"                                               |
  | Message | "Network error. Please check your connection and try again." |
  | Button  | "OK"                                                         |

And I should NOT be logged in
And I should remain on the login screen
And my credentials should be preserved in the form
```

---

### @P0-critical @edge-cases @openai-api-error
### Scenario: OpenAI API returns an error

```gherkin
Given I am on the upload screen
And I have entered a valid recipe
And the OpenAI API is experiencing issues (500 error)
When I tap "Analyse Recipe"

Then I should see the analysis loading screen
And after detecting the API error
I should see an error alert:
  | Field   | Value                                              |
  | Title   | "Analysis Failed"                                  |
  | Message | "Failed to analyse recipe. Please try again."      |
  | Button  | "OK"                                               |

And my analysis count should NOT be incremented
And I should return to the upload screen with my input preserved
```

---

### @P0-critical @edge-cases @openai-timeout
### Scenario: OpenAI API timeout

```gherkin
Given I am on the upload screen
And I have entered a very complex recipe
And the OpenAI API is slow to respond (>60 seconds)
When I tap "Analyse Recipe"

Then I should see the analysis loading screen
And after 60 seconds
I should see an error alert:
  | Field   | Value                                                |
  | Title   | "Analysis Timeout"                                   |
  | Message | "The analysis took too long. Please try again."      |
  | Button  | "OK"                                                 |

And my analysis count should NOT be incremented
```

---

### @P1-high @edge-cases @session-expired
### Scenario: Session expires while using app

```gherkin
Given I am logged in
And I am on the home screen
And my session token has expired (e.g., after 7 days)
When I navigate to any protected screen
Or I try to perform any authenticated action

Then I should see an alert:
  | Field   | Value                                             |
  | Title   | "Session Expired"                                 |
  | Message | "Your session has expired. Please log in again." |
  | Button  | "Log In"                                          |

When I tap "Log In"
Then I should be logged out
And I should navigate to the welcome screen
And I should be able to log in again
```

---

### @P1-high @edge-cases @supabase-database-error
### Scenario: Supabase database error when saving recipe

```gherkin
Given I have just analysed a recipe successfully
And the Supabase database is experiencing issues
When the app attempts to save the recipe to `recent_recipes`

Then I should see an error alert:
  | Field   | Value                                                   |
  | Title   | "Save Failed"                                           |
  | Message | "Failed to save recipe. Please try again."              |
  | Button  | "OK"                                                    |

And I should remain on the upload screen
And I should be able to retry the analysis
```

---

### @P2-medium @edge-cases @storage-upload-failure
### Scenario: Image upload to Supabase Storage fails

```gherkin
Given I have taken a photo of a recipe
And Supabase Storage is experiencing issues
When I tap "Analyse Recipe"
And the app attempts to upload the image

Then the analysis should proceed without the image
Or I should see an error alert:
  | Field   | Value                                                    |
  | Title   | "Upload Failed"                                          |
  | Message | "Failed to upload image. Continuing without photo."      |
  | Button  | "OK"                                                     |

And the recipe should be analysed (if OpenAI API succeeds)
And the recipe should be saved without an image URL
```

---

### @P2-medium @edge-cases @camera-permission-denied
### Scenario: Camera permission denied after initial grant

```gherkin
Given I am on the upload screen
And I previously granted camera permissions
And the user has now revoked camera permissions in device settings
When I tap "Take Photo"

Then I should see an alert:
  | Field   | Value                                                              |
  | Title   | "Camera Access Denied"                                             |
  | Message | "Please enable camera access in Settings to take photos."          |
  | Buttons | "Cancel", "Open Settings"                                          |

When I tap "Open Settings"
Then the device Settings app should open to app permissions
```

---

### @P2-medium @edge-cases @photo-library-permission-denied
### Scenario: Photo library permission denied

```gherkin
Given I am on the upload screen
And I have not granted photo library permissions
When I tap "Choose Photo"

Then I should see an alert:
  | Field   | Value                                                              |
  | Title   | "Permissions Required"                                             |
  | Message | "Camera and photo library access are needed to upload recipe photos." |
  | Button  | "OK"                                                               |

And the photo picker should NOT open
And I should remain on the upload screen
```

---

### @P2-medium @edge-cases @malformed-recipe-data
### Scenario: OpenAI returns malformed or incomplete recipe data

```gherkin
Given I am analysing a recipe
And OpenAI returns incomplete JSON (missing required fields)
When the app attempts to parse the recipe data

Then I should see an error alert:
  | Field   | Value                                                 |
  | Title   | "Analysis Failed"                                     |
  | Message | "Received invalid recipe data. Please try again."     |
  | Button  | "OK"                                                  |

And my analysis count should NOT be incremented
And no recipe should be saved
And I should return to the upload screen
```

---

### @P2-medium @edge-cases @concurrent-save-operations
### Scenario: User rapidly taps Save button multiple times

```gherkin
Given I am on the recipe detail screen
And the recipe is not yet saved
When I rapidly tap the "Save" button 5 times in 1 second

Then only ONE save operation should be performed
And the recipe should be saved exactly once to the database
And I should see the success message once
And the button should immediately become disabled after first tap
And subsequent taps should be ignored
```

---

### @P2-medium @edge-cases @rapid-analysis-requests
### Scenario: User rapidly requests multiple analyses

```gherkin
Given I am on the upload screen
And I have 2 analyses remaining (free tier)
When I enter a recipe
And I tap "Analyse Recipe"
And I immediately tap back and try to analyse another recipe

Then the first analysis should complete
And the second analysis should NOT start until the first finishes
Or the second analysis should queue after the first
And my analysis count should increment correctly (no race condition)
```

---

### @P3-low @edge-cases @invalid-image-file
### Scenario: User selects an invalid or corrupted image file

```gherkin
Given I am on the upload screen
When I attempt to upload a corrupted or invalid image file

Then I should see an error alert:
  | Field   | Value                                                 |
  | Title   | "Invalid Image"                                       |
  | Message | "The selected file is not a valid image. Please try another." |
  | Button  | "OK"                                                  |

And the image should NOT be uploaded
And I should remain on the upload screen
```

---

### @P3-low @edge-cases @extremely-long-recipe-text
### Scenario: User pastes extremely long recipe text (>10000 characters)

```gherkin
Given I am on the upload screen
When I paste a recipe text that is 15000 characters long

Then the text should be accepted into the input field
And when I tap "Analyse Recipe"
The text should be sent to OpenAI (may be truncated by OpenAI)
Or I should see a warning:
  | Field   | Value                                                      |
  | Title   | "Recipe Too Long"                                          |
  | Message | "Please shorten your recipe to under 10,000 characters."   |
  | Button  | "OK"                                                       |
```

---

### @P3-low @edge-cases @empty-community-save
### Scenario: Attempt to save community recipe that no longer exists

```gherkin
Given I am on the Discover tab
And I see a community recipe "Deleted Recipe"
And another user has deleted this recipe from the database
When I tap the "Save" button

Then I should see an error alert:
  | Field   | Value                                                 |
  | Title   | "Recipe Not Found"                                    |
  | Message | "This recipe is no longer available."                 |
  | Button  | "OK"                                                  |

And the recipe should NOT be saved to my recipes
And the Discover tab should refresh to remove the deleted recipe
```

---

### @P3-low @edge-cases @offline-mode
### Scenario: App behavior when completely offline

```gherkin
Given I am logged in
And I have previously loaded some data
And the device goes completely offline (airplane mode)

When I navigate to the Library tab
Then I should see my cached saved recipes (if available)
Or I should see an error message about network unavailability

When I try to analyse a new recipe
Then I should see a clear error message:
  | Field   | Value                                                        |
  | Title   | "No Internet Connection"                                     |
  | Message | "Please connect to the internet to analyse recipes."         |
  | Button  | "OK"                                                         |

When I try to share a recipe to community
Then I should see a similar network error message

When I try to view the Discover tab
Then I should see a network error or cached data
```

---

### @P3-low @edge-cases @purchase-interrupted
### Scenario: In-app purchase interrupted by phone call

```gherkin
Given I am on the paywall screen
And I have initiated a purchase
And I receive a phone call during the purchase flow

When I answer the phone call
And return to the app after the call

Then the purchase should either complete successfully
Or I should see the paywall screen again with no partial purchase
And I should be able to retry the purchase
Or I should be able to "Restore Purchases" to verify completion
```

---

## Test Data

### Network Error Scenarios

```
Connection timeout: 30 seconds
Connection lost: mid-request
API returns 500: Internal Server Error
API returns 503: Service Unavailable
API returns 429: Rate Limit Exceeded
```

### Invalid Data Examples

**Malformed JSON:**
```json
{
  "dishName": "Pasta",
  "complexityLevels": [
    // Missing required fields
  ]
}
```

**Missing Required Fields:**
```json
{
  // Missing dishName
  "complexityLevels": []
}
```

---

## Dependencies

- Network connectivity
- OpenAI API reliability
- Supabase services reliability
- Device permissions
- Storage availability
- RevenueCat service

---

## Notes

- All errors should display user-friendly messages
- Technical error details should be logged (but not shown to user)
- Network errors should allow retry without data loss
- Permissions should be requested at appropriate times
- Session expiration should be handled gracefully
- Concurrent operations should be prevented or queued
- Invalid data should be caught and reported clearly
- Offline mode should provide helpful guidance
- Error logging should include enough context for debugging
- Critical errors (auth, payment) should have escalation paths
- Recovery from errors should be as seamless as possible
- User input should be preserved during error recovery
- Loading states should have reasonable timeouts
- Button states should prevent double-submission
- Race conditions should be prevented with proper locking/queuing
