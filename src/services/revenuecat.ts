import Purchases, { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get RevenueCat API key from environment
const revenueCatApiKey = Constants.expoConfig?.extra?.revenuecatApiKey;

if (!revenueCatApiKey) {
  throw new Error(
    'RevenueCat API key not found. Please ensure REVENUECAT_API_KEY is set in your .env file and app.config.js is properly configured.'
  );
}

// Flag to track if we're in test mode (Expo Go without native store)
let isTestMode = false;

/**
 * Initializes RevenueCat SDK and sets the user ID
 *
 * @param userId - The user's ID from Supabase auth
 * @returns Promise<void>
 */
export async function initializeRevenueCat(userId: string): Promise<void> {
  try {
    // Configure Purchases SDK with API key
    if (Platform.OS === 'ios') {
      await Purchases.configure({ apiKey: revenueCatApiKey });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({ apiKey: revenueCatApiKey });
    }

    // Set the user ID for tracking
    await Purchases.logIn(userId);

    console.log('RevenueCat initialized successfully for user:', userId);
    isTestMode = false;
  } catch (error: any) {
    // Check if this is the Expo Go error
    if (error.message?.includes('native store is not available') ||
        error.message?.includes('Expo Go') ||
        error.message?.includes('Test Store')) {
      console.warn('⚠️ Running in Expo Go - using mock subscription data for testing');
      console.warn('To use real subscriptions, build a development build or use Test Store API key');
      isTestMode = true;
      // Don't throw - allow app to continue with mock data
      return;
    }

    // For other errors, still throw
    console.error('Error initializing RevenueCat:', error);
    throw new Error(
      `Failed to initialize RevenueCat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Checks if the user has an active premium subscription
 *
 * @returns Promise<boolean> - True if user has premium access
 * @throws Error if check fails
 */
export async function checkSubscriptionStatus(): Promise<boolean> {
  // Return mock data in test mode
  if (isTestMode) {
    console.log('Test mode: Returning mock subscription status (not premium)');
    return false;
  }

  try {
    const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();

    // Check if user has active premium entitlement
    // You'll need to configure this entitlement in RevenueCat dashboard
    const isPremium =
      typeof customerInfo.entitlements.active['premium'] !== 'undefined';

    console.log('Subscription status checked:', { isPremium });

    return isPremium;
  } catch (error) {
    console.error('Error checking subscription status:', error);
    throw new Error(
      `Failed to check subscription status: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets the current customer info from RevenueCat
 *
 * @returns Promise<CustomerInfo> - The customer info object
 * @throws Error if fetch fails
 */
export async function getCustomerInfo(): Promise<CustomerInfo> {
  // Return mock data in test mode
  if (isTestMode) {
    console.log('Test mode: Returning mock customer info');
    return {
      entitlements: { active: {} },
    } as CustomerInfo;
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error getting customer info:', error);
    throw new Error(
      `Failed to get customer info: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Gets available offerings (subscription products) from RevenueCat
 *
 * @returns Promise<PurchasesOffering | null> - The current offering or null
 * @throws Error if fetch fails
 */
export async function getOfferings(): Promise<PurchasesOffering | null> {
  // Return mock data in test mode
  if (isTestMode) {
    console.log('Test mode: Returning mock offerings');
    return {
      availablePackages: [
        {
          identifier: '$rc_monthly',
          product: {
            identifier: 'monthly_subscription',
            title: 'Monthly Premium',
            description: 'Premium subscription - Monthly',
            price: 3.99,
            priceString: '£3.99/month',
          },
        },
        {
          identifier: '$rc_annual',
          product: {
            identifier: 'annual_subscription',
            title: 'Annual Premium',
            description: 'Premium subscription - Annual',
            price: 39.00,
            priceString: '£39/year',
          },
        },
      ],
    } as PurchasesOffering;
  }

  try {
    const offerings = await Purchases.getOfferings();

    if (offerings.current !== null) {
      console.log('Available offerings:', offerings.current.availablePackages);
      return offerings.current;
    }

    console.log('No offerings available');
    return null;
  } catch (error) {
    console.error('Error getting offerings:', error);
    throw new Error(
      `Failed to get offerings: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Purchases a package from RevenueCat
 *
 * @param packageToPurchase - The package to purchase
 * @returns Promise<CustomerInfo> - Updated customer info after purchase
 * @throws Error if purchase fails
 */
export async function purchasePackage(
  packageToPurchase: any
): Promise<CustomerInfo> {
  // Mock purchase in test mode
  if (isTestMode) {
    console.log('Test mode: Simulating successful purchase of:', packageToPurchase?.identifier);
    return {
      entitlements: {
        active: {
          premium: {
            identifier: 'premium',
            isActive: true,
          },
        },
      },
    } as CustomerInfo;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    console.log('Purchase successful:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('Error purchasing package:', error);
    throw new Error(
      `Failed to purchase package: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Restores previous purchases
 *
 * @returns Promise<CustomerInfo> - Updated customer info after restore
 * @throws Error if restore fails
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  // Mock restore in test mode
  if (isTestMode) {
    console.log('Test mode: Simulating restore purchases (no purchases found)');
    return {
      entitlements: { active: {} },
    } as CustomerInfo;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('Purchases restored:', customerInfo);
    return customerInfo;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw new Error(
      `Failed to restore purchases: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Logs out the current user from RevenueCat
 *
 * @returns Promise<void>
 */
export async function logOutRevenueCat(): Promise<void> {
  // Skip logout in test mode
  if (isTestMode) {
    console.log('Test mode: Skipping RevenueCat logout');
    return;
  }

  try {
    await Purchases.logOut();
    console.log('Logged out from RevenueCat');
  } catch (error) {
    console.error('Error logging out from RevenueCat:', error);
    throw new Error(
      `Failed to log out from RevenueCat: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
