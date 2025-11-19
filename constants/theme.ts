/**
 * Recipe Killer AI - Theme Colors
 * Primary color scheme used throughout the app
 */

import { Platform } from 'react-native';

export const Colors = {
  // Primary brand colors
  primary: '#9FE870',        // Green - main accent color
  secondary: '#9FE870',      // Green - secondary accent
  tertiary: '#E07A5F',       // Coral - tertiary accent

  // Background colors
  background: {
    primary: '#1C1C1C',      // Main background
    secondary: '#2C2C2C',    // Card/elevated background
    tertiary: '#3C3C3C',     // Borders and dividers
  },

  // Text colors
  text: {
    primary: '#FFFFFF',      // Main text
    secondary: '#AAAAAA',    // Subtext
    tertiary: '#666666',     // Disabled/placeholder
    inverse: '#1C1C1C',      // Text on light backgrounds
  },

  // Legacy theme support (for compatibility)
  light: {
    text: '#11181C',
    background: '#FAF9F6',
    tint: '#9FE870',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#9FE870',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1C1C1C',
    tint: '#9FE870',
    icon: '#AAAAAA',
    tabIconDefault: '#AAAAAA',
    tabIconSelected: '#9FE870',
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
