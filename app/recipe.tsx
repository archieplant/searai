import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import ComplexitySlider from '@/src/components/ComplexitySlider';
import { RecipeAnalysis, RecipeVersion } from '@/src/services/openai';
import { saveRecipe, getCurrentUser, shareRecipeToCommunity, hasAcceptedContentPolicy, recordContentPolicyConsent } from '@/src/services/supabase';
import { ContentPolicyModal } from '@/src/components/ContentPolicyModal';
import { LEGAL_VERSIONS } from '@/src/constants/legal';

export default function RecipeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Get image URI/URL from params (supports both local URIs and remote URLs)
  const imageUri = (params.imageUri || params.imageUrl) as string | undefined;

  // Parse recipe data from params
  const parsedRecipeData = useMemo(() => {
    try {
      const recipeDataString = params.recipeData as string;
      if (!recipeDataString) {
        return null;
      }
      const parsed: RecipeAnalysis = JSON.parse(recipeDataString);
      return parsed;
    } catch (error) {
      console.error('Error parsing recipe data:', error);
      return null;
    }
  }, [params.recipeData]);

  // Track complexity level (use saved level if provided, otherwise start at 2 = "Average")
  const initialComplexityLevel = params.savedComplexityLevel
    ? parseInt(params.savedComplexityLevel as string, 10)
    : 2;
  const [complexityLevel, setComplexityLevel] = useState(initialComplexityLevel);

  // Track saving state
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Track modal visibility and active tab
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'ingredients' | 'instructions'>('ingredients');
  const [showContentPolicyModal, setShowContentPolicyModal] = useState(false);

  // Get current recipe version based on complexity level
  const currentVersion: RecipeVersion | null = useMemo(() => {
    if (!parsedRecipeData) return null;
    return parsedRecipeData.versions[complexityLevel.toString()] || null;
  }, [parsedRecipeData, complexityLevel]);

  // Handle slider change
  const handleLevelChange = (level: number) => {
    console.log('Complexity level changed to:', level);
    setComplexityLevel(level);
  };

  // Handle save recipe
  const handleSaveRecipe = async () => {
    if (!parsedRecipeData) {
      Alert.alert('Error', 'No recipe data to save');
      return;
    }

    try {
      setIsSaving(true);
      console.log('Saving recipe...');

      // Check subscription limits
      const user = await getCurrentUser();
      if (!user) {
        setIsSaving(false);
        Alert.alert('Error', 'Please log in to save recipes');
        return;
      }

      await saveRecipe({
        recipeData: parsedRecipeData,
        savedComplexityLevel: complexityLevel,
        imageUri: imageUri,
      });

      console.log('Recipe saved successfully');
      Alert.alert('Success', 'Recipe saved!');
    } catch (error) {
      console.error('Error saving recipe:', error);
      Alert.alert(
        'Save Failed',
        error instanceof Error ? error.message : 'Failed to save recipe. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Handle share to community
  const handleShareToCommunity = async () => {
    if (!parsedRecipeData) {
      Alert.alert('Error', 'No recipe data to share');
      return;
    }

    try {
      setIsSharing(true);
      console.log('Sharing recipe to community...');

      const user = await getCurrentUser();
      if (!user) {
        setIsSharing(false);
        Alert.alert('Error', 'Please log in to share recipes');
        return;
      }

      // Check if user has accepted content policy
      const hasAccepted = await hasAcceptedContentPolicy();
      if (!hasAccepted) {
        setIsSharing(false);
        setShowContentPolicyModal(true);
        return;
      }

      await shareRecipeToCommunity({
        recipeData: parsedRecipeData,
        complexityLevel: complexityLevel,
        imageUri: imageUri,
      });

      console.log('Recipe shared to community successfully');
      Alert.alert(
        'Shared!',
        'Your recipe has been shared anonymously with the Recipe Killer community',
        [
          { text: 'OK' }
        ]
      );
    } catch (error) {
      console.error('Error sharing recipe:', error);
      Alert.alert(
        'Share Failed',
        error instanceof Error ? error.message : 'Failed to share recipe. Please try again.'
      );
    } finally {
      setIsSharing(false);
    }
  };

  // Handle content policy acceptance
  const handleContentPolicyAccept = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Please log in to continue');
        return;
      }

      await recordContentPolicyConsent(user.id, LEGAL_VERSIONS.CONTENT_POLICY);
      setShowContentPolicyModal(false);

      // Now proceed with sharing
      handleShareToCommunity();
    } catch (error) {
      console.error('Error recording content policy consent:', error);
      Alert.alert('Error', 'Failed to record consent. Please try again.');
    }
  };

  // Handle content policy decline
  const handleContentPolicyDecline = () => {
    setShowContentPolicyModal(false);
    Alert.alert(
      'Sharing Cancelled',
      'You must accept the Community Guidelines to share recipes'
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Uploaded Photo (if available) */}
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Recipe Name */}
        <View style={styles.nameContainer}>
          <Text style={styles.dishName}>
            {parsedRecipeData?.dishName || 'Recipe'}
          </Text>
        </View>

        {/* Complexity Slider */}
        <View style={styles.sliderContainer}>
          <ComplexitySlider
            currentLevel={complexityLevel}
            onLevelChange={handleLevelChange}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Home Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="home-outline"
                size={28}
                color="#A4E900"
              />
            </TouchableOpacity>

            {/* Save Recipe Button */}
            <TouchableOpacity
              style={[styles.actionButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSaveRecipe}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              <Ionicons
                name={isSaving ? "hourglass-outline" : "bookmark-outline"}
                size={28}
                color="#A4E900"
              />
            </TouchableOpacity>

            {/* Share to Community Button */}
            <TouchableOpacity
              style={[styles.actionButton, isSharing && styles.saveButtonDisabled]}
              onPress={handleShareToCommunity}
              activeOpacity={0.8}
              disabled={isSharing}
            >
              <Ionicons
                name={isSharing ? "hourglass-outline" : "share-social-outline"}
                size={28}
                color="#A4E900"
              />
            </TouchableOpacity>
          </View>
        </View>

      {/* Recipe Preview - Just Time and Expand Button */}
      <View style={styles.previewContainer}>
        {currentVersion ? (
          <>
            {/* Time and Servings Info */}
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={24} color="#9FE870" />
                <Text style={styles.infoText}>{currentVersion.time.replace('~', '')}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="people-outline" size={24} color="#9FE870" />
                <Text style={styles.servingsText}>{currentVersion.servings}</Text>
              </View>
            </View>

            {/* Expand Recipe Button */}
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setShowRecipeModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.expandButtonText}>View Full Recipe</Text>
              <Ionicons name="chevron-up" size={20} color="#000000" />
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.noDataText}>No recipe data available</Text>
        )}
      </View>

      {/* Recipe Modal */}
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <BlurView intensity={80} tint="dark" style={styles.modalContent}>
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRecipeModal(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            {/* Tab Buttons */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'ingredients' && styles.tabButtonActive]}
                onPress={() => setActiveTab('ingredients')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, activeTab === 'ingredients' && styles.tabButtonTextActive]}>
                  Ingredients
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'instructions' && styles.tabButtonActive]}
                onPress={() => setActiveTab('instructions')}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabButtonText, activeTab === 'instructions' && styles.tabButtonTextActive]}>
                  Instructions
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tab Content */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              {activeTab === 'ingredients' && currentVersion && (
                <View>
                  {currentVersion.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientRow}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              )}

              {activeTab === 'instructions' && currentVersion && (
                <View>
                  {currentVersion.instructions.map((instruction, index) => (
                    <View key={index} style={styles.instructionRow}>
                      <View style={styles.stepNumberContainer}>
                        <Text style={styles.stepNumber}>{index + 1}</Text>
                      </View>
                      <Text style={styles.instructionText}>{instruction}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Content Policy Modal */}
      <ContentPolicyModal
        visible={showContentPolicyModal}
        onAccept={handleContentPolicyAccept}
        onDecline={handleContentPolicyDecline}
      />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3C3C3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    height: 280,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 12,
    backgroundColor: '#000000',
  },
  recipeImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  nameContainer: {
    height: 80,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  dishName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
  },
  sliderContainer: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: '#000000',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 20,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#3C3C3C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  previewContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 18,
    color: '#A4E900',
    fontWeight: '700',
    marginLeft: 12,
  },
  servingsText: {
    fontSize: 18,
    color: '#A4E900',
    fontWeight: '700',
    marginLeft: 12,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#A4E900',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#A4E900',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  expandButtonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3C3C3C',
  },
  tabButtonActive: {
    backgroundColor: '#A4E900',
    borderColor: '#A4E900',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#98989D',
  },
  tabButtonTextActive: {
    color: '#000000',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingBottom: 40,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  bullet: {
    fontSize: 16,
    color: '#A4E900',
    marginRight: 12,
    marginTop: 2,
    fontWeight: 'bold',
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#A4E900',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  noDataText: {
    fontSize: 16,
    color: '#98989D',
    textAlign: 'center',
    marginTop: 40,
  },
});
