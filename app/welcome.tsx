import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signUp, signIn, saveUserProfile, saveDietaryPreferences, recordSignupConsents } from '@/src/services/supabase';
import { ActionSheetIOS } from 'react-native';
import { LegalCheckbox } from '@/src/components/LegalCheckbox';
import { LEGAL_URLS, LEGAL_VERSIONS } from '@/src/constants/legal';

const REFERRAL_SOURCES = [
  'Select one...',
  'Instagram',
  'TikTok',
  'Friend/Family',
  'Search Engine (Google, etc.)',
  'Other Social Media',
  'Other',
];

const DIET_TYPE_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
];

type OnboardingStep = 'how-it-works' | 'personal-info' | 'preferences' | 'signup' | 'login';

export default function WelcomeScreen() {
  const router = useRouter();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('how-it-works');

  // Personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralSource, setReferralSource] = useState(REFERRAL_SOURCES[0]);

  // Preferences
  const [allergiesInput, setAllergiesInput] = useState('');
  const [dislikesInput, setDislikesInput] = useState('');
  const [selectedDietType, setSelectedDietType] = useState('None');

  // Signup/Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Legal consents
  const [ageVerified, setAgeVerified] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleGetStarted = () => {
    setShowModal(true);
    setCurrentStep('how-it-works');
  };

  const handleNextFromHowItWorks = () => {
    setCurrentStep('personal-info');
  };

  const handleNextFromPersonalInfo = () => {
    // Validation
    if (!firstName.trim()) {
      Alert.alert('Required Field', 'Please enter your first name');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Required Field', 'Please enter your last name');
      return;
    }
    if (referralSource === REFERRAL_SOURCES[0]) {
      Alert.alert('Required Field', 'Please let us know where you heard about us');
      return;
    }

    setCurrentStep('preferences');
  };

  const handleSkipPreferences = () => {
    setCurrentStep('signup');
  };

  const handleContinueFromPreferences = () => {
    setCurrentStep('signup');
  };

  const handleSwitchToLogin = () => {
    setCurrentStep('login');
    setShowModal(true);
  };

  const handleSwitchToSignup = () => {
    setCurrentStep('signup');
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignup = async () => {
    // Legal consent validation (MUST be first for COPPA compliance)
    if (!ageVerified) {
      Alert.alert('Age Verification Required', 'You must be 13 years or older to use Recipe Killer AI');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Acceptance Required', 'Please accept the Terms of Service and Privacy Policy to continue');
      return;
    }

    // Standard validation
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Please enter a password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // Sign up with Supabase
      const result = await signUp({
        email: email.trim(),
        password: password,
        name: `${firstName} ${lastName}`.trim(),
      });

      if (result.error) {
        Alert.alert('Sign Up Failed', result.error);
        setIsLoading(false);
        return;
      }

      if (result.user) {
        // Save user profile with name and referral source
        try {
          await saveUserProfile(
            result.user.id,
            firstName.trim(),
            lastName.trim(),
            referralSource !== REFERRAL_SOURCES[0] ? referralSource : undefined
          );
          console.log('User profile saved successfully');
        } catch (error) {
          console.error('Error saving user profile:', error);
          // Don't block signup if profile save fails
        }

        // Save dietary preferences to database if provided
        try {
          const allergies = allergiesInput
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          const dislikes = dislikesInput
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);

          if (allergies.length > 0 || dislikes.length > 0 || selectedDietType !== 'None') {
            await saveDietaryPreferences(allergies, dislikes, selectedDietType);
            console.log('Dietary preferences saved to database');
          }
        } catch (error) {
          console.error('Error saving dietary preferences:', error);
          // Don't block signup if preferences save fails
        }

        // Record legal consents (GDPR compliance)
        try {
          await recordSignupConsents(
            result.user.id,
            LEGAL_VERSIONS.TERMS,
            LEGAL_VERSIONS.PRIVACY
          );
          console.log('Legal consents recorded successfully');
        } catch (error) {
          console.error('Error recording legal consents:', error);
          // Don't block signup if consent recording fails (already have user agreement)
        }

        // Mark onboarding as complete
        await AsyncStorage.setItem('onboardingComplete_v2', 'true');

        // Close modal first
        setShowModal(false);

        // Small delay to ensure AsyncStorage write completes
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Error', 'Sign up failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email address');
      return;
    }

    if (!password) {
      Alert.alert('Validation Error', 'Please enter a password');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn(email.trim(), password);

      if (result.error) {
        Alert.alert('Login Failed', result.error);
        setIsLoading(false);
        return;
      }

      if (result.user) {
        // Mark onboarding as complete
        await AsyncStorage.setItem('onboardingComplete_v2', 'true');

        // Close modal first
        setShowModal(false);
        setIsLoading(false);

        // Small delay to ensure AsyncStorage write completes
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 100);
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 'how-it-works') {
      setShowModal(false);
    } else if (currentStep === 'personal-info') {
      setCurrentStep('how-it-works');
    } else if (currentStep === 'preferences') {
      setCurrentStep('personal-info');
    } else if (currentStep === 'signup') {
      setCurrentStep('preferences');
    } else if (currentStep === 'login') {
      setCurrentStep('signup');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Background image */}
        <ImageBackground
          source={require('@/assets/images/peas-dill-background.jpg')}
          style={styles.backgroundGradient}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            {/* Logo/Title */}
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Recipe Killer</Text>
            </View>

            {/* Tagline and CTA */}
            <View style={styles.callToActionContainer}>
              <Text style={styles.tagline}>
                Turn restaurant dishes into weeknight wins
              </Text>

              {/* Get Started Button */}
              <TouchableOpacity
                style={styles.getStartedButton}
                onPress={handleGetStarted}
                activeOpacity={0.9}
              >
                <Text style={styles.getStartedText}>Get Started</Text>
              </TouchableOpacity>

              {/* Sign In Link */}
              <View style={styles.signInLinkContainer}>
                <Text style={styles.signInPrompt}>Already have an account? </Text>
                <TouchableOpacity onPress={handleSwitchToLogin} activeOpacity={0.7}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>

        {/* Onboarding Modal */}
        <Modal
          visible={showModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
            keyboardVerticalOffset={0}
          >
            <View style={styles.modalKeyboardView}>
              <BlurView intensity={80} tint="dark" style={styles.blurView}>
                <View style={styles.modalContent}>
                  {/* Header with Back Button */}
                  <View style={styles.modalHeader}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBack}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {currentStep === 'preferences' && (
                      <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkipPreferences}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.skipButtonText}>Skip</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}
                  >
                  {currentStep === 'how-it-works' && (
                    <HowItWorksContent onNext={handleNextFromHowItWorks} />
                  )}

                  {currentStep === 'personal-info' && (
                    <PersonalInfoContent
                      firstName={firstName}
                      setFirstName={setFirstName}
                      lastName={lastName}
                      setLastName={setLastName}
                      referralSource={referralSource}
                      setReferralSource={setReferralSource}
                      onNext={handleNextFromPersonalInfo}
                    />
                  )}

                  {currentStep === 'preferences' && (
                    <PreferencesContent
                      allergiesInput={allergiesInput}
                      setAllergiesInput={setAllergiesInput}
                      dislikesInput={dislikesInput}
                      setDislikesInput={setDislikesInput}
                      selectedDietType={selectedDietType}
                      setSelectedDietType={setSelectedDietType}
                      onContinue={handleContinueFromPreferences}
                    />
                  )}

                  {currentStep === 'signup' && (
                    <SignupContent
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      confirmPassword={confirmPassword}
                      setConfirmPassword={setConfirmPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      showConfirmPassword={showConfirmPassword}
                      setShowConfirmPassword={setShowConfirmPassword}
                      ageVerified={ageVerified}
                      setAgeVerified={setAgeVerified}
                      termsAccepted={termsAccepted}
                      setTermsAccepted={setTermsAccepted}
                      isLoading={isLoading}
                      onSignup={handleSignup}
                      onSwitchToLogin={handleSwitchToLogin}
                    />
                  )}

                  {currentStep === 'login' && (
                    <LoginContent
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      isLoading={isLoading}
                      onLogin={handleLogin}
                      onSwitchToSignup={handleSwitchToSignup}
                    />
                  )}
                  </ScrollView>
                </View>
              </BlurView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </>
  );
}

