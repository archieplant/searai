import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface StepProps {
  icon: keyof typeof Ionicons.glyphMap;
  number: string;
  title: string;
  description: string;
}

function Step({ icon, number, title, description }: StepProps) {
  return (
    <View style={styles.step}>
      <View style={styles.stepIconContainer}>
        <Ionicons name={icon} size={32} color="#A4E900" />
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepNumber}>{number}</Text>
        <Text style={styles.stepItemTitle}>{title}</Text>
        <Text style={styles.stepDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function OnboardingHowItWorks() {
  const router = useRouter();

  const handleNext = () => {
    router.push('/onboarding/personal-info');
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
            {/* Header with Back Button */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.headerSpacer} />
            </View>

            <View style={styles.stepContainer}>
              {/* Title */}
              <Text style={styles.stepTitle}>How It Works</Text>
              <Text style={styles.stepSubtitle}>Three simple steps to better recipes</Text>

              {/* Steps */}
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

              {/* Spacer */}
              <View style={styles.spacer} />

              {/* Next Button */}
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Ionicons name="arrow-forward" size={20} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Modal wrapper styles
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
  stepContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  spacer: {
    flex: 1,
    minHeight: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#98989D',
    marginBottom: 32,
  },
  stepsContainer: {
    gap: 32,
    marginBottom: 32,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#A4E900',
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A4E900',
    marginBottom: 4,
  },
  stepItemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#98989D',
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
    marginTop: 24,
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
