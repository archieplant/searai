import { createClient, SupabaseClient, User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { RecipeAnalysis } from './openai';

// Get Supabase credentials from Expo Constants
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase credentials not found. Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file and app.config.js is properly configured.'
  );
}

// Create Supabase client with AsyncStorage for session persistence
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth types
export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export interface SignUpResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export interface SignInResult {
  user: User | null;
  session: Session | null;
  error: string | null;
}

export type AuthStateChangeCallback = (event: AuthChangeEvent, session: Session | null) => void;

// Database types
export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  referral_source: string | null;
  avatar_color: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_data: RecipeAnalysis;
  saved_complexity_level: number;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecentRecipe {
  id: string;
  user_id: string;
  recipe_data: RecipeAnalysis;
  saved_complexity_level: number;
  image_url: string | null;
  image_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface LibraryRecipe {
  id: string;
  recipe_data: RecipeAnalysis;
  category: string;
  popularity: number;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityRecipe {
  id: string;
  user_id: string;
  recipe_data: RecipeAnalysis;
  complexity_level: number;
  image_url: string | null;
  image_path: string | null;
  is_published: boolean;
  save_count: number;
  created_at: string;
  updated_at: string;
}

export interface DietaryPreferences {
  id: string;
  user_id: string;
  allergies: string[];
  dislikes: string[];
  diet_type: string;
  created_at: string;
  updated_at: string;
}

export interface SaveRecipeParams {
  recipeData: RecipeAnalysis;
  savedComplexityLevel: number;
  imageUri?: string;
}

/**
 * Saves a recipe to the database for the currently authenticated user
 *
 * @param recipeData - The full recipe JSON object with all versions
 * @param savedComplexityLevel - The complexity level (0-4) the user had selected when saving
 * @param imageUri - Optional local image URI to upload
 * @returns Promise<SavedRecipe> - The saved recipe with database metadata
 * @throws Error if the save operation fails or user is not authenticated
 */
export async function saveRecipe({
  recipeData,
  savedComplexityLevel,
  imageUri,
}: SaveRecipeParams): Promise<SavedRecipe> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to save recipes');
    }

    // Validate complexity level
    if (savedComplexityLevel < 0 || savedComplexityLevel > 4) {
      throw new Error('Saved complexity level must be between 0 and 4');
    }

    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    // Handle image: either upload new local URI or use existing remote URL
    if (imageUri) {
      // Check if it's a remote URL (already uploaded) or local URI (needs upload)
      if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        // It's already a remote URL, just use it
        imageUrl = imageUri;
        console.log('Using existing remote image URL:', imageUrl);
      } else {
        // It's a local URI, upload it
        const { uploadRecipeImage } = await import('./storage');
        const uploadResult = await uploadRecipeImage(imageUri, currentUser.id);
        imageUrl = uploadResult.imageUrl;
        imagePath = uploadResult.imagePath;
        console.log('Image uploaded for saved recipe:', imageUrl);
      }
    }

    // Insert the recipe into the database
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: currentUser.id,
        recipe_data: recipeData,
        saved_complexity_level: savedComplexityLevel,
        image_url: imageUrl,
        image_path: imagePath,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving recipe:', error);
      throw new Error(`Failed to save recipe: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from save operation');
    }

    return data as SavedRecipe;
  } catch (error) {
    console.error('Error in saveRecipe:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to save recipe: Unknown error');
  }
}

/**
 * Retrieves all saved recipes for the currently authenticated user
 *
 * @returns Promise<SavedRecipe[]> - Array of saved recipes sorted by most recent first
 * @throws Error if the fetch operation fails or user is not authenticated
 */
export async function getSavedRecipes(): Promise<SavedRecipe[]> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to view saved recipes');
    }

    const { data, error } = await supabase
      .from('saved_recipes')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved recipes:', error);
      throw new Error(`Failed to fetch saved recipes: ${error.message}`);
    }

    return (data as SavedRecipe[]) || [];
  } catch (error) {
    console.error('Error in getSavedRecipes:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to fetch saved recipes: Unknown error');
  }
}

/**
 * Deletes a saved recipe by ID
 *
 * @param recipeId - The ID of the recipe to delete
 * @returns Promise<void>
 * @throws Error if the delete operation fails
 */
export async function deleteRecipe(recipeId: string): Promise<void> {
  try {
    if (!recipeId) {
      throw new Error('Recipe ID is required');
    }

    const { error } = await supabase
      .from('saved_recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe:', error);
      throw new Error(`Failed to delete recipe: ${error.message}`);
    }

    console.log('Recipe deleted successfully');
  } catch (error) {
    console.error('Error in deleteRecipe:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to delete recipe: Unknown error');
  }
}

/**
 * Retrieves all library recipes (curated recipe collection)
 *
 * @returns Promise<LibraryRecipe[]> - Array of library recipes sorted by popularity
 * @throws Error if the fetch operation fails
 */
export async function getLibraryRecipes(): Promise<LibraryRecipe[]> {
  try {
    const { data, error } = await supabase
      .from('library_recipes')
      .select('*')
      .order('popularity', { ascending: false });

    if (error) {
      console.error('Error fetching library recipes:', error);
      throw new Error(`Failed to fetch library recipes: ${error.message}`);
    }

    return (data as LibraryRecipe[]) || [];
  } catch (error) {
    console.error('Error in getLibraryRecipes:', error);

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to fetch library recipes: Unknown error');
  }
}

// ======================
// Recent Recipes Functions
// ======================

/**
 * Adds a recipe to the recent_recipes table (automatically called after analysis)
 *
 * @param recipeData - The analyzed recipe data
 * @param complexityLevel - The selected complexity level (0-4)
 * @param imageUri - Optional local image URI to upload
 * @returns Promise<RecentRecipe> - The created recent recipe with image URL
 * @throws Error if the operation fails
 */
export async function addRecentRecipe(
  recipeData: RecipeAnalysis,
  complexityLevel: number,
  imageUri?: string
): Promise<RecentRecipe> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to save recipes');
    }

    console.log('Adding recipe to recent_recipes:', recipeData.dishName);

    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    // Upload image if provided
    if (imageUri) {
      const { uploadRecipeImage } = await import('./storage');
      const uploadResult = await uploadRecipeImage(imageUri, currentUser.id);
      imageUrl = uploadResult.imageUrl;
      imagePath = uploadResult.imagePath;
      console.log('Image uploaded for recent recipe:', imageUrl);
    }

    // Insert into recent_recipes
    const { data, error } = await supabase
      .from('recent_recipes')
      .insert({
        user_id: currentUser.id,
        recipe_data: recipeData,
        saved_complexity_level: complexityLevel,
        image_url: imageUrl,
        image_path: imagePath,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding recent recipe:', error);
      throw new Error(`Failed to add recent recipe: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from recent recipe insert');
    }

    console.log('Recent recipe added successfully:', data.id);

    // Clean up old recent recipes (keep only 3 most recent)
    await deleteOldRecentRecipes(currentUser.id);

    return data as RecentRecipe;
  } catch (error) {
    console.error('Error in addRecentRecipe:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to add recent recipe: Unknown error');
  }
}

