import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/onboarding/how-it-works');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
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
              <Text style={styles.logo}>SearAI</Text>
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
                <TouchableOpacity onPress={handleSignIn} activeOpacity={0.7}>
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: '#A4E900',
    paddingVertical: 18,
    paddingHorizontal: 60,
    borderRadius: 30,
    shadowColor: '#A4E900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  getStartedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
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
    color: '#A4E900',
    textDecorationLine: 'underline',
  },
});
