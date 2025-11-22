/**
 * Backend API Service
 *
 * This service handles secure communication with Supabase Edge Functions.
 * OpenAI API calls are made server-side to protect the API key.
 */

import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import type { RecipeAnalysis, UserPreferences } from './openai';

interface AnalyzeRecipeRequest {
  imageBase64?: string;
  recipeText?: string;
  preferences?: UserPreferences;
}

/**
 * Analyzes a recipe using the secure backend Edge Function
 *
 * @param recipeText - Optional recipe text to analyze
 * @param imageUri - Optional local image URI to analyze
 * @param preferences - Optional user dietary preferences
 * @returns Promise<RecipeAnalysis> - Structured recipe data with 5 versions
 * @throws Error if the analysis fails
 */
export async function analyzeRecipeViaBackend(
  recipeText?: string,
  imageUri?: string,
  preferences?: UserPreferences
): Promise<RecipeAnalysis> {
  try {
    // Validate input
    if (!recipeText && !imageUri) {
      throw new Error('Either recipe text or image must be provided');
    }

    // Convert image to base64 if provided
    let imageBase64: string | undefined;
    if (imageUri) {
      try {
        imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: 'base64',
        });
      } catch (error) {
        console.error('Error reading image file:', error);
        throw new Error('Failed to read image file. Please try again.');
      }
    }

    // Get current user session (for authentication)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      throw new Error('You must be logged in to analyze recipes');
    }

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('analyze-recipe', {
      body: {
        imageBase64,
        recipeText,
        preferences,
      } as AnalyzeRecipeRequest,
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(error.message || 'Failed to analyze recipe. Please try again.');
    }

    if (!data) {
      throw new Error('No data received from analysis service');
    }

    // Validate response structure
    if (!data.dishName || !data.versions) {
      throw new Error('Invalid response structure from analysis service');
    }

    return data as RecipeAnalysis;

  } catch (error) {
    console.error('Backend API error:', error);

    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }

    throw new Error('An unexpected error occurred during analysis. Please try again.');
  }
}

/**
 * Helper function to convert UserPreferences to the format expected by the backend
 * (handles any format differences between client and server)
 */
function formatPreferencesForBackend(preferences?: UserPreferences): UserPreferences | undefined {
  if (!preferences) return undefined;

  return {
    allergies: preferences.allergies || [],
    dislikes: preferences.dislikes || [],
    dietType: preferences.dietType || 'None',
  };
}
