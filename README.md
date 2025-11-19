# Recipe Killer AI

AI-powered recipe analysis and simplification app built with React Native and Expo.

## Features

- **Recipe Analysis**: Upload photos or paste recipes for AI-powered analysis
- **Complexity Levels**: Get 3 versions of any recipe (Easy, Average, Pro)
- **Recipe Library**: Save and organize your favorite recipes
- **Smart Recommendations**: Weekly rotating recipe suggestions
- **Premium Features**: Unlimited recipes, saved recipes, and more

## Tech Stack

- **Framework**: React Native + Expo Router
- **Backend**: Supabase (Auth + Database)
- **AI**: OpenAI GPT-4 Vision
- **Subscriptions**: RevenueCat
- **Storage**: AsyncStorage + Supabase Storage

## Project Structure

```
/app                    # Screens and routes (Expo Router)
  /(tabs)              # Tab navigation screens
  /auth                # Login and signup
  /onboarding          # Onboarding flow
  /upload.tsx          # Recipe upload screen
  /recipe.tsx          # Recipe detail view
  /paywall.tsx         # Subscription paywall
  /_layout.tsx         # Root navigation layout

/src                   # Custom application code
  /components          # Custom UI components
  /services            # Backend services (Supabase, OpenAI, RevenueCat)

/components            # Shared components
/hooks                 # Custom React hooks
/constants             # Theme colors and constants
/assets                # Images and assets
```

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   Copy `.env.example` to `.env` and fill in your credentials:
   - Supabase URL and API keys
   - OpenAI API key
   - RevenueCat API key

3. **Run the app**

   ```bash
   npm start
   ```

   Then use:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app

## Development

- **Start dev server**: `npm start`
- **iOS**: `npm run ios`
- **Android**: `npm run android`
- **Lint**: `npm run lint`

## Documentation

- [Supabase Schema](./SUPABASE_SCHEMA.md) - Database structure
- [Library Photos Setup](./LIBRARY_PHOTOS_SETUP.md) - Recipe library configuration

## Color Scheme

- **Primary**: `#9FE870` (Green)
- **Secondary**: `#9FE870` (Green)
- **Background**: `#1C1C1C` (Dark)
- **Surface**: `#2C2C2C` (Card background)

## License

Private project
