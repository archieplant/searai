# Feature: Subscription & In-App Purchases

## Description

This feature covers the monetization and subscription system:
- Free tier limits (5 analyses/month, 3 saved recipes)
- Premium tier benefits (unlimited everything)
- Paywall presentation and triggers
- In-app purchase flow (RevenueCat)
- Subscription verification
- Restore purchases functionality
- Premium status in profile

## Business Rules

**Free Tier Limits:**
- 5 recipe analyses per calendar month
- 3 saved recipes maximum
- Community sharing: allowed
- Community saving: allowed

**Premium Tier Benefits:**
- Unlimited recipe analyses
- Unlimited saved recipes
- Priority support
- Ad-free experience

**Subscription:**
- Managed via RevenueCat
- Monthly or annual pricing options
- Subscription status synced with backend
- Restores work across devices

---

## Background

```gherkin
Background:
  Given the app is installed and running
  And I have completed onboarding
  And the RevenueCat SDK is configured
  And the Supabase services are available
```

---

## Scenarios

### @P0-critical @subscription @paywall-analysis-limit
### Scenario: Paywall shown when free analysis limit reached

```gherkin
Given I am logged in as a free tier user
And I have used 5 analyses this month (limit reached)
When I navigate to the upload screen
And I enter a recipe
And I tap "Analyse Recipe"

Then I should see a brief loading indicator
And I should see an alert:
  | Field   | Value                                                                          |
  | Title   | "Analysis Limit Reached"                                                       |
  | Message | "You've reached the free limit of 5 analyses this month. Upgrade to Premium for unlimited analyses!" |
  | Buttons | "Maybe Later", "Upgrade"                                                       |

When I tap "Upgrade"
Then I should navigate to the paywall screen
And I should see the paywall with:
  | Element              | Content                                      |
  | Title                | "Upgrade to Premium"                         |
  | Free tier badge      | "Current Plan"                               |
  | Free tier limits     | "5 analyses/month, 3 saved recipes"          |
  | Premium badge        | "Upgrade"                                    |
  | Premium benefits     | "Unlimited analyses, Unlimited saved recipes"|
  | Purchase button      | "Start Premium - [PRICE]/month"              |
  | Restore button       | "Restore Purchases"                          |
  | Terms link           | "Terms of Service"                           |
  | Privacy link         | "Privacy Policy"                             |
```

---

### @P0-critical @subscription @paywall-save-limit
### Scenario: Paywall shown when free save limit reached

```gherkin
Given I am logged in as a free tier user
And I have 3 saved recipes (limit reached)
When I try to save a new recipe
And I tap the "Save" button

Then I should see an alert:
  | Field   | Value                                                                                |
  | Title   | "Save Limit Reached"                                                                 |
  | Message | "You've reached the free limit of 3 saved recipes. Delete a recipe or upgrade to Premium for unlimited saves!" |
  | Buttons | "Maybe Later", "Upgrade"                                                             |

When I tap "Upgrade"
Then I should navigate to the paywall screen
And I should see Premium benefits highlighted
```

---

### @P0-critical @subscription @purchase-flow
### Scenario: Complete in-app purchase to Premium

```gherkin
Given I am logged in as a free tier user
And I am on the paywall screen
And I have a valid payment method configured in App Store/Play Store

When I tap "Start Premium - £4.99/month"
Then the App Store/Play Store purchase modal should appear
And I should see:
  | Field           | Value                         |
  | Product name    | "Recipe Killer AI Premium"    |
  | Price           | "£4.99/month"                 |
  | Billing period  | "Renews monthly"              |

When I confirm the purchase with Face ID/Touch ID/Password
Then the purchase should be processed by RevenueCat
And my user record should be updated:
  | Field       | Value |
  | is_premium  | true  |
  | premium_since | Current timestamp |

And I should see a success alert:
  | Field   | Value                                             |
  | Title   | "Welcome to Premium!"                             |
  | Message | "You now have unlimited analyses and saved recipes." |
  | Button  | "Get Started"                                     |

When I tap "Get Started"
Then I should navigate back to where I came from
And I should see Premium badge in my profile
And I should have unlimited analyses
And I should have unlimited saved recipes
```

---

### @P0-critical @subscription @purchase-cancelled
### Scenario: User cancels purchase

```gherkin
Given I am on the paywall screen
When I tap "Start Premium"
And the App Store/Play Store modal appears
And I tap "Cancel"

Then the modal should close
And I should return to the paywall screen
And my subscription status should remain free tier
And no charge should occur
```

---

### @P1-high @subscription @restore-purchases
### Scenario: Restore previous purchase on new device

