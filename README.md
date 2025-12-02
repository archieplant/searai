# SearAI

AI-powered recipe analysis and community sharing app built with React Native and Expo.

## About

SearAI transforms any recipe into simplified versions tailored to your skill level and dietary preferences. Upload a photo or paste text, and get 5 complexity levels ranging from ultra-simple home cooking to restaurant-level techniques.

## Features

### Recipe Analysis
- **AI-Powered Analysis**: GPT-4o Vision analyzes recipe photos and text
- **5 Complexity Levels**: From "SearAI" (ultra-simple) to "Very Complex" (chef-level)
- **Smart Dietary Support**: Automatic substitutions for allergies, dislikes, and diet types
- **British English**: Metric measurements and UK ingredient names throughout

### Community & Discovery
- **Recipe of the Week**: Featured community recipe based on saves
- **Trending Recipes**: Top 8 trending recipes from the last 7 days
- **Community Sharing**: Share your recipes with other users
- **Save & Organize**: Unlimited recipe storage with easy access

### User Experience
- **Personal Library**: Save recipes at your preferred complexity level
- **Recent Recipes**: Quick access to your last 5 analyzed recipes
- **Profile Customization**: Choose from 5 avatar colors
- **Dark Theme**: Modern dark UI optimized for readability

### Subscription
- **3-Day Free Trial**: Full access to all features
- **After Trial**: £3.99/month or £39.99/year
- **Unlimited Access**: No limits on recipe analysis or saving

## Tech Stack

### Frontend
- React Native with Expo SDK 52
- Expo Router with typed routes
- TypeScript for full type safety
- New Architecture enabled

### Backend
- Supabase (Database, Auth, Storage)
- Supabase Edge Functions (Secure OpenAI integration)
- Row Level Security (RLS) on all tables
- RevenueCat (Subscription management)

### AI & Analysis
- OpenAI GPT-4o Vision API
- Secure server-side processing via Edge Functions
- Rate limiting (5 requests/minute per user)
- Dietary preference integration

### Infrastructure
- Vercel (Legal documentation hosting)
- Custom domain: https://legal.searai.app
- SSL/HTTPS throughout
- Automatic deployments

## Project Structure

