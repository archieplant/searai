import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
        <Text style={styles.stepTitle}>{title}</Text>
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
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBack}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>How It Works</Text>
      <Text style={styles.subtitle}>Three simple steps to better recipes</Text>

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
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 24,
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
  stepsContainer: {
    gap: 32,
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
  stepTitle: {
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
  spacer: {
    flex: 1,
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
