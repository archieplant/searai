# SearAI - BDD Test Suite

## Overview

This directory contains Behavior Driven Development (BDD) test specifications for the SearAI app. These tests are written in Gherkin syntax using Given/When/Then scenarios to document expected application behavior.

## Purpose

1. **Living Documentation**: Human-readable specifications of how the app should work
2. **Regression Prevention**: Reference for expected behavior when making changes
3. **AI Assistant Context**: Claude can reference these when making updates
4. **Manual Testing Checklist**: Can be used for manual QA testing
5. **Future Automation**: Foundation for automated test implementation

## Directory Structure

```
tests/
├── README.md                           # This file
├── features/                           # BDD feature files
│   ├── 01-onboarding.feature.md       # User signup, login, legal compliance
│   ├── 02-recipe-analysis.feature.md  # Core feature: upload & analyze
│   ├── 03-recipe-management.feature.md # Save, view, delete recipes
│   ├── 04-subscription.feature.md     # Free/premium limits, paywall
│   ├── 05-community.feature.md        # Share & discover recipes
│   ├── 06-profile.feature.md          # User profile & preferences
│   └── 07-edge-cases.feature.md       # Error handling & edge cases
└── reference/                          # Quick reference documentation
    ├── business-rules.md               # All limits, constraints, policies
    ├── data-models.md                  # Database schema reference
    └── user-flows.md                   # Visual journey maps
```

## How to Read Feature Files

### Gherkin Syntax

Feature files use Gherkin syntax with the following keywords:

- **Feature**: High-level description of functionality being tested
- **Background**: Common setup steps that apply to all scenarios
- **Scenario**: Individual test case
- **Given**: Pre-conditions (initial state)
- **When**: Action taken by user or system
- **Then**: Expected outcome
- **And**: Additional steps of the same type
- **But**: Negative assertion

### Example

```gherkin
Feature: User Login

Background:
  Given the app is installed
  And I have completed onboarding

Scenario: Successful login with valid credentials
  Given I am on the welcome screen
  And I have an account with email "test@example.com" and password "password123"
  When I click "Sign In"
  And I enter "test@example.com" in the email field
  And I enter "password123" in the password field
  And I click "Log In"
  Then I should be logged in
  And I should see the home screen
```

## Priority Tags

Scenarios are tagged with priority levels:

- **@P0-critical**: Must work for app to function (auth, core features)
- **@P1-high**: Important user flows (save, share, limits)
- **@P2-medium**: Secondary features (profile, library)
- **@P3-low**: Nice-to-have features (notifications, placeholders)

## Test Coverage

### Feature Files (60+ Scenarios)

1. **Onboarding** (12 scenarios)
   - New user signup with legal compliance
   - Returning user login
   - Onboarding navigation
   - Validation and error handling

2. **Recipe Analysis** (10 scenarios)
   - Image upload and analysis
   - Text paste and analysis
   - Dietary preference application
   - Free tier limit enforcement
   - Error handling

3. **Recipe Management** (8 scenarios)
   - Save recipes
   - View saved recipes
   - Delete recipes
   - Recent recipes auto-cleanup
   - Free tier limit enforcement

4. **Subscription** (8 scenarios)
   - Free tier limits
   - Paywall triggers
   - Purchase flow
   - Subscription verification
   - Restore purchases

5. **Community** (6 scenarios)
   - Share to community with Content Policy
   - Discover community recipes
   - Save from community
   - Anonymous sharing

6. **Profile** (6 scenarios)
   - View profile
   - Edit profile
   - Update dietary preferences
   - Avatar selection

7. **Edge Cases** (12+ scenarios)
   - Network failures
   - API errors
   - Permission denials
   - Invalid inputs
   - Concurrent operations

## How to Use This Test Suite

### For Manual Testing

1. Open a feature file (e.g., `01-onboarding.feature.md`)
2. Follow each scenario step-by-step
3. Verify expected outcomes match actual behavior
4. Document any deviations or bugs

### For Development

1. Reference scenarios before implementing features
2. Ensure implementation matches expected behavior
3. Update scenarios if requirements change
4. Add new scenarios for new features

### For AI Assistants (Claude)

When making changes to the app:

1. Review relevant feature files
2. Check business rules in `reference/business-rules.md`
3. Verify data models in `reference/data-models.md`
4. Ensure changes don't break documented scenarios
5. Update test files if behavior intentionally changes

### For Code Reviews

1. Compare implementation against scenarios
2. Verify edge cases are handled
3. Check that validation rules are enforced
4. Ensure error messages match specifications

## Business Rules Quick Reference

### Subscription Limits

**Free Tier:**
- 5 recipe analyses per calendar month
- 3 saved recipes maximum
- Community sharing allowed
- Community saving allowed

**Premium Tier:**
- Unlimited recipe analyses
- Unlimited saved recipes
- Priority support
- Ad-free experience

### Legal Compliance

**COPPA (Age Verification):**
- Users must be 13+ years old
- Age checkbox required before signup

**GDPR (Consent Tracking):**
- Terms of Service acceptance required (v1.0)
- Privacy Policy acceptance required (v1.0)
- Content Policy acceptance for community sharing (v1.0)
- All consents timestamped and versioned

### Recipe Analysis Rules

**Dietary Preferences:**
- Allergies = NEVER include (safety requirement)
- Dislikes = substitute when possible
- Diet types = strict adherence (no meat for vegetarian, etc.)

**Output Format:**
- British English spelling and terminology
- Metric measurements only (grams, ml, °C)
- 5 complexity levels generated (0-4)

### Data Retention

**Recent Recipes:**
- Maximum 3 stored
- Auto-delete oldest unsaved when limit exceeded

**Saved Recipes:**
- Free tier: 3 maximum
- Premium: unlimited

## Updating This Test Suite

### When to Update

1. **New features added**: Create new scenarios
2. **Business rules change**: Update relevant scenarios and reference docs
3. **Bugs fixed**: Add regression test scenario
4. **API contracts change**: Update integration scenarios
5. **UI changes**: Update navigation and interaction steps

### How to Update

1. Use clear, descriptive scenario titles
2. Follow Gherkin syntax
3. Keep steps atomic and testable
4. Use data tables for multiple test cases
5. Tag scenarios with appropriate priority
6. Update reference documentation if rules change

### Example of Adding a New Scenario

```gherkin
@P1-high @new-feature
Scenario: User shares recipe with custom note
  Given I am logged in
  And I have analyzed a recipe "Spaghetti Carbonara"
  And I have accepted the Content Policy
  When I navigate to the recipe detail screen
  And I click "Share to Community"
  And I enter "My grandmother's recipe!" in the note field
  And I click "Share"
  Then the recipe should be shared to the community
  And the recipe should include my custom note
  And I should see a success message "Shared to community!"
```

## Key Files Reference

### Critical Paths (Always Test)

1. `01-onboarding.feature.md` → User signup with legal compliance
2. `02-recipe-analysis.feature.md` → Core recipe analysis flow
3. `04-subscription.feature.md` → Free tier limit enforcement

### Integration Points

- OpenAI GPT-4o (vision + text analysis)
- Supabase (auth, database, storage)
- RevenueCat (in-app purchases)

### Database Schema

See `reference/data-models.md` for complete table schemas and relationships.

## Support

For questions or issues with the test suite:

1. Check `reference/business-rules.md` for rule clarification
2. Review `reference/user-flows.md` for journey visualization
3. Reference feature files for specific scenarios

## Version History

- **v1.0** (Initial release): Complete BDD test suite with 60+ scenarios covering all core features, edge cases, and compliance requirements.
