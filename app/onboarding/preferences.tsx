import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { savePreferences } from '@/src/services/user-preferences';

const DIET_TYPE_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
];

export default function OnboardingPreferences() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get personal info from previous screen
  const firstName = params.firstName as string || '';
  const lastName = params.lastName as string || '';
  const referralSource = params.referralSource as string || '';

  const [allergiesInput, setAllergiesInput] = useState('');
  const [dislikesInput, setDislikesInput] = useState('');
  const [selectedDietType, setSelectedDietType] = useState('None');

  const handleSkip = async () => {
    try {
      // Navigate to signup with personal info, skipping preferences
      router.push({
        pathname: '/auth/signup',
        params: {
          firstName,
          lastName,
          referralSource,
        },
      });
    } catch (error) {
      console.error('Error navigating to signup:', error);
    }
  };

  const handleContinue = async () => {
    try {
      // Parse inputs
      const allergies = allergiesInput
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const dislikes = dislikesInput
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // Navigate to signup with all collected data
      router.push({
        pathname: '/auth/signup',
        params: {
          firstName,
          lastName,
          referralSource,
          allergies: JSON.stringify(allergies),
          dislikes: JSON.stringify(dislikes),
          dietType: selectedDietType,
        },
      });
    } catch (error) {
      console.error('Error navigating to signup:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <Text style={styles.title}>Any dietary restrictions?</Text>
        <Text style={styles.subtitle}>
          Optional - helps us tailor recipes to your needs
        </Text>

        {/* Allergies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Allergies</Text>
          <Text style={styles.sectionHint}>Separate with commas</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., peanuts, shellfish, dairy"
            placeholderTextColor="#636366"
            value={allergiesInput}
            onChangeText={setAllergiesInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Dislikes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dislikes</Text>
          <Text style={styles.sectionHint}>Foods you'd prefer to avoid</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., mushrooms, cilantro, olives"
            placeholderTextColor="#636366"
            value={dislikesInput}
            onChangeText={setDislikesInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Diet Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Diet Type</Text>
          <View style={styles.dietTypeContainer}>
            {DIET_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.dietTypeChip,
                  selectedDietType === option && styles.dietTypeChipSelected,
                ]}
                onPress={() => setSelectedDietType(option)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dietTypeChipText,
                    selectedDietType === option && styles.dietTypeChipTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
  },
  skipButton: {
    padding: 8,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#A4E900',
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#98989D',
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 14,
    color: '#98989D',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  dietTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dietTypeChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  dietTypeChipSelected: {
    backgroundColor: '#A4E900',
    borderColor: '#A4E900',
  },
  dietTypeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#98989D',
  },
  dietTypeChipTextSelected: {
    color: '#000000',
  },
  buttonContainer: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    backgroundColor: '#000000',
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A4E900',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: '#A4E900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