/**
 * Gets recent recipes for the current user (max 3)
 *
 * @param limit - Maximum number of recipes to return (default 3)
 * @returns Promise<RecentRecipe[]> - Array of recent recipes ordered by created_at DESC
 * @throws Error if the fetch operation fails
 */
export async function getRecentRecipes(limit: number = 3): Promise<RecentRecipe[]> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return [];
    }

    const { data, error } = await supabase
      .from('recent_recipes')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent recipes:', error);
      throw new Error(`Failed to fetch recent recipes: ${error.message}`);
    }

    return (data as RecentRecipe[]) || [];
  } catch (error) {
    console.error('Error in getRecentRecipes:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch recent recipes: Unknown error');
  }
}

/**
 * Deletes old recent recipes beyond the 3 most recent (if not saved)
 *
 * @param userId - User ID to clean up recipes for
 * @returns Promise<void>
 */
export async function deleteOldRecentRecipes(userId: string): Promise<void> {
  try {
    console.log('Cleaning up old recent recipes for user:', userId);

    // Get all recent recipes for user, ordered by created_at DESC
    const { data: recentRecipes, error: fetchError } = await supabase
      .from('recent_recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching recent recipes for cleanup:', fetchError);
      return; // Don't throw, cleanup is non-critical
    }

    if (!recentRecipes || recentRecipes.length <= 3) {
      console.log('No cleanup needed, recent recipes count:', recentRecipes?.length || 0);
      return; // Nothing to clean up
    }

    // Get recipes beyond the 3 most recent
    const recipesToDelete = recentRecipes.slice(3);
    console.log('Found', recipesToDelete.length, 'old recipes to potentially delete');

    // Get all saved recipes to check if any should be kept
    const { data: savedRecipes } = await supabase
      .from('saved_recipes')
      .select('id, recipe_data')
      .eq('user_id', userId);

    const savedRecipeNames = new Set(
      (savedRecipes || []).map((r: any) => r.recipe_data?.dishName)
    );

    // Delete old recipes that are NOT saved
    for (const recipe of recipesToDelete) {
      const recipeTyped = recipe as RecentRecipe;
      const isSaved = savedRecipeNames.has(recipeTyped.recipe_data.dishName);

      if (!isSaved) {
        console.log('Deleting unsaved old recipe:', recipeTyped.recipe_data.dishName);

        // Delete image from storage if exists
        if (recipeTyped.image_path) {
          await cleanupRecipeImage(recipeTyped.image_path);
        }

        // Delete from database
        const { error: deleteError } = await supabase
          .from('recent_recipes')
          .delete()
          .eq('id', recipeTyped.id);

        if (deleteError) {
          console.error('Error deleting old recipe:', deleteError);
        } else {
          console.log('Deleted old recipe:', recipeTyped.id);
        }
      } else {
        console.log('Keeping saved recipe in recents:', recipeTyped.recipe_data.dishName);
      }
    }

    console.log('Recent recipes cleanup complete');
  } catch (error) {
    console.error('Error in deleteOldRecentRecipes:', error);
    // Don't throw - cleanup is non-critical
  }
}

