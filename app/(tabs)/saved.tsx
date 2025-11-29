import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSavedRecipes, SavedRecipe, deleteRecipe } from '@/src/services/supabase';

const COMPLEXITY_LABELS = ['Ultra Simple', 'Simple', 'Average', 'Complex', 'Very Complex'];

export default function SavedScreen() {
  const router = useRouter();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch saved recipes
  const fetchSavedRecipes = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const recipes = await getSavedRecipes();
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load saved recipes'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load recipes on mount
  useEffect(() => {
    fetchSavedRecipes();
  }, [fetchSavedRecipes]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchSavedRecipes(true);
  }, [fetchSavedRecipes]);

  // Handle recipe card tap
  const handleRecipeTap = useCallback(
    (recipe: SavedRecipe) => {
      router.push({
        pathname: '/recipe',
        params: {
          recipeData: JSON.stringify(recipe.recipe_data),
          savedComplexityLevel: recipe.saved_complexity_level.toString(),
          imageUrl: recipe.image_url || undefined,
        },
      });
    },
    [router]
  );

  // Handle delete recipe
  const handleDeleteRecipe = useCallback(
    (recipe: SavedRecipe) => {
      Alert.alert(
        'Delete Recipe',
        `Are you sure you want to delete "${recipe.recipe_data.dishName}"?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteRecipe(recipe.id);

                // Remove from local state
                setSavedRecipes((prev) => prev.filter((r) => r.id !== recipe.id));

                Alert.alert('Success', 'Recipe deleted successfully');
              } catch (error) {
                console.error('Error deleting recipe:', error);
                Alert.alert(
                  'Error',
                  error instanceof Error ? error.message : 'Failed to delete recipe'
                );
              }
            },
          },
        ]
      );
    },
    []
  );

  // Render recipe card with long press to delete
  const renderRecipeCard = (recipe: SavedRecipe, isFullWidth: boolean = false) => {
    return (
      <TouchableOpacity
        key={recipe.id}
        style={[styles.recipeCard, isFullWidth && styles.recipeCardFullWidth]}
        onPress={() => handleRecipeTap(recipe)}
        onLongPress={() => handleDeleteRecipe(recipe)}
        activeOpacity={0.8}
      >
        {/* Recipe Image or Placeholder */}
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

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text style={styles.dishName} numberOfLines={2}>
            {recipe.recipe_data.dishName}
          </Text>
          <View style={styles.complexityBadge}>
            <Text style={styles.complexityText}>
              {COMPLEXITY_LABELS[recipe.saved_complexity_level]}
            </Text>
          </View>
        </View>

        {/* Delete Icon in corner */}
        <TouchableOpacity
          style={styles.deleteIcon}
          onPress={() => handleDeleteRecipe(recipe)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render recipe grid with pairs and full-width last item if odd
  const renderRecipeGrid = (recipes: SavedRecipe[]) => {
    const rows: JSX.Element[] = [];
    const recipeCount = recipes.length;

    // Process recipes in pairs
    for (let i = 0; i < recipeCount - 1; i += 2) {
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {renderRecipeCard(recipes[i])}
          {renderRecipeCard(recipes[i + 1])}
        </View>
      );
    }

    // If odd number of recipes, add the last one as full-width
    if (recipeCount % 2 !== 0) {
      const lastRecipe = recipes[recipeCount - 1];
      rows.push(
        <View key={`row-${recipeCount - 1}`} style={styles.fullWidthRow}>
          {renderRecipeCard(lastRecipe, true)}
        </View>
      );
    }

    return rows;
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A4E900" />
        <Text style={styles.loadingText}>Loading saved recipes...</Text>
      </View>
    );
  }

  // Recipes list
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Recipes</Text>
        {savedRecipes.length > 0 && (
          <Text style={styles.headerCount}>{savedRecipes.length} recipes</Text>
        )}
      </View>

      {/* Recipe Grid */}
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
        {savedRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bookmark-outline" size={64} color="#636366" />
            <Text style={styles.emptyTitle}>No saved recipes yet</Text>
            <Text style={styles.emptySubtitle}>
              Recipes you save will appear here
            </Text>
          </View>
        ) : (
          renderRecipeGrid(savedRecipes)
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
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerCount: {
    fontSize: 14,
    color: '#98989D',
  },
  scrollView: {
    flex: 1,
  },
  gridContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  fullWidthRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  recipeCardFullWidth: {
    flex: 1,
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
  complexityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A4E900',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  complexityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  deleteIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#98989D',
    textAlign: 'center',
  },
});
