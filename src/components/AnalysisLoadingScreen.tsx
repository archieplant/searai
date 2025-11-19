import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, ImageBackground } from 'react-native';
import { BlurView } from 'expo-blur';

// Witty phrases that get funnier the longer it takes
const LOADING_PHRASES = [
  // 0-6s: Standard, friendly
  "Reading your recipe...",

  // 6-12s: Still normal
  "Analysing ingredients...",

  // 12-18s: Slightly cheeky
  "Teaching AI what a spatula is...",

  // 18-24s: Getting funnier
  "Taste testing... digitally...",

  // 24-30s: More humor
  "Arguing with the algorithm about salt levels...",

  // 30-36s: User knows it's taking a while
  "Converting grandmother's pinch measurements...",

  // 36-42s: Acknowledge the wait
  "This one's complicated! Almost there...",

  // 42-48s: Self-aware humor
  "Calculating the exact temperature of 'medium heat'...",

  // 48-54s: Getting silly
  "Debating whether a tomato is a fruit or vegetable...",

  // 54-60s: Maximum silliness
  "Teaching AI the difference between simmer and boil...",
];

export default function AnalysisLoadingScreen() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Change phrase every 6 seconds with fade animation
    const phraseInterval = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        // Update phrase
        setCurrentPhraseIndex((prev) => {
          const next = prev + 1;
          return next < LOADING_PHRASES.length ? next : prev;
        });

        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 6000);

    return () => {
      clearInterval(phraseInterval);
    };
  }, [fadeAnim]);

  return (
    <ImageBackground
      source={require('@/assets/images/peas-dill-background.jpg')}
      style={styles.overlay}
      resizeMode="cover"
    >
      {/* Semi-transparent overlay for consistency */}
      <View style={styles.darkOverlay} />

      <View style={styles.container}>
        <BlurView intensity={40} tint="dark" style={styles.content}>
          {/* Witty phrase that changes */}
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            {LOADING_PHRASES[currentPhraseIndex]}
          </Animated.Text>

          {/* Simple "please wait" subtext */}
          <Text style={styles.helperText}>Hang tight, this usually takes 10-20 seconds</Text>
        </BlurView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(28, 28, 28, 0.4)',
  },
  container: {
    width: '85%',
    maxWidth: 400,
    zIndex: 1,
  },
  content: {
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(44, 44, 44, 0.3)',
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 70, // Prevent layout shift when text changes
  },
  helperText: {
    fontSize: 13,
    color: '#EEEEEE',
    textAlign: 'center',
  },
});