/**
 * Deletes a recipe image from storage
 *
 * @param imagePath - Storage path of the image
 * @returns Promise<void>
 */
export async function cleanupRecipeImage(imagePath: string): Promise<void> {
  try {
    if (!imagePath) return;

    console.log('Cleaning up recipe image:', imagePath);
    const { deleteRecipeImage } = await import('./storage');
    await deleteRecipeImage(imagePath);
  } catch (error) {
    console.error('Error cleaning up recipe image:', error);
    // Don't throw - cleanup is non-critical
  }
}

// ======================
// User Profile Functions
// ======================

/**
 * Creates or updates a user profile
 *
 * @param userId - The user's ID from auth.users
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @param referralSource - Where the user heard about us
 * @param avatarColor - Hex color code for profile avatar (optional)
 * @returns Promise<UserProfile> - The created/updated profile
 * @throws Error if the operation fails
 */
export async function saveUserProfile(
  userId: string,
  firstName: string,
  lastName: string,
  referralSource?: string,
  avatarColor?: string
): Promise<UserProfile> {
  try {
    // Upsert the profile (insert or update if exists)
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        referral_source: referralSource || null,
        avatar_color: avatarColor || '#FF6B35', // Default to orange
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving user profile:', error);
      throw new Error(`Failed to save user profile: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from profile save operation');
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in saveUserProfile:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to save user profile: Unknown error');
  }
}

/**
 * Updates only the avatar color for the current user
 *
 * @param avatarColor - Hex color code for profile avatar
 * @returns Promise<UserProfile> - The updated profile
 * @throws Error if the operation fails
 */
export async function updateAvatarColor(avatarColor: string): Promise<UserProfile> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const { data, error} = await supabase
      .from('user_profiles')
      .update({ avatar_color: avatarColor })
      .eq('user_id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating avatar color:', error);
      throw new Error(`Failed to update avatar color: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from avatar color update');
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in updateAvatarColor:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update avatar color: Unknown error');
  }
}

/**
 * Gets the current user's profile
 *
 * @returns Promise<UserProfile | null> - The user's profile or null if not found
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error) {
      // If profile doesn't exist, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching user profile:', error);
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch user profile: Unknown error');
  }
}

/**
 * Updates the current user's profile
 *
 * @param updates - Partial profile data to update
 * @returns Promise<UserProfile> - The updated profile
 * @throws Error if the operation fails
 */
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, 'first_name' | 'last_name' | 'referral_source'>>
): Promise<UserProfile> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to update your profile');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', currentUser.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw new Error(`Failed to update user profile: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from profile update operation');
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update user profile: Unknown error');
  }
}

// ======================
// Dietary Preferences Functions
// ======================

/**
 * Saves or updates dietary preferences for the current user
 *
 * @param allergies - Array of allergy strings
 * @param dislikes - Array of dislike strings
 * @param dietType - Diet type (e.g., "None", "Vegetarian", "Vegan")
 * @returns Promise<DietaryPreferences> - The saved preferences
 * @throws Error if the operation fails
 */
export async function saveDietaryPreferences(
  allergies: string[],
  dislikes: string[],
  dietType: string
): Promise<DietaryPreferences> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to save preferences');
    }

    // Upsert the preferences (insert or update if exists)
    const { data, error } = await supabase
      .from('dietary_preferences')
      .upsert({
        user_id: currentUser.id,
        allergies,
        dislikes,
        diet_type: dietType,
      }, {
        onConflict: 'user_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving dietary preferences:', error);
      throw new Error(`Failed to save dietary preferences: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from preferences save operation');
    }

    return data as DietaryPreferences;
  } catch (error) {
    console.error('Error in saveDietaryPreferences:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to save dietary preferences: Unknown error');
  }
}

