import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '@/src/services/revenuecat';
import { updateSubscriptionStatus } from '@/src/services/subscription';
import { getCurrentUser } from '@/src/services/supabase';
import { LEGAL_URLS } from '@/src/constants/legal';

interface Package {
  identifier: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    price: string;
    priceString: string;
  };
}

export default function PaywallScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

  // Fetch available subscription packages
  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    try {
      setIsLoading(true);
      const offerings = await getOfferings();

      if (offerings && offerings.availablePackages) {
        setPackages(offerings.availablePackages as Package[]);
        // Pre-select the first package (usually monthly)
        if (offerings.availablePackages.length > 0) {
          setSelectedPackage(offerings.availablePackages[0] as Package);
        }
      } else {
        console.log('No offerings available');
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription options. Please try again later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handlePurchase = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription option');
      return;
    }

    try {
      setIsPurchasing(true);

      // Purchase the selected package
      const customerInfo = await purchasePackage(selectedPackage);

      // Check if purchase was successful
      if (customerInfo.entitlements.active['premium']) {
        // Update Supabase subscription status
        const user = await getCurrentUser();
        if (user) {
          // Determine subscription type from package identifier
          const isAnnual = selectedPackage.identifier.toLowerCase().includes('annual');
          const subscriptionType = isAnnual ? 'annual' : 'monthly';

          // Calculate expiration date (rough estimate)
          const expiresAt = new Date();
          if (isAnnual) {
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
          } else {
            expiresAt.setMonth(expiresAt.getMonth() + 1);
          }

          await updateSubscriptionStatus(
            user.id,
            true,
            subscriptionType,
            expiresAt.toISOString()
          );
        }

        // Show success message
        Alert.alert(
          'Welcome to Premium!',
          'You now have unlimited access to all features.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error purchasing subscription:', error);

      // Handle user cancellation
      if (error.userCancelled) {
        // User cancelled, do nothing
        return;
      }

      Alert.alert(
        'Purchase Failed',
        error.message || 'Failed to complete purchase. Please try again.'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsPurchasing(true);

      // DEV MODE: Auto-grant premium access
      const user = await getCurrentUser();
      if (user) {
        // Grant 1 year of premium
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);

        await updateSubscriptionStatus(
          user.id,
          true,
          'annual',
          expiresAt.toISOString()
        );

        Alert.alert(
          'Premium Unlocked!',
          'You now have 1 year of premium access for testing.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.back();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error granting premium:', error);
      Alert.alert(
        'Error',
        'Failed to grant premium access. Please try again.'
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderBenefit = (icon: string, text: string) => (
    <View style={styles.benefitRow} key={text}>
      <View style={styles.checkmarkCircle}>
        <Ionicons name="checkmark" size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );

  const renderPackageCard = (pkg: Package, index: number) => {
    const isSelected = selectedPackage?.identifier === pkg.identifier;
    const isAnnual = pkg.identifier.toLowerCase().includes('annual');

    return (
      <TouchableOpacity
        key={pkg.identifier}
        style={[styles.packageCard, isSelected && styles.packageCardSelected]}
        onPress={() => setSelectedPackage(pkg)}
        activeOpacity={0.7}
      >
        {isAnnual && (
          <View style={styles.saveBadge}>
            <Text style={styles.saveBadgeText}>Save £8!</Text>
          </View>
        )}
        <View style={styles.packageHeader}>
          <Text style={styles.packageTitle}>
            {isAnnual ? 'Annual' : 'Monthly'}
          </Text>
          <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
          {isAnnual && (
            <Text style={styles.packageSubtext}>£3.25/month</Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#A4E900" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>Start Your Free Trial</Text>
            <Text style={styles.subtitle}>3 days free, then £3.99/month</Text>
          </View>

          {/* Benefits Section */}
          <View style={styles.benefitsSection}>
            {renderBenefit('checkmark', 'Full access to all features')}
            {renderBenefit('checkmark', 'Analyse unlimited recipes')}
            {renderBenefit('checkmark', 'Save unlimited recipes')}
            {renderBenefit('checkmark', 'Cancel anytime during trial')}
          </View>

          {/* Subscription Packages */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A4E900" />
              <Text style={styles.loadingText}>Loading options...</Text>
            </View>
          ) : packages.length > 0 ? (
            <View style={styles.packagesSection}>
              {packages.map((pkg, index) => renderPackageCard(pkg, index))}
            </View>
          ) : (
            <View style={styles.noPackagesContainer}>
              <Text style={styles.noPackagesText}>
                No subscription options available at this time.
              </Text>
            </View>
          )}

          {/* Continue Button */}
          {!isLoading && packages.length > 0 && (
            <TouchableOpacity
              style={[
                styles.continueButton,
                (isPurchasing || !selectedPackage) &&
                  styles.continueButtonDisabled,
              ]}
              onPress={handlePurchase}
              activeOpacity={0.8}
              disabled={isPurchasing || !selectedPackage}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#000000" />
              ) : (
                <Text style={styles.continueButtonText}>Start Free Trial</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Restore Purchases Link */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={isPurchasing}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL(LEGAL_URLS.TERMS_OF_SERVICE)}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              style={styles.termsLink}
              onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY_POLICY)}
            >
              Privacy Policy
            </Text>
            . Subscription automatically renews unless cancelled.
          </Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerSpacer: {
    width: 40,
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#98989D',
    textAlign: 'center',
  },
  benefitsSection: {
    marginBottom: 32,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmarkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#A4E900',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  packagesSection: {
    marginBottom: 24,
  },
  packageCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  packageCardSelected: {
    borderColor: '#A4E900',
    borderWidth: 2,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#A4E900',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  packageHeader: {
    alignItems: 'center',
  },
  packageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  packagePrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A4E900',
    marginBottom: 4,
  },
  packageSubtext: {
    fontSize: 14,
    color: '#98989D',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  continueButton: {
    backgroundColor: '#A4E900',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#A4E900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#4A5C3A',
    opacity: 0.6,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    color: '#A4E900',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#98989D',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#A4E900',
    textDecorationLine: 'underline',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#98989D',
  },
  noPackagesContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noPackagesText: {
    fontSize: 16,
    color: '#98989D',
    textAlign: 'center',
  },
});
