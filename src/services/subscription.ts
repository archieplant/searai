import { supabase } from './supabase';

export interface UserSubscription {
  id: number;
  user_id: string;
  is_premium: boolean;
  subscription_type: 'monthly' | 'annual' | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/**
 * Gets or creates a subscription record for a user
 *
 * @param userId - The user's ID
 * @returns Promise<UserSubscription> - The user's subscription record
 * @throws Error if operation fails
 */
async function getOrCreateSubscription(userId: string): Promise<UserSubscription> {
  try {
    // Try to get existing subscription
    const { data: existing, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return existing as UserSubscription;
    }

    // Create new subscription record if none exists
    const { data: newRecord, error: insertError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        is_premium: false,
        subscription_type: null,
        started_at: null,
        expires_at: null,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return newRecord as UserSubscription;
  } catch (error) {
    console.error('Error getting or creating subscription:', error);
    throw new Error(
      `Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Updates a user's subscription status (called from webhook or after purchase)
 *
 * @param userId - The user's ID
 * @param isPremium - Premium status
 * @param subscriptionType - Type of subscription
 * @param expiresAt - Expiration date
 * @returns Promise<void>
 * @throws Error if update fails
 */
export async function updateSubscriptionStatus(
  userId: string,
  isPremium: boolean,
  subscriptionType: 'monthly' | 'annual' | null,
  expiresAt: string | null
): Promise<void> {
  try {
    const updateData: any = {
      is_premium: isPremium,
      subscription_type: subscriptionType,
      expires_at: expiresAt,
    };

    // Set started_at if becoming premium
    if (isPremium) {
      updateData.started_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('user_subscriptions')
      .update(updateData)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    console.log('Subscription status updated:', {
      userId,
      isPremium,
      subscriptionType,
    });
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw new Error(
      `Failed to update subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the user's current subscription details
 *
 * @param userId - The user's ID
 * @returns Promise<UserSubscription> - The subscription record
 * @throws Error if fetch fails
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
  try {
    return await getOrCreateSubscription(userId);
  } catch (error) {
    console.error('Error getting user subscription:', error);
    throw new Error(
      `Failed to get user subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the user's subscription status (simplified version for UI)
 *
 * @param userId - The user's ID
 * @returns Promise<{isPremium: boolean, expiresAt: string | null}> - Subscription status
 * @throws Error if fetch fails
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<{ isPremium: boolean; expiresAt: string | null }> {
  try {
    const subscription = await getOrCreateSubscription(userId);

    // Check if subscription is still valid
    const isPremium: boolean =
      !!subscription.is_premium &&
      !!subscription.expires_at &&
      new Date(subscription.expires_at) > new Date();

    return {
      isPremium,
      expiresAt: subscription.expires_at,
    };
  } catch (error) {
    console.error('Error getting subscription status:', error);
    throw new Error(
      `Failed to get subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the total count of recipes analyzed by the user (for stats display only)
 *
 * @param userId - The user's ID
 * @returns Promise<number> - Total number of analyses
 * @throws Error if fetch fails
 */
export async function getTotalAnalysesCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('recipe_analyses')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table doesn't exist yet
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting total analyses count:', error);
    return 0; // Return 0 if there's an error rather than failing
  }
}