/**
 * Gets the current user's dietary preferences
 *
 * @returns Promise<DietaryPreferences | null> - The user's preferences or null if not found
 */
export async function getDietaryPreferences(): Promise<DietaryPreferences | null> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return null;
    }

    const { data, error } = await supabase
      .from('dietary_preferences')
      .select('*')
      .eq('user_id', currentUser.id)
      .single();

    if (error) {
      // If preferences don't exist, return null (not an error)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching dietary preferences:', error);
      throw new Error(`Failed to fetch dietary preferences: ${error.message}`);
    }

    return data as DietaryPreferences;
  } catch (error) {
    console.error('Error in getDietaryPreferences:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch dietary preferences: Unknown error');
  }
}

// ======================
// Authentication Functions
// ======================

/**
 * Signs up a new user with email, password, and name
 *
 * @param email - User's email address
 * @param password - User's password (min 6 characters)
 * @param name - User's display name
 * @returns Promise<SignUpResult> - Result containing user, session, and any error
 */
export async function signUp({
  email,
  password,
  name,
}: SignUpParams): Promise<SignUpResult> {
  try {
    // Validate inputs
    if (!email || !password || !name) {
      return {
        user: null,
        session: null,
        error: 'Email, password, and name are required',
      };
    }

    if (password.length < 6) {
      return {
        user: null,
        session: null,
        error: 'Password must be at least 6 characters',
      };
    }

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Store name in user metadata
        },
      },
    });

    if (error) {
      console.error('Error signing up:', error);
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    console.log('User signed up successfully:', data.user?.id);

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    console.error('Error in signUp:', error);
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Failed to sign up',
    };
  }
}

/**
 * Signs in an existing user with email and password
 *
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise<SignInResult> - Result containing user, session, and any error
 */
export async function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  try {
    // Validate inputs
    if (!email || !password) {
      return {
        user: null,
        session: null,
        error: 'Email and password are required',
      };
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error);
      return {
        user: null,
        session: null,
        error: error.message,
      };
    }

    console.log('User signed in successfully:', data.user?.id);

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    console.error('Error in signIn:', error);
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Failed to sign in',
    };
  }
}

/**
 * Signs out the current user
 *
 * @returns Promise<{error: string | null}> - Any error that occurred
 */
export async function signOut(): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      return { error: error.message };
    }

    console.log('User signed out successfully');
    return { error: null };
  } catch (error) {
    console.error('Error in signOut:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to sign out',
    };
  }
}

/**
 * Gets the current authenticated user
 *
 * @returns Promise<User | null> - The current user or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return data.user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Listens for authentication state changes
 *
 * @param callback - Function to call when auth state changes
 * @returns Function to unsubscribe from auth state changes
 */