// How It Works Content Component
function HowItWorksContent({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>How It Works</Text>
      <Text style={styles.stepSubtitle}>Three simple steps to better recipes</Text>

      <View style={styles.stepsContainer}>
        <Step
          icon="camera"
          number="1"
          title="Upload or paste any recipe"
          description="Take a photo or copy text from any source"
        />
        <Step
          icon="options"
          number="2"
          title="Slide to simplify"
          description="Choose from 5 complexity levels to match your time"
        />
        <Step
          icon="bookmark"
          number="3"
          title="Save your favorites"
          description="Keep recipes you love for quick access later"
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={onNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#1C1C1C" />
      </TouchableOpacity>
    </View>
  );
}

function Step({ icon, number, title, description }: { icon: keyof typeof Ionicons.glyphMap; number: string; title: string; description: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIconContainer}>
        <Ionicons name={icon} size={28} color="#9FE870" />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepNumber}>{number}</Text>
        <Text style={styles.stepItemTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

// Personal Info Content Component
function PersonalInfoContent({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  referralSource,
  setReferralSource,
  onNext,
}: {
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  referralSource: string;
  setReferralSource: (val: string) => void;
  onNext: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Tell us about yourself</Text>
      <Text style={styles.stepSubtitle}>We'd love to get to know you</Text>

      <View style={styles.formSection}>
        <Text style={styles.label}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your first name"
          placeholderTextColor="#666666"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your last name"
          placeholderTextColor="#666666"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Where did you hear about us?</Text>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => {
            if (Platform.OS === 'ios') {
              ActionSheetIOS.showActionSheetWithOptions(
                {
                  options: ['Cancel', ...REFERRAL_SOURCES.slice(1)],
                  cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                  if (buttonIndex > 0) {
                    setReferralSource(REFERRAL_SOURCES[buttonIndex]);
                  }
                }
              );
            } else {
              Alert.alert(
                'Where did you hear about us?',
                '',
                REFERRAL_SOURCES.slice(1).map((source) => ({
                  text: source,
                  onPress: () => setReferralSource(source),
                })).concat([{ text: 'Cancel', style: 'cancel' }])
              );
            }
          }}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.pickerButtonText,
            referralSource === REFERRAL_SOURCES[0] && styles.pickerPlaceholder
          ]}>
            {referralSource}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#9FE870" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={onNext}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#1C1C1C" />
      </TouchableOpacity>
    </View>
  );
}

