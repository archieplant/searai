import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { analyzeRecipeViaBackend } from '@/src/services/backend-api';
import { getCurrentUser } from '@/src/services/supabase';
import { checkUserLimits, incrementAnalysisCount } from '@/src/services/subscription';
import AnalysisLoadingScreen from '@/src/components/AnalysisLoadingScreen';

export default function UploadScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [recipeText, setRecipeText] = useState('');
  const [isAnalysing, setIsAnalysing] = useState(false);

  // Request permissions on mount
  React.useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
          Alert.alert(
            'Permissions Required',
            'Camera and photo library access are needed to upload recipe photos.'
          );
        }
      }
    })();
  }, []);

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChoosePhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing photo:', error);
      Alert.alert('Error', 'Failed to choose photo. Please try again.');
    }
  };

  const handleRemovePhoto = () => {
    setImageUri(null);
  };

  const handleAnalyse = async () => {
    // Validate input
    if (!imageUri && !recipeText.trim()) {
      Alert.alert('Input Required', 'Please upload a photo or paste a recipe to analyse.');
      return;
    }

    try {
      setIsAnalysing(true);

      // Check subscription limits
      const user = await getCurrentUser();
      if (!user) {
        setIsAnalysing(false);
        Alert.alert('Error', 'Please log in to analyse recipes');
        return;
      }

      const limits = await checkUserLimits(user.id);
      console.log('User limits:', limits);

      if (!limits.canAnalyse) {
        setIsAnalysing(false);
        Alert.alert(
          'Analysis Limit Reached',
          `You've reached the free limit of ${limits.maxMonthlyAnalyses} analyses this month. Upgrade to Premium for unlimited analyses!`,
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/paywall') }
          ]
        );
        return;
      }

      // Perform recipe analysis via secure backend
      console.log('Starting recipe analysis via backend...');
      const recipeData = await analyzeRecipeViaBackend(recipeText, imageUri || undefined);
      console.log('Recipe analysis complete:', recipeData.dishName);

      // Increment analysis count
      await incrementAnalysisCount(user.id);

      // Save to recent_recipes (with photo upload)
      const { addRecentRecipe } = await import('@/src/services/supabase');
      const recentRecipe = await addRecentRecipe(recipeData, 2, imageUri || undefined);
      console.log('Recipe added to recent_recipes:', recentRecipe.id);

      // Navigate to recipe screen with results
      router.replace({
        pathname: '/recipe',
        params: {
          recipeData: JSON.stringify(recipeData),
          imageUrl: recentRecipe.image_url || undefined,
          recentRecipeId: recentRecipe.id,
        },
      });
    } catch (error: any) {
      console.error('Error analysing recipe:', error);
      setIsAnalysing(false);
      Alert.alert(
        'Analysis Failed',
        error.message || 'Failed to analyse recipe. Please try again.'
      );
    }
  };

  if (isAnalysing) {
    return <AnalysisLoadingScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analyse Recipe</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upload Photo</Text>
            <Text style={styles.sectionSubtitle}>
              Take or upload a photo of your recipe
            </Text>

            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <View style={styles.imagePreview}>
                  <Ionicons name="image" size={64} color="#A4E900" />
                  <Text style={styles.imagePreviewText}>Photo selected</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemovePhoto}
                >
                  <Ionicons name="close-circle" size={24} color="#E07A5F" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadButtons}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleTakePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="camera" size={32} color="#A4E900" />
                  <Text style={styles.uploadButtonText}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleChoosePhoto}
                  activeOpacity={0.8}
                >
                  <Ionicons name="images" size={32} color="#A4E900" />
                  <Text style={styles.uploadButtonText}>Choose Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Text Input Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paste Recipe</Text>
            <Text style={styles.sectionSubtitle}>
              Copy and paste a recipe from any source
            </Text>

            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={10}
              placeholder="Paste your recipe here..."
              placeholderTextColor="#636366"
              value={recipeText}
              onChangeText={setRecipeText}
              textAlignVertical="top"
            />
          </View>

          {/* Analyse Button */}
          <TouchableOpacity
            style={[
              styles.analyseButton,
              (!imageUri && !recipeText.trim()) && styles.analyseButtonDisabled,
            ]}
            onPress={handleAnalyse}
            activeOpacity={0.8}
            disabled={!imageUri && !recipeText.trim()}
          >
            <Ionicons name="flash" size={20} color="#000000" style={styles.analyseIcon} />
            <Text style={styles.analyseButtonText}>Analyse Recipe</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#A4E900',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#98989D',
    marginBottom: 20,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3C3C3C',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#A4E900',
  },
  imagePreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#A4E900',
    marginTop: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#3C3C3C',
  },
  dividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A4E900',
    marginHorizontal: 16,
  },
  textInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 200,
    borderWidth: 2,
    borderColor: '#3C3C3C',
  },
  analyseButton: {
    backgroundColor: '#A4E900',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A4E900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  analyseButtonDisabled: {
    backgroundColor: '#3C3C3C',
    opacity: 0.5,
  },
  analyseIcon: {
    marginRight: 8,
  },
  analyseButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
});