export function onAuthStateChange(
  callback: AuthStateChangeCallback
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    callback(event, session);
  });

  // Return unsubscribe function
  return () => {
    data.subscription.unsubscribe();
  };
}

// =====================================================
// COMMUNITY RECIPES
// =====================================================

export interface ShareToCommunityParams {
  recipeData: RecipeAnalysis;
  complexityLevel: number;
  imageUri?: string;
}

/**
 * Share a recipe to the community feed (auto-publish)
 *
 * @param recipeData - The full recipe JSON object
 * @param complexityLevel - The complexity level (0-4)
 * @param imageUri - Optional image URI (local or remote)
 * @returns Promise<CommunityRecipe> - The shared community recipe
 * @throws Error if the share operation fails or user is not authenticated
 */
export async function shareRecipeToCommunity({
  recipeData,
  complexityLevel,
  imageUri,
}: ShareToCommunityParams): Promise<CommunityRecipe> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to share recipes');
    }

    // Validate complexity level
    if (complexityLevel < 0 || complexityLevel > 4) {
      throw new Error('Complexity level must be between 0 and 4');
    }

    let imageUrl: string | null = null;
    let imagePath: string | null = null;

    // Handle image upload if provided
    if (imageUri) {
      // Check if it's a remote URL or local URI
      if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
        imageUrl = imageUri;
        console.log('Using existing remote image URL for community recipe');
      } else {
        // Upload local image
        const { uploadRecipeImage } = await import('./storage');
        const uploadResult = await uploadRecipeImage(imageUri, currentUser.id);
        imageUrl = uploadResult.imageUrl;
        imagePath = uploadResult.imagePath;
        console.log('Image uploaded for community recipe:', imageUrl);
      }
    }

    // Insert into community_recipes table (auto-publish)
    const { data, error } = await supabase
      .from('community_recipes')
      .insert({
        user_id: currentUser.id,
        recipe_data: recipeData,
        complexity_level: complexityLevel,
        image_url: imageUrl,
        image_path: imagePath,
        is_published: true,
        save_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error sharing recipe to community:', error);
      throw new Error(`Failed to share recipe: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from share operation');
    }

    return data as CommunityRecipe;
  } catch (error) {
    console.error('Error in shareRecipeToCommunity:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while sharing the recipe');
  }
}

/**
 * Get community recipes (chronological feed for Recent tab)
 *
 * @param limit - Maximum number of recipes to return (default 50)
 * @returns Promise<CommunityRecipe[]> - Array of community recipes
 * @throws Error if the fetch operation fails
 */
export async function getCommunityRecipes(limit: number = 50): Promise<CommunityRecipe[]> {
  try {
    const { data, error } = await supabase
      .from('community_recipes')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching community recipes:', error);
      throw new Error(`Failed to load community recipes: ${error.message}`);
    }

    return (data as CommunityRecipe[]) || [];
  } catch (error) {
    console.error('Error in getCommunityRecipes:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while loading community recipes');
  }
}

/**
 * Save a community recipe to user's personal saved recipes
 *
 * @param communityRecipeId - ID of the community recipe to save
 * @param savedComplexityLevel - The complexity level to save it as
 * @returns Promise<SavedRecipe> - The newly saved recipe
 * @throws Error if the save operation fails or user is not authenticated
 */
export async function saveCommunityRecipeToMyRecipes(
  communityRecipeId: string,
  savedComplexityLevel: number
): Promise<SavedRecipe> {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('You must be logged in to save recipes');
    }

    // Validate complexity level
    if (savedComplexityLevel < 0 || savedComplexityLevel > 4) {
      throw new Error('Saved complexity level must be between 0 and 4');
    }

    // Fetch the community recipe
    const { data: communityRecipe, error: fetchError } = await supabase
      .from('community_recipes')
      .select('*')
      .eq('id', communityRecipeId)
      .single();

    if (fetchError || !communityRecipe) {
      throw new Error('Community recipe not found');
    }

    // Save to user's saved_recipes
    const { data: savedRecipe, error: saveError } = await supabase
      .from('saved_recipes')
      .insert({
        user_id: currentUser.id,
        recipe_data: communityRecipe.recipe_data,
        saved_complexity_level: savedComplexityLevel,
        image_url: communityRecipe.image_url,
        image_path: communityRecipe.image_path,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving community recipe:', saveError);
      throw new Error(`Failed to save recipe: ${saveError.message}`);
    }

    // Increment save_count on community recipe
    await supabase
      .from('community_recipes')
      .update({ save_count: (communityRecipe.save_count || 0) + 1 })
      .eq('id', communityRecipeId);

    return savedRecipe as SavedRecipe;
  } catch (error) {
    console.error('Error in saveCommunityRecipeToMyRecipes:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while saving the recipe');
  }
}

// =====================================================
// LEGAL CONSENTS
// =====================================================

/**
 * Legal Consent Record
 * Tracks user acceptance of Terms, Privacy Policy, and Content Policy
 */
export interface LegalConsent {
  id: string;
  user_id: string;
  age_verified: boolean;
  age_verified_at: string | null;
  terms_accepted: boolean;
  terms_accepted_at: string | null;
  terms_version: string | null;
  privacy_accepted: boolean;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
  content_policy_accepted: boolean;
  content_policy_accepted_at: string | null;
  content_policy_version: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Record user consent to Terms and Privacy Policy during signup
 *
 * @param userId - User's auth ID
 * @param termsVersion - Version of Terms of Service accepted
 * @param privacyVersion - Version of Privacy Policy accepted
 * @returns Promise<LegalConsent>
 */
export async function recordSignupConsents(
  userId: string,
  termsVersion: string,
  privacyVersion: string
): Promise<LegalConsent> {
  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('legal_consents')
      .insert({
        user_id: userId,
        age_verified: true,
        age_verified_at: now,
        terms_accepted: true,
        terms_accepted_at: now,
        terms_version: termsVersion,
        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_version: privacyVersion,
        content_policy_accepted: false,
        content_policy_accepted_at: null,
        content_policy_version: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error recording signup consents:', error);
      throw new Error(`Failed to record consent: ${error.message}`);
    }

    return data as LegalConsent;
  } catch (error) {
    console.error('Error in recordSignupConsents:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while recording consent');
  }
}

/**
 * Record user consent to Content Policy
 *
 * @param userId - User's auth ID
 * @param contentPolicyVersion - Version of Content Policy accepted
 * @returns Promise<void>
 */
export async function recordContentPolicyConsent(
  userId: string,
  contentPolicyVersion: string
): Promise<void> {
  try {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('legal_consents')
      .update({
        content_policy_accepted: true,
        content_policy_accepted_at: now,
        content_policy_version: contentPolicyVersion,
        updated_at: now,
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error recording content policy consent:', error);
      throw new Error(`Failed to record content policy consent: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in recordContentPolicyConsent:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while recording content policy consent');
  }
}

/**
 * Get user's current legal consents
 *
 * @returns Promise<LegalConsent | null>
 */
export async function getUserConsents(): Promise<LegalConsent | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from('legal_consents')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no record exists, return null (user hasn't accepted yet)
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error getting user consents:', error);
      throw new Error(`Failed to get consent: ${error.message}`);
    }

    return data as LegalConsent;
  } catch (error) {
    console.error('Error in getUserConsents:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unknown error occurred while getting consent');
  }
}

/**
 * Check if user has accepted Content Policy
 *
 * @returns Promise<boolean>
 */
export async function hasAcceptedContentPolicy(): Promise<boolean> {
  try {
    const consents = await getUserConsents();

    if (!consents) {
      return false;
    }

    return consents.content_policy_accepted === true;
  } catch (error) {
    console.error('Error in hasAcceptedContentPolicy:', error);
    return false;
  }
}

/**
 * Check if user needs to accept updated terms
 *
 * @param latestTermsVersion - Current version of Terms of Service
 * @param latestPrivacyVersion - Current version of Privacy Policy
 * @returns Promise<boolean>
 */
export async function needsToAcceptUpdatedTerms(
  latestTermsVersion: string,
  latestPrivacyVersion: string
): Promise<boolean> {
  try {
    const consents = await getUserConsents();

    if (!consents) {
      return true;
    }

    return (
      consents.terms_version !== latestTermsVersion ||
      consents.privacy_version !== latestPrivacyVersion
    );
  } catch (error) {
    console.error('Error in needsToAcceptUpdatedTerms:', error);
    return true;
  }
}