```gherkin
Given I previously purchased Premium on another device
And I am logged in on a new device
And I am currently showing as free tier
When I navigate to the paywall screen
And I tap "Restore Purchases"

Then RevenueCat should check for existing subscriptions
And I should see a loading indicator
And my subscription should be verified
And my user record should be updated:
  | Field      | Value |
  | is_premium | true  |

And I should see a success alert:
  | Field   | Value                                    |
  | Title   | "Purchase Restored!"                     |
  | Message | "Your Premium subscription is now active." |
  | Button  | "Continue"                               |

When I tap "Continue"
Then I should navigate back
And I should see Premium status in my profile
```

---

### @P1-high @subscription @restore-no-purchases
### Scenario: Restore purchases when no subscription exists

```gherkin
Given I am a free tier user
And I have never purchased Premium
When I am on the paywall screen
And I tap "Restore Purchases"

Then RevenueCat should check for subscriptions
And I should see a loading indicator
And I should see an info alert:
  | Field   | Value                                                |
  | Title   | "No Purchases Found"                                 |
  | Message | "We couldn't find any previous purchases to restore." |
  | Button  | "OK"                                                 |

And my subscription status should remain free tier
```

---

### @P1-high @subscription @premium-status-profile
### Scenario: View Premium status in Profile tab

```gherkin
Given I am logged in as a premium user
When I navigate to the Profile tab

Then I should see my profile with:
  | Field               | Value                   |
  | Subscription status | "Premium"               |
  | Badge               | Gold/Premium badge icon |
  | Subscription info   | "Active since [DATE]"   |

And I should see my usage stats:
  | Stat            | Value     |
  | Analyses        | Unlimited |
  | Saved recipes   | Unlimited |
```

---

### @P2-medium @subscription @free-tier-status-profile
### Scenario: View free tier status and limits in Profile

```gherkin
Given I am logged in as a free tier user
And I have used 3 analyses this month
And I have 2 saved recipes
When I navigate to the Profile tab

Then I should see my profile with:
  | Field               | Value                              |
  | Subscription status | "Free"                             |
  | Badge               | Standard badge or no badge         |

And I should see my usage stats:
  | Stat            | Value       |
  | Analyses        | "3 / 5"     |
  | Saved recipes   | "2 / 3"     |

And I should see an "Upgrade to Premium" button
When I tap "Upgrade to Premium"
Then I should navigate to the paywall screen
```

---

### @P2-medium @subscription @payment-error
### Scenario: Payment processing error

```gherkin
Given I am on the paywall screen
When I tap "Start Premium"
And the payment processing fails (network error, payment declined, etc.)

Then I should see an error alert:
  | Field   | Value                                                    |
  | Title   | "Purchase Failed"                                        |
  | Message | "There was a problem processing your payment. Please try again." |
  | Button  | "OK"                                                     |

And my subscription status should remain free tier
And no charge should occur
```

---

### @P3-low @subscription @terms-privacy-links
### Scenario: View Terms and Privacy from paywall

```gherkin
Given I am on the paywall screen
When I tap "Terms of Service"
Then I should see the Terms of Service document
And I should be able to navigate back to the paywall

When I tap "Privacy Policy"
Then I should see the Privacy Policy document
And I should be able to navigate back to the paywall
```

---

### @P3-low @subscription @paywall-close
### Scenario: Close paywall without purchasing

```gherkin
Given I am on the paywall screen
When I tap the back button or close button

Then I should navigate back to the previous screen
And my subscription status should remain free tier
And I should still be able to use free tier features
```

---

## Test Data

### Subscription Tiers

**Free Tier:**
```json
{
  "tier": "free",
  "monthly_analyses_limit": 5,
  "saved_recipes_limit": 3,
  "is_premium": false
}
```

**Premium Tier:**
```json
{
  "tier": "premium",
  "monthly_analyses_limit": null,
  "saved_recipes_limit": null,
  "is_premium": true,
  "premium_since": "2025-01-15T10:30:00Z"
}
```

### RevenueCat Product IDs

```
Monthly: rka_premium_monthly
Annual: rka_premium_annual (if implemented)
```

### Pricing (Example - UK)

```
Monthly: £4.99/month
Annual: £39.99/year (if implemented)
```

---

## Dependencies

- RevenueCat SDK (in-app purchase management)
- App Store / Google Play Store (payment processing)
- Supabase Database (`user_limits`, `user_profiles`)
- Valid payment method configured on device

---

## Notes

- Subscription status is managed by RevenueCat
- Backend verifies subscription with RevenueCat webhook
- Monthly analysis counter resets on 1st of each month (server-side)
- Premium users have `is_premium = true` in `user_limits` table
- Restore purchases works across iOS and Android (if using shared user account)
- Paywall is accessible from:
  - Analysis limit alert
  - Save limit alert
  - Profile tab "Upgrade" button
  - Settings (if implemented)
- Premium badge appears in profile and potentially in recipe sharing
- Free tier users can still use community features (share/save from community)
- No credit card required for free tier
- Premium subscription auto-renews unless cancelled
- Users can manage subscription in App Store/Play Store settings
