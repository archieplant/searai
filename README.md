# SearAI

AI-powered recipe analysis and simplification app built with React Native and Expo.

## About SearAI

SearAI transforms any recipe into simplified versions tailored to your skill level and dietary preferences.

## Overview

SearAI transforms any recipe into simplified versions tailored to your skill level. Upload a photo or paste text, and get 5 complexity levels (from beginner to expert) with dietary preferences applied.

## Features

- **AI Recipe Analysis**: Upload photos or paste recipes for GPT-4 Vision powered analysis
- **5 Complexity Levels**: Get recipes from Level 1 (Ultra Simple) to Level 5 (Chef)
- **Dietary Preferences**: Automatic substitutions for allergies, dislikes, and diet types
- **Recipe Library**: Save unlimited recipes
- **Recent Recipes**: Quick access to your last 5 analyzed recipes
- **Profile Customization**: Choose from 5 avatar colors
- **3-Day Free Trial**: Full access to all features, then £3.99/month or £39.99/year

## Tech Stack

### Frontend
- **Framework**: React Native (New Architecture enabled)
- **Navigation**: Expo Router with typed routes
- **UI**: Custom dark theme with gesture handlers
- **State Management**: React hooks + AsyncStorage

### Backend
- **Database**: Supabase with Row Level Security (RLS)
- **Authentication**: Supabase Auth
- **AI**: OpenAI GPT-4o Vision (via secure Edge Function)
- **File Storage**: Supabase Storage
- **Subscriptions**: RevenueCat

### Infrastructure
- **Runtime**: Expo SDK 52
- **Build**: EAS Build
- **TypeScript**: Full type safety
- **Testing**: BDD test documentation

## Project Structure

