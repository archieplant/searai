import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCommunityRecipes, CommunityRecipe, saveCommunityRecipeToMyRecipes } from '@/src/services/supabase';

export default function DiscoverScreen() {
  const router = useRouter();
  const [communityRecipes, setCommunityRecipes] = useState<CommunityRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);

  // Fetch community recipes
  const fetchCommunityRecipes = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const recipes = await getCommunityRecipes(50);
      setCommunityRecipes(recipes);
    } catch (error) {
      console.error('Error fetching community recipes:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load community recipes'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load recipes on mount
  useEffect(() => {
    fetchCommunityRecipes();
  }, [fetchCommunityRecipes]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCommunityRecipes();
    }, [fetchCommunityRecipes])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchCommunityRecipes(true);
  }, [fetchCommunityRecipes]);

  // Handle community recipe tap
  const handleCommunityRecipeTap = useCallback(
    (recipe: CommunityRecipe) => {
      router.push({
        pathname: '/recipe',
        params: {
          recipeData: JSON.stringify(recipe.recipe_data),
          savedComplexityLevel: recipe.complexity_level.toString(),
          imageUrl: recipe.image_url || undefined,
        },
      });
    },
    [router]
  );

  // Handle save community recipe to My Recipes
  const handleSaveCommunityRecipe = useCallback(
    async (recipe: CommunityRecipe) => {
      try {
        setSavingRecipeId(recipe.id);

        await saveCommunityRecipeToMyRecipes(recipe.id, recipe.complexity_level);

        Alert.alert(
          'Saved!',
          'Recipe added to your My Recipes',
          [
            {
              text: 'View My Recipes',
              onPress: () => router.push('/(tabs)/recipes'),
            },
            { text: 'OK' }
          ]
        );
      } catch (error) {
        console.error('Error saving community recipe:', error);
        Alert.alert(
          'Save Failed',
          error instanceof Error ? error.message : 'Failed to save recipe. Please try again.'
        );
      } finally {
        setSavingRecipeId(null);
      }
    },
    [router]
  );

  // Render community recipe card
  const renderCommunityRecipeCard = (recipe: CommunityRecipe, isFullWidth: boolean = false) => {
    const isSaving = savingRecipeId === recipe.id;

    return (
      <TouchableOpacity
        key={recipe.id}
        style={[styles.recipeCard, isFullWidth && styles.recipeCardFullWidth]}
        onPress={() => handleCommunityRecipeTap(recipe)}
        activeOpacity={0.8}
      >
        {recipe.image_url ? (
          <Image
            source={{ uri: recipe.image_url }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="restaurant" size={40} color="#FFFFFF" opacity={0.6} />
          </View>
        )}

        <View style={styles.recipeInfo}>
          <Text style={styles.dishName} numberOfLines={2}>
            {recipe.recipe_data.dishName}
          </Text>

          {/* Save to My Recipes Button */}
          <TouchableOpacity
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={(e) => {
              e.stopPropagation();
              handleSaveCommunityRecipe(recipe);
            }}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <Ionicons
              name={isSaving ? "hourglass-outline" : "bookmark-outline"}
              size={16}
              color="#000000"
            />
            <Text style={styles.saveButtonText}>
              {isSaving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render community recipe grid
  const renderCommunityRecipeGrid = (recipes: CommunityRecipe[]) => {
    const rows: JSX.Element[] = [];
    const recipeCount = recipes.length;

    // Process recipes in pairs
    for (let i = 0; i < recipeCount - 1; i += 2) {
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {renderCommunityRecipeCard(recipes[i])}
          {renderCommunityRecipeCard(recipes[i + 1])}
        </View>
      );
    }

    // If odd number, add last one as full-width
    if (recipeCount % 2 !== 0) {
      const lastRecipe = recipes[recipeCount - 1];
      rows.push(
        <View key={`row-${recipeCount - 1}`} style={styles.fullWidthRow}>
          {renderCommunityRecipeCard(lastRecipe, true)}
        </View>
      );
    }

    return rows;
  };

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A4E900" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Community Recipes</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#A4E900"
          />
        }
      >
        {communityRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={64} color="#636366" />
            <Text style={styles.emptyTitle}>No Community Recipes Yet!</Text>
            <Text style={styles.emptySubtitle}>
              Share your recipes to get started
            </Text>
          </View>
        ) : (
          renderCommunityRecipeGrid(communityRecipes)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#98989D',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#98989D',
  },
  scrollView: {
    flex: 1,
  },
  gridContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  fullWidthRow: {
    marginBottom: 16,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recipeCardFullWidth: {
    flex: undefined,
    width: '100%',
  },
  recipeImage: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#1C1C1E',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#A4E900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeInfo: {
    padding: 12,
  },
  dishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#A4E900',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#98989D',
    textAlign: 'center',
  },
});
