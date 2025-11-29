/**
 * SearAI - Theme Colors
 * Primary color scheme used throughout the app
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary brand colors - Premium Dark Theme
  primary: '#A4E900',        // Refined green - main accent color
  secondary: '#A4E900',      // Refined green - secondary accent
  tertiary: '#E07A5F',       // Coral - tertiary accent

  // Background colors - Premium Dark Theme
  background: {
    primary: '#000000',      // Pure black - main background
    secondary: '#1C1C1E',    // Dark card/surface background
    tertiary: '#2C2C2E',     // Elevated surfaces and dividers
  },

  // Text colors - Premium Dark Theme
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#98989D',    // Muted grey - subtext/labels
    tertiary: '#636366',     // Subtle grey - disabled/placeholder
    inverse: '#000000',      // Text on light backgrounds
  },

  // Legacy theme support (for compatibility)
  light: {
    text: '#11181C',
    background: '#000000',
    tint: '#A4E900',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#A4E900',
  },
  dark: {
    text: '#FFFFFF',
    background: '#000000',
    tint: '#A4E900',
    icon: '#98989D',
    tabIconDefault: '#98989D',
    tabIconSelected: '#A4E900',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
