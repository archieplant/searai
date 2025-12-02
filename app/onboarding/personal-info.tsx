import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

const REFERRAL_SOURCES = [
  'Select one...',
  'Instagram',
  'TikTok',
  'Friend/Family',
  'Search Engine (Google, etc.)',
  'Other Social Media',
  'Other',
];

export default function PersonalInfoScreen() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [referralSource, setReferralSource] = useState(REFERRAL_SOURCES[0]);

  const handleNext = () => {
    // Validate inputs
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

    // Navigate to preferences with collected data
    router.push({
      pathname: '/onboarding/preferences',
      params: {
        firstName,
        lastName,
        referralSource,
      },
    });
  };

  const handleBack = () => {
    router.back();
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

            {/* Title */}
            <Text style={styles.title}>Tell Us About You</Text>
            <Text style={styles.subtitle}>
              We'll personalize your experience
            </Text>

            {/* First Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>First Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#A4E900"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  placeholderTextColor="#636366"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </View>
            </View>

            {/* Last Name Input */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>Last Name</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#A4E900"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your last name"
                  placeholderTextColor="#636366"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </View>
            </View>

            {/* Referral Source Picker */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>How did you hear about us?</Text>
              <View style={styles.pickerContainer}>
                <Ionicons
                  name="megaphone-outline"
                  size={20}
                  color="#A4E900"
                  style={styles.pickerIcon}
                />
                <Picker
                  selectedValue={referralSource}
                  onValueChange={(itemValue) => setReferralSource(itemValue)}
                  style={styles.picker}
                  dropdownIconColor="#A4E900"
                >
                  {REFERRAL_SOURCES.map((source) => (
                    <Picker.Item
                      key={source}
                      label={source}
                      value={source}
                      color="#FFFFFF"
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Spacer */}
            <View style={styles.spacer} />

            {/* Next Button */}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#000000" />
            </TouchableOpacity>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#98989D',
    marginBottom: 40,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 14,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingLeft: 16,
    borderWidth: 2,
    borderColor: '#2C2C2E',
  },
  pickerIcon: {
    marginRight: 12,
  },
  picker: {
    flex: 1,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  spacer: {
    flex: 1,
    minHeight: 40,
  },
  nextButton: {
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
  nextButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