```
/app                           # Screens and routes (Expo Router)
  /(tabs)                      # Tab navigation
    /index.tsx                 # Home (Analyze Recipe)
    /discover.tsx              # Community Discovery (Hero Layout)
    /library.tsx               # Recipe Library
    /saved.tsx                 # Saved Recipes
    /profile.tsx               # User Profile
  /auth                        # Authentication flows
  /onboarding                  # Onboarding flow
  /upload.tsx                  # Recipe upload
  /recipe.tsx                  # Recipe detail view
  /paywall.tsx                 # Subscription paywall
  /welcome.tsx                 # Landing screen

/src                           # Application code
  /components                  # Reusable UI components
  /services                    # Backend services
    /supabase.ts               # Database and auth
    /backend-api.ts            # Edge Function client
    /revenuecat.ts             # Subscription management
  /constants
    /theme.ts                  # Dark theme configuration
    /legal.ts                  # Legal document URLs

/supabase                      # Supabase configuration
  /functions
    /analyze-recipe            # Secure OpenAI integration
  /migrations                  # Database migrations

/legal-docs                    # Legal documentation (Vercel)
  /privacy-policy.html         # GDPR/CCPA compliant
  /terms-of-service.html       # App Store compliant
  /content-policy.html         # Community guidelines
  /README.md                   # Deployment instructions

/assets                        # Images and assets
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo Go app (for testing)
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

   Copy `.env.example` to `.env`:
   ```bash
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   REVENUECAT_API_KEY=your-revenuecat-public-sdk-key
   ```

   **Important**: Never add `OPENAI_API_KEY` to `.env`! It must be stored in Supabase Edge Function secrets. See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

4. **Set up Supabase**

   - Run database migrations: `supabase/migrations/*.sql`
   - Deploy Edge Function: `npx supabase functions deploy analyze-recipe`
   - Add OpenAI key to secrets: `npx supabase secrets set OPENAI_API_KEY=your-key`

   See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for detailed instructions.

5. **Run the app**
   ```bash
   npx expo start
   ```

   Then press `i` for iOS, `a` for Android, or scan QR code with Expo Go.

## Development

### Available Scripts

- `npm start` - Start Expo dev server
- `npm run ios` - Open in iOS simulator
- `npm run android` - Open in Android emulator

### Building for Production

1. **Configure EAS Build**
   ```bash
   eas build:configure
   ```

2. **Build iOS**
   ```bash
   eas build --platform ios --profile production
   ```

3. **Build Android**
   ```bash
   eas build --platform android --profile production
   ```

## Database Schema

### Core Tables

- **user_profiles** - User information and avatar colors
- **user_subscriptions** - RevenueCat subscription status
- **recipe_analyses** - Rate limiting tracking
- **saved_recipes** - User's personal recipe collection
- **recent_recipes** - Last 5 analyzed recipes
- **dietary_preferences** - Allergies, dislikes, diet types
- **legal_consents** - GDPR/CCPA consent tracking

### Community Tables

- **community_recipes** - Publicly shared recipes
- **community_recipe_saves** - Track recipe saves/popularity

**Security**: All tables protected by Row Level Security (RLS). Users can only access their own data.

## Architecture

### Recipe Analysis Flow

1. User uploads photo or pastes recipe text
2. Client converts image to base64 (if provided)
3. Request sent to `analyze-recipe` Edge Function
4. Edge Function calls OpenAI GPT-4o with user's dietary preferences
5. AI generates 5 complexity levels with British English
6. Response returned and saved to user's recent recipes
7. User can save at any complexity level

### Community Discovery Flow

1. **Recipe of the Week**: Highest saved recipe in last 7 days
2. **Trending Recipes**: Top 8 saved recipes (excluding Recipe of the Week)
3. **Hero Card**: Large featured card with gradient overlay
4. **Trending Carousel**: Horizontal scrolling with rank badges
5. **Time-based queries**: 7-day window with all-time fallback

### Subscription Flow

1. New user signs up → Automatic 3-day free trial
2. RevenueCat manages trial period
3. After 3 days → Auto-converts to £3.99/month (unless cancelled)
4. User can upgrade to annual (£39.99/year) anytime
5. Cancellation via App Store/Play Store settings

## Security

### API Key Protection
- ✅ OpenAI API key stored in Supabase Edge Function secrets
- ✅ Never exposed to client application
- ✅ All AI requests proxied through secure Edge Function
- ✅ Rate limiting (5 requests/minute per user)

### Database Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ JWT-based authentication
- ✅ Users can only access their own data
- ✅ Service role restricted to backend operations

### Legal Compliance
- ✅ Privacy Policy: https://legal.searai.app/privacy-policy.html
- ✅ Terms of Service: https://legal.searai.app/terms-of-service.html
- ✅ Content Policy: https://legal.searai.app/content-policy.html
- ✅ GDPR, CCPA, and COPPA compliant (13+ age requirement)

## Design

### Color Palette
- **Primary**: `#A4E900` (Lime Green)
- **Background**: `#000000` (Pure Black)
- **Surface**: `#1A1A1A` (Card background)
- **Text**: `#FFFFFF` (White) / `#CCCCCC` (Secondary)
- **Border**: `#333333`
- **Error**: `#FF6B6B`

### Avatar Colors
- Purple: `#8B7FE8`
- Teal: `#4ECDC4`
- Orange: `#FF6B35` (default)
- Pink: `#E74C9E`
- Blue: `#45B7D1`

### Typography
- System font stack optimized for iOS and Android
- British English spelling throughout
- Clear hierarchy with size and weight

## Production Checklist

### ✅ Completed
- [x] Configure RevenueCat products in stores
- [x] Deploy Edge Function with SearAI branding
- [x] Secure API keys in Supabase secrets
- [x] Host legal documents on custom domain (https://legal.searai.app)
- [x] Enable Row Level Security (RLS) policies
- [x] Set up community features (Recipe of the Week, Trending)

### 📋 Before App Store Submission
- [ ] Update App Store screenshots
- [ ] Test subscription flow end-to-end on TestFlight
- [ ] Verify legal documents are accessible in-app
- [ ] Test community features with multiple test users
- [ ] Verify OpenAI Edge Function rate limiting works
- [ ] Test dietary preferences with all combinations
- [ ] Verify photo upload and analysis works reliably
- [ ] Test deep linking with `searai://` scheme
- [ ] Submit for App Store review

### 🔧 Optional Enhancements
- [ ] Set up crash reporting (Sentry recommended)
- [ ] Configure analytics (Mixpanel/Amplitude)
- [ ] Set up App Store Connect API for automation
- [ ] Configure push notifications (if needed)
- [ ] Set up A/B testing framework (if needed)

## Support

- **Email**: support@searai.app
- **Privacy**: privacy@searai.app
- **Legal**: legal@searai.app
- **Website**: https://searai.app

## About TCAPDevs

**Developer**: TCAPDevs
**Location**: 24 Swan Street, Boxford, Suffolk, CO10 5NZ, UK
**Contact**: support@searai.app

## License

Private project - All rights reserved © 2025 TCAPDevs

---

Built with ❤️ using Claude Code
