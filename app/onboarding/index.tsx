import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingWelcome() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/how-it-works');
  };

  return (
    <View style={styles.container}>
      {/* Logo/Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="restaurant" size={80} color="#E07A5F" />
      </View>

      {/* Title */}
      <Text style={styles.title}>SearAI</Text>

      {/* Tagline */}
      <Text style={styles.tagline}>Simplify any recipe in seconds</Text>

      {/* Description */}
      <Text style={styles.description}>
        Transform complex recipes into simple, easy-to-follow versions.{'\n'}
        From quick meals to detailed restaurant-quality dishes.
      </Text>

      {/* Spacer */}
      <View style={styles.spacer} />

      {/* Get Started Button */}
      <TouchableOpacity
        style={styles.getStartedButton}
        onPress={handleGetStarted}
        activeOpacity={0.8}
      >
        <Text style={styles.getStartedText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
    paddingHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2C2C2C',
    marginBottom: 12,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E07A5F',
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9B8B7E',
    textAlign: 'center',
    marginBottom: 16,
  },
  spacer: {
    flex: 1,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E07A5F',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
});
