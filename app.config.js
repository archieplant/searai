import 'dotenv/config';

export default {
  expo: {
    name: 'recipe-killer-ai',
    slug: 'recipe-killer-ai',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'recipekillerai',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'com.archieplant.recipekillerai',
      supportsTablet: true,
      infoPlist: {
        NSPrivacyPolicyURL: 'https://archieplant.github.io/recipe-killer-ai/privacy-policy.html',
      },
    },
    android: {
      package: 'com.archieplant.recipekillerai',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
          dark: {
            backgroundColor: '#000000',
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      // OpenAI API key removed - now handled securely by backend Edge Function
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      revenuecatApiKey: process.env.REVENUECAT_API_KEY,
    },
  },
};
