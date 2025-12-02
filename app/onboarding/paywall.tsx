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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  getOfferings,
  purchasePackage,
} from '@/src/services/revenuecat';
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

export default function OnboardingPaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get user data from previous screens
  const firstName = params.firstName as string || '';
  const lastName = params.lastName as string || '';
  const referralSource = params.referralSource as string || '';
  const allergies = params.allergies as string || '[]';
  const dislikes = params.dislikes as string || '[]';
  const dietType = params.dietType as string || 'None';

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
        // Pre-select the first package (usually monthly with free trial)
        if (offerings.availablePackages.length > 0) {
          setSelectedPackage(offerings.availablePackages[0] as Package);
        }
      } else {
        console.log('No offerings available');
        Alert.alert(
          'Error',
          'Unable to load subscription options. Please try again.',
          [
            {
              text: 'Retry',
              onPress: () => loadOfferings(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert(
        'Error',
        'Failed to load subscription options. Please check your connection and try again.',
        [
          {
            text: 'Retry',
            onPress: () => loadOfferings(),
          },
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleStartTrial = async () => {
    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a subscription option');
      return;
    }

    try {
      setIsPurchasing(true);

      // In Expo Go test mode, this will simulate the purchase
      // In production, this will trigger Apple's payment flow
      const customerInfo = await purchasePackage(selectedPackage);

      // Check if purchase was successful
      if (customerInfo.entitlements.active['premium']) {
        // Navigate to signup with all collected data + subscription info
        router.push({
          pathname: '/auth/signup',
          params: {
            firstName,
            lastName,
            referralSource,
            allergies,
            dislikes,
            dietType,
            hasSubscription: 'true', // Mark user as subscribed
          },
        });
      }
    } catch (error: any) {
      console.error('Error starting trial:', error);

      // Handle user cancellation
      if (error.userCancelled) {
        // User cancelled, do nothing
        return;
      }

      Alert.alert(
        'Unable to Start Trial',
        'There was a problem starting your free trial. Please try again.',
        [
          {
            text: 'OK',
          },
        ]
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderBenefit = (icon: string, text: string) => (
    <View style={styles.benefitRow} key={text}>
      <View style={styles.checkmarkCircle}>
        <Ionicons name="checkmark" size={18} color="#000000" />
      </View>
      <Text style={styles.benefitText}>{text}</Text>
    </View>
  );

  const renderPackageCard = (pkg: Package) => {
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalOverlay}
      keyboardVerticalOffset={0}
    >
      <View style={styles.modalKeyboardView}>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Start Your Free Trial</Text>
                <Text style={styles.subtitle}>3 days free, then £3.99/month</Text>
              </View>

              {/* Benefits Section */}
              <View style={styles.benefitsSection}>
                {renderBenefit('checkmark', 'Unlimited recipe analysis')}
                {renderBenefit('checkmark', 'Save unlimited recipes')}
                {renderBenefit('checkmark', 'Access community library')}
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
                  {packages.map((pkg) => renderPackageCard(pkg))}
                </View>
              ) : (
                <View style={styles.noPackagesContainer}>
                  <Text style={styles.noPackagesText}>
                    Unable to load subscription options.
                  </Text>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={loadOfferings}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
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
                  onPress={handleStartTrial}
                  activeOpacity={0.8}
                  disabled={isPurchasing || !selectedPackage}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <Text style={styles.continueButtonText}>Start Free Trial</Text>
                      <Ionicons name="arrow-forward" size={20} color="#000000" />
                    </>
                  )}
                </TouchableOpacity>
              )}

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
                . Subscription automatically renews unless cancelled at least 24 hours before the end of the trial period.
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
  },
  modalKeyboardView: {
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 20,
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
    color: '#000000',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A4E900',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
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
    marginRight: 8,
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#A4E900',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