```
/app                           # Screens and routes (Expo Router)
  /(tabs)                      # Tab navigation screens
    /index.tsx                 # Home (Analyse Recipe)
    /library.tsx               # Recipe Library
    /saved.tsx                 # Saved Recipes
    /profile.tsx               # User Profile
  /auth                        # Authentication
    /login.tsx                 # Login screen
    /signup.tsx                # Sign up screen
  /onboarding                  # Onboarding flow
    /index.tsx                 # Welcome
    /how-it-works.tsx          # Feature tour
    /personal-info.tsx         # Name/referral
    /preferences.tsx           # Dietary preferences
  /upload.tsx                  # Recipe upload screen
  /recipe.tsx                  # Recipe detail view
  /paywall.tsx                 # Subscription paywall
  /welcome.tsx                 # Landing screen
  /_layout.tsx                 # Root navigation with error boundary

/src                           # Application code
  /components                  # Reusable UI components
    /ErrorBoundary.tsx         # Global error handler
  /services                    # Backend services
    /supabase.ts               # Database and auth
    /backend-api.ts            # Edge Function client
    /revenuecat.ts             # Subscription management
    /subscription.ts           # Subscription utilities
  /constants                   # App constants
    /theme.ts                  # Dark theme configuration
    /legal.ts                  # Legal document URLs

/supabase                      # Supabase configuration
  /functions                   # Edge Functions
    /analyze-recipe            # Secure OpenAI integration
  /migrations                  # Database migrations
    /enable_rls_policies.sql   # Row Level Security
    /COMMUNITY_SCHEMA.sql      # Community recipes table
    /LEGAL_CONSENTS_SCHEMA.sql # Legal consent tracking

/docs                          # Legal documents
  /privacy-policy.html         # GDPR/CCPA compliant
  /terms-of-service.html       # App Store compliant
  /content-policy.html         # Community guidelines

/tests                         # BDD test documentation
  /features                    # Feature specifications
  /reference                   # Data models and user flows

/assets                        # Images and assets
  /images                      # App icons and splash screens
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing on device)
- Supabase account
- OpenAI API key
- RevenueCat account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/archieplant/searai.git
   cd searai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in:
   ```bash
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   REVENUECAT_API_KEY=your-revenuecat-key
   ```

   **Note**: OpenAI API key is stored in Supabase Edge Function secrets for security.

4. **Set up Supabase**

   - Create tables using `supabase/migrations/*.sql`
   - Enable Row Level Security: Run `enable_rls_policies.sql`
   - Deploy Edge Function: `npx supabase functions deploy analyze-recipe`
   - Add OpenAI key to Supabase secrets vault

5. **Run the app**

   ```bash
   npx expo start
   ```

   Then:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## Development

### Available Scripts

- `npm start` - Start Expo dev server
- `npm run ios` - Open in iOS simulator
- `npm run android` - Open in Android emulator
- `npm run lint` - Run ESLint

### Building for Production

1. **Configure EAS**

   Update bundle identifiers in `app.config.js` when you have a company domain.

2. **Build iOS**

   ```bash
   npx eas build --platform ios --profile production
   ```

3. **Build Android**

   ```bash
   npx eas build --platform android --profile production
   ```

## Database Schema

See [SUPABASE_SCHEMA.md](./SUPABASE_SCHEMA.md) for complete database documentation.

**Key Tables:**
- `user_profiles` - User information and preferences
- `user_subscriptions` - RevenueCat subscription status
- `recipe_analyses` - Rate limiting tracking (5 requests/minute)
- `saved_recipes` - User's saved recipe collection
- `recent_recipes` - Last 5 analyzed recipes per user
- `dietary_preferences` - User allergies, dislikes, diet type
- `legal_consents` - GDPR/CCPA consent tracking

**Security:** All tables have Row Level Security enabled. Users can only access their own data.

## Architecture

### Authentication Flow
1. User signs up/logs in via Supabase Auth
2. Profile created with default avatar color
3. Dietary preferences initialized
4. RevenueCat user ID linked
5. 3-day free trial starts automatically

### Recipe Analysis Flow
1. User uploads photo or pastes text
2. Image converted to base64 (if provided)
3. Request sent to `analyze-recipe` Edge Function (rate limited to 5/minute)
4. Edge Function calls OpenAI GPT-4o with dietary preferences
5. Response parsed into 5 complexity levels
6. Recipe saved to recent_recipes
7. User can analyze and save unlimited recipes

### Subscription Flow
1. New user signs up → Automatic 3-day free trial
2. User starts trial → RevenueCat manages trial period
3. After 3 days → Auto-converts to £3.99/month (unless cancelled)
4. User can upgrade to annual (£39.99/year) anytime
5. Cancellation managed through App Store/Play Store settings

## Security

### API Key Protection
- OpenAI API key stored in Supabase Edge Function secrets
- Never exposed to client app
- All AI requests proxied through Edge Function

### Database Security
- Row Level Security (RLS) enabled on all tables
- JWT-based authentication
- Service role for backend operations only

### Legal Compliance
- Privacy Policy: https://archieplant.github.io/searai/privacy-policy.html
- Terms of Service: https://archieplant.github.io/searai/terms-of-service.html
- Content Policy: https://archieplant.github.io/searai/content-policy.html
- GDPR, CCPA, and COPPA compliant

## Design

### Color Palette
- **Primary**: `#A4E900` (Lime Green)
- **Background**: `#000000` (Pure Black)
- **Surface**: `#1A1A1A` (Card background)
- **Text**: `#FFFFFF` (White) / `#CCCCCC` (Secondary)
- **Error**: `#FF6B6B` (Red)

### Avatar Colors
- Purple: `#8B7FE8`
- Teal: `#4ECDC4`
- Orange: `#FF6B35` (default)
- Pink: `#E74C9E`
- Blue: `#45B7D1`

## Subscription Model

- **3-Day Free Trial**: Full access to all features
- **After Trial**: £3.99/month or £39.99/year
- **All Features Included**: Unlimited recipe analysis and saving
- **Cancel Anytime**: Manage subscription in App Store/Play Store

## Testing

BDD test documentation available in `/tests` directory:
- Feature specifications (`.feature.md` files)
- User flow documentation
- Data model references

## Contributing

This is a private project. For collaborators:
1. Create feature branch from `main`
2. Follow existing code style
3. Update tests if applicable
4. Submit pull request

## License

Private project - All rights reserved

## Contact

**Support**: support@searai.app
**Developers**: TCAPDevs
**Location**: 24 Swan Street, Boxford, Suffolk, CO10 5NZ, UK

---

Built with Claude Code 🤖
