# Feature: User Onboarding & Authentication

## Description

This feature covers the complete user onboarding journey including:
- Welcome screen interaction
- New user signup with legal compliance (COPPA + GDPR)
- Returning user login
- Onboarding flow navigation (How It Works, Personal Info, Preferences, Account Creation)
- Session persistence
- Authentication state management

## Business Rules

- Users must be 13+ years old (COPPA compliance)
- Terms of Service v1.0 acceptance required
- Privacy Policy v1.0 acceptance required
- Email must be valid format
- Password must be minimum 6 characters
- Onboarding completion tracked in AsyncStorage (`onboardingComplete_v2`)
- Session persists across app restarts

---

## Background

```gherkin
Background:
  Given the app is freshly installed
  And I have granted necessary permissions
  And the backend services are available
```

---

## Scenarios

### @P0-critical @new-user @legal-compliance
### Scenario: Complete new user signup with all legal requirements

```gherkin
Given I am on the welcome screen
And I have not completed onboarding
When I tap "Get Started"
Then I should see the onboarding modal
And I should see "How It Works" as the first step

When I view the "How It Works" screen
Then I should see 3 steps explained:
  | Step | Title          | Description                        |
  | 1    | Upload         | Take a photo or paste recipe       |
  | 2    | Slide          | Adjust complexity with slider      |
  | 3    | Save           | Save and share with community      |

When I tap "Next"
Then I should navigate to the "Personal Info" screen

When I enter the following personal information:
  | Field           | Value              |
  | First Name      | John               |
  | Last Name       | Smith              |
  | Referral Source | Instagram          |
And I tap "Next"
Then I should navigate to the "Preferences" screen

When I enter the following dietary preferences:
  | Field      | Value                        |
  | Allergies  | peanuts, shellfish           |
  | Dislikes   | mushrooms, blue cheese       |
  | Diet Type  | Pescatarian                  |
And I tap "Next"
Then I should navigate to the "Create Account" screen

# CRITICAL: Age verification MUST be checked BEFORE terms
When I try to check "I agree to the Terms of Service and Privacy Policy"
But I have not checked "I confirm I am 13 years or older"
Then the Terms checkbox should not become checked
And I should see validation feedback

When I check "I confirm I am 13 years or older"
And I check "I agree to the Terms of Service and Privacy Policy"
And I enter "john.smith@example.com" in the email field
And I enter "password123" in the password field
And I enter "password123" in the confirm password field
And I tap "Create Account"
Then I should see a loading indicator
And my account should be created in Supabase Auth
And my profile should be saved to `user_profiles` table with:
  | Field           | Value     |
  | first_name      | John      |
  | last_name       | Smith     |
  | referral_source | Instagram |
And my dietary preferences should be saved to `dietary_preferences` table with:
  | Field      | Value                  |
  | allergies  | ["peanuts", "shellfish"] |
  | dislikes   | ["mushrooms", "blue cheese"] |
  | diet_type  | Pescatarian            |
And my legal consents should be recorded in `legal_consents` table with:
  | Consent Type       | Accepted | Version |
  | age_verified       | true     | N/A     |
  | terms_accepted     | true     | 1.0     |
  | privacy_accepted   | true     | 1.0     |
And AsyncStorage should have `onboardingComplete_v2` set to 'true'
And I should be navigated to the home screen `/(tabs)`
And I should be logged in
```

---

### @P0-critical @new-user @validation
### Scenario: Signup validation - Age verification must be checked first

```gherkin
Given I am on the "Create Account" screen in onboarding
And I have not checked "I confirm I am 13 years or older"
When I attempt to check "I agree to the Terms of Service and Privacy Policy"
Then the checkbox should not become checked
And I should remain on the same step
But when I check "I confirm I am 13 years or older" first
And then I check "I agree to the Terms of Service and Privacy Policy"
Then both checkboxes should be checked
```

---

### @P0-critical @new-user @validation
### Scenario: Signup validation - Email format validation

```gherkin
Given I am on the "Create Account" screen in onboarding
And I have checked age verification and terms
When I enter "invalidemail" in the email field
And I tap "Create Account"
Then I should see an error message "Please enter a valid email address"
And the account should not be created
```

---

### @P0-critical @new-user @validation
### Scenario: Signup validation - Password minimum length

```gherkin
Given I am on the "Create Account" screen in onboarding
And I have checked age verification and terms
When I enter a valid email "test@example.com"
And I enter "12345" in the password field (5 characters)
And I tap "Create Account"
Then I should see an error message "Password must be at least 6 characters"
And the account should not be created
```

---

### @P0-critical @new-user @validation
### Scenario: Signup validation - Password mismatch

