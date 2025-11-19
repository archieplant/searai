import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFERENCES_KEY = '@recipe_killer_preferences';

export interface UserPreferences {
  allergies: string[];
  dislikes: string[];
  dietType: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  allergies: [],
  dislikes: [],
  dietType: 'None',
};

/**
 * Saves user dietary preferences to AsyncStorage
 *
 * @param allergies - Array of allergy strings
 * @param dislikes - Array of dislike strings
 * @param dietType - Diet type string (e.g., "None", "Vegetarian", "Vegan")
 * @returns Promise<void>
 * @throws Error if save operation fails
 */
export async function savePreferences(
  allergies: string[],
  dislikes: string[],
  dietType: string
): Promise<void> {
  try {
    const preferences: UserPreferences = {
      allergies,
      dislikes,
      dietType,
    };

    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    console.log('Preferences saved successfully');
  } catch (error) {
    console.error('Error saving preferences:', error);
    throw new Error('Failed to save preferences');
  }
}

/**
 * Retrieves user dietary preferences from AsyncStorage
 *
 * @returns Promise<UserPreferences> - User preferences or defaults if none exist
 * @throws Error if retrieval operation fails
 */
export async function getPreferences(): Promise<UserPreferences> {
  try {
    const preferencesJson = await AsyncStorage.getItem(PREFERENCES_KEY);

    if (!preferencesJson) {
      return DEFAULT_PREFERENCES;
    }

    const preferences: UserPreferences = JSON.parse(preferencesJson);
    return preferences;
  } catch (error) {
    console.error('Error getting preferences:', error);
    // Return defaults on error
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Clears all user dietary preferences
 *
 * @returns Promise<void>
 */
export async function clearPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFERENCES_KEY);
    console.log('Preferences cleared successfully');
  } catch (error) {
    console.error('Error clearing preferences:', error);
    throw new Error('Failed to clear preferences');
  }
}