// Preferences Content Component
function PreferencesContent({
  allergiesInput,
  setAllergiesInput,
  dislikesInput,
  setDislikesInput,
  selectedDietType,
  setSelectedDietType,
  onContinue,
}: {
  allergiesInput: string;
  setAllergiesInput: (val: string) => void;
  dislikesInput: string;
  setDislikesInput: (val: string) => void;
  selectedDietType: string;
  setSelectedDietType: (val: string) => void;
  onContinue: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Dietary Preferences</Text>
      <Text style={styles.stepSubtitle}>Help us personalize your recipes</Text>

      <View style={styles.formSection}>
        <Text style={styles.label}>Allergies</Text>
        <Text style={styles.hint}>Separate with commas</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., peanuts, shellfish, dairy"
          placeholderTextColor="#666666"
          value={allergiesInput}
          onChangeText={setAllergiesInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Dislikes</Text>
        <Text style={styles.hint}>Foods you'd prefer to avoid</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., mushrooms, cilantro, olives"
          placeholderTextColor="#666666"
          value={dislikesInput}
          onChangeText={setDislikesInput}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.formSection}>
        <Text style={styles.label}>Diet Type</Text>
        <View style={styles.dietTypeContainer}>
          {DIET_TYPE_OPTIONS.map((diet) => (
            <TouchableOpacity
              key={diet}
              style={[
                styles.dietTypeChip,
                selectedDietType === diet && styles.dietTypeChipSelected,
              ]}
              onPress={() => setSelectedDietType(diet)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dietTypeChipText,
                  selectedDietType === diet && styles.dietTypeChipTextSelected,
                ]}
              >
                {diet}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={onContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
        <Ionicons name="arrow-forward" size={20} color="#1C1C1C" />
      </TouchableOpacity>
    </View>
  );
}

// Signup Content Component
function SignupContent({
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  ageVerified,
  setAgeVerified,
  termsAccepted,
  setTermsAccepted,
  isLoading,
  onSignup,
  onSwitchToLogin,
}: {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (val: boolean) => void;
  ageVerified: boolean;
  setAgeVerified: (val: boolean) => void;
  termsAccepted: boolean;
  setTermsAccepted: (val: boolean) => void;
  isLoading: boolean;
  onSignup: () => void;
  onSwitchToLogin: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create Account</Text>
      <Text style={styles.stepSubtitle}>Join Recipe Killer today</Text>

      {/* Legal Consent Checkboxes */}
      <View style={styles.formSection}>
        <LegalCheckbox
          checked={ageVerified}
          onCheckChange={setAgeVerified}
          label="I confirm I am 13 years or older"
        />
        <View style={{ marginTop: 12 }}>
          <LegalCheckbox
            checked={termsAccepted}
            onCheckChange={setTermsAccepted}
            label="I agree to the "
            linkText="Terms of Service"
            linkUrl={LEGAL_URLS.TERMS_OF_SERVICE}
            additionalLinkText=" and Privacy Policy"
            additionalLinkUrl={LEGAL_URLS.PRIVACY_POLICY}
          />
        </View>
      </View>

      {/* Email Input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#9FE870"
            style={styles.inputIconLeft}
          />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="your.email@example.com"
            placeholderTextColor="#666666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9FE870"
            style={styles.inputIconLeft}
          />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="At least 6 characters"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9FE870"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Confirm Password Input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Confirm Password</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9FE870"
            style={styles.inputIconLeft}
          />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="Re-enter your password"
            placeholderTextColor="#666666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoComplete="password-new"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={isLoading}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9FE870"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
        onPress={onSignup}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#1C1C1C" />
        ) : (
          <Text style={styles.nextButtonText}>Sign Up</Text>
        )}
      </TouchableOpacity>

      {/* Login Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginPrompt}>Already have an account? </Text>
        <TouchableOpacity onPress={onSwitchToLogin} disabled={isLoading}>
          <Text style={styles.loginLink}>Log in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Login Content Component
function LoginContent({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isLoading,
  onLogin,
  onSwitchToSignup,
}: {
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  showPassword: boolean;
  setShowPassword: (val: boolean) => void;
  isLoading: boolean;
  onLogin: () => void;
  onSwitchToSignup: () => void;
}) {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Welcome Back</Text>
      <Text style={styles.stepSubtitle}>Log in to your account</Text>

      {/* Email Input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="mail-outline"
            size={20}
            color="#9FE870"
            style={styles.inputIconLeft}
          />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="your.email@example.com"
            placeholderTextColor="#666666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
      </View>

      {/* Password Input */}
      <View style={styles.formSection}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWithIcon}>
          <Ionicons
            name="lock-closed-outline"
            size={20}
            color="#9FE870"
            style={styles.inputIconLeft}
          />
          <TextInput
            style={styles.inputWithPadding}
            placeholder="Enter your password"
            placeholderTextColor="#666666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoComplete="password"
            autoCorrect={false}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={isLoading}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#9FE870"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
        onPress={onLogin}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#1C1C1C" />
        ) : (
          <Text style={styles.nextButtonText}>Log In</Text>
        )}
      </TouchableOpacity>

      {/* Sign Up Link */}
      <View style={styles.loginContainer}>
        <Text style={styles.loginPrompt}>Don't have an account? </Text>
        <TouchableOpacity onPress={onSwitchToSignup} disabled={isLoading}>
          <Text style={styles.loginLink}>Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  backgroundGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(28, 28, 28, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  callToActionContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  tagline: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 28,
    opacity: 0.9,
  },
  getStartedButton: {
    backgroundColor: '#9FE870',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#9FE870',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1C',
    letterSpacing: 0.5,
  },
  signInLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
  },
  signInPrompt: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  signInLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9FE870',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    height: '70%',
  },
  blurView: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(28, 28, 28, 0.70)',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#9FE870',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#AAAAAA',
    marginBottom: 24,
  },
  // How it works styles
  stepsContainer: {
    gap: 24,
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2C2C2C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#9FE870',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9FE870',
    marginBottom: 4,
  },
  stepItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#AAAAAA',
  },
  // Form styles
  formSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  hint: {
    fontSize: 12,
    color: '#AAAAAA',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#3C3C3C',
  },
  pickerButton: {
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3C3C3C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 50,
  },
  pickerButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    flex: 1,
  },
  pickerPlaceholder: {
    color: '#666666',
  },
  dietTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dietTypeChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#2C2C2C',
    borderWidth: 2,
    borderColor: '#3C3C3C',
  },
  dietTypeChipSelected: {
    backgroundColor: '#9FE870',
    borderColor: '#9FE870',
  },
  dietTypeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  dietTypeChipTextSelected: {
    color: '#1C1C1C',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9FE870',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#9FE870',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 8,
  },
  nextButtonText: {
    color: '#1C1C1C',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  // Input with icons styles
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3C3C3C',
    paddingHorizontal: 16,
    height: 50,
  },
  inputIconLeft: {
    marginRight: 12,
  },
  inputWithPadding: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  // Login/Signup link styles
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginPrompt: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  loginLink: {
    fontSize: 14,
    color: '#9FE870',
    fontWeight: '600',
  },
});