```gherkin
Given I am on the "Create Account" screen in onboarding
And I have checked age verification and terms
When I enter a valid email "test@example.com"
And I enter "password123" in the password field
And I enter "password456" in the confirm password field
And I tap "Create Account"
Then I should see an error message "Passwords do not match"
And the account should not be created
```

---

### @P1-high @new-user @navigation
### Scenario: Onboarding navigation - Back button on each step

```gherkin
Given I am in the onboarding flow
When I am on the "Personal Info" screen
And I tap the back button
Then I should navigate back to "How It Works"

When I am on the "Preferences" screen
And I tap the back button
Then I should navigate back to "Personal Info"

When I am on the "Create Account" screen
And I tap the back button
Then I should navigate back to "Preferences"

When I am on the "How It Works" screen
And I tap the back button
Then I should close the onboarding modal
And I should return to the welcome screen
```

---

### @P1-high @new-user @optional
### Scenario: Onboarding - Skip preferences step

```gherkin
Given I am on the "Preferences" screen in onboarding
And I have not entered any dietary preferences
When I tap "Skip"
Then I should navigate to the "Create Account" screen
And my dietary preferences should be null in the database
```

---

### @P0-critical @returning-user
### Scenario: Returning user login with valid credentials

```gherkin
Given I am on the welcome screen
And I have an existing account with email "john@example.com" and password "password123"
And I have completed onboarding previously
When I tap "Sign In"
Then I should see the login modal

When I enter "john@example.com" in the email field
And I enter "password123" in the password field
And I tap "Log In"
Then I should see a loading indicator
And I should be authenticated via Supabase Auth
And AsyncStorage should have `onboardingComplete_v2` set to 'true'
And I should be navigated to the home screen `/(tabs)`
And I should be logged in
And I should see my profile data
```

---

### @P0-critical @returning-user @validation
### Scenario: Login validation - Invalid credentials

```gherkin
Given I am on the login screen
When I enter "wrong@example.com" in the email field
And I enter "wrongpassword" in the password field
And I tap "Log In"
Then I should see an error message "Invalid email or password"
And I should remain on the login screen
And I should not be logged in
```

---

### @P1-high @returning-user @ui
### Scenario: Login - Password visibility toggle

```gherkin
Given I am on the login screen
When I enter "password123" in the password field
Then the password should be masked as "•••••••••••"

When I tap the "Show password" icon
Then the password should be visible as "password123"

When I tap the "Hide password" icon
Then the password should be masked again as "•••••••••••"
```

---

### @P1-high @navigation
### Scenario: Navigation between signup and login

```gherkin
Given I am on the welcome screen
When I tap "Sign In"
Then I should see the login modal

When I tap "Don't have an account? Sign up"
Then I should see the signup modal at "Create Account" step

When I tap "Already have an account? Log in"
Then I should see the login modal
```

---

### @P0-critical @session
### Scenario: Session persistence across app restarts

```gherkin
Given I am logged in as "john@example.com"
And I have completed onboarding
When I close the app completely
And I reopen the app
Then I should still be logged in
And I should see the home screen `/(tabs)`
And I should not see the welcome screen
```

---

### @P2-medium @error-handling
### Scenario: Signup fails due to existing email

```gherkin
Given there is an existing account with email "existing@example.com"
And I am on the "Create Account" screen in onboarding
When I complete all required fields with email "existing@example.com"
And I tap "Create Account"
Then I should see an error message "An account with this email already exists"
And the account should not be created
And I should remain on the "Create Account" screen
```

---

### @P2-medium @error-handling
### Scenario: Network failure during signup

```gherkin
Given I am on the "Create Account" screen in onboarding
And the network connection is lost
When I complete all required fields
And I tap "Create Account"
Then I should see an error message "Network error. Please check your connection and try again."
And the account should not be created
And I should remain on the "Create Account" screen
```

---

## Test Data

### Valid Test Users

```
Email: test.user@example.com
Password: TestPass123
First Name: Test
Last Name: User
Referral: App Store
```

### Invalid Test Cases

```
# Email validation
invalid-email          → Invalid
test@                  → Invalid
@example.com           → Invalid
test@example           → Invalid (no TLD)
test@example.com       → Valid

# Password validation
12345                  → Too short (5 chars)
123456                 → Valid (6 chars minimum)
```

---

## Dependencies

- Supabase Auth API
- AsyncStorage
- Database tables: `user_profiles`, `dietary_preferences`, `legal_consents`
- Network connectivity

---

## Notes

- Age verification MUST be checked before Terms acceptance (enforced in UI)
- All legal consents are versioned (currently v1.0)
- Onboarding flag is `onboardingComplete_v2` (incremented from v1)
- Session tokens are managed by Supabase Auth SDK
- Dietary preferences are optional (can skip that step)
- Personal info (first name, last name, referral) is required
