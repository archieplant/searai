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
import { getSavedRecipes, SavedRecipe, getLibraryRecipes, LibraryRecipe, deleteRecipe } from '@/src/services/supabase';

const COMPLEXITY_LABELS = ['Recipe Killer', 'Simple', 'Average', 'Complex', 'Very Complex'];
const CATEGORIES = ['All', 'Italian', 'Asian', 'American', 'Mediterranean', 'Vegetarian', 'Desserts'] as const;
type Category = typeof CATEGORIES[number];

// Category color mapping for library placeholders
const CATEGORY_COLORS: Record<string, string> = {
  Italian: '#E07A5F',
  Asian: '#F4A261',
  American: '#E76F51',
  Mediterranean: '#2A9D8F',
  Vegetarian: '#9FE870',
  Desserts: '#9FE870',
  All: '#9FE870',
};

type TabType = 'saved' | 'library';

export default function RecipesScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('saved');
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [libraryRecipes, setLibraryRecipes] = useState<LibraryRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

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

  // Fetch library recipes
  const fetchLibraryRecipes = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const recipes = await getLibraryRecipes();
      setLibraryRecipes(recipes);
    } catch (error) {
      console.error('Error fetching library recipes:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load library recipes'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load recipes on mount
  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedRecipes();
    } else {
      fetchLibraryRecipes();
    }
  }, [activeTab]);

  // Reload saved recipes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'saved') {
        fetchSavedRecipes();
      }
    }, [activeTab, fetchSavedRecipes])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    if (activeTab === 'saved') {
      fetchSavedRecipes(true);
    } else {
      fetchLibraryRecipes(true);
    }
  }, [activeTab, fetchSavedRecipes, fetchLibraryRecipes]);

  // Filter library recipes based on category
  const filteredLibraryRecipes = useCallback(() => {
    if (selectedCategory === 'All') {
      return libraryRecipes;
    }
    return libraryRecipes.filter(
      (recipe) => recipe.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [libraryRecipes, selectedCategory]);

  // Handle saved recipe tap
  const handleSavedRecipeTap = useCallback(
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

  // Handle library recipe tap
  const handleLibraryRecipeTap = useCallback(
    (recipe: LibraryRecipe) => {
      router.push({
        pathname: '/recipe',
        params: {
          recipeData: JSON.stringify(recipe.recipe_data),
          savedComplexityLevel: '2', // Default to Average
          imageUrl: recipe.image_url || undefined,
        },
      });
    },
    [router]
  );

  // Handle delete saved recipe
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

  // Render saved recipe card
  const renderSavedRecipeCard = (recipe: SavedRecipe, isFullWidth: boolean = false) => {
    return (
      <TouchableOpacity
        key={recipe.id}
        style={[styles.recipeCard, isFullWidth && styles.recipeCardFullWidth]}
        onPress={() => handleSavedRecipeTap(recipe)}
        onLongPress={() => handleDeleteRecipe(recipe)}
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
          <View style={styles.complexityBadge}>
            <Text style={styles.complexityText}>
              {COMPLEXITY_LABELS[recipe.saved_complexity_level]}
            </Text>
          </View>
        </View>

        {/* Delete Icon */}
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

  // Render library recipe card
  const renderLibraryRecipeCard = (recipe: LibraryRecipe, isFullWidth: boolean = false) => {
    const placeholderColor = CATEGORY_COLORS[recipe.category] || '#9FE870';

    return (
      <TouchableOpacity
        key={recipe.id}
        style={[styles.recipeCard, isFullWidth && styles.recipeCardFullWidth]}
        onPress={() => handleLibraryRecipeTap(recipe)}
        activeOpacity={0.8}
      >
        {recipe.image_url ? (
          <Image
            source={{ uri: recipe.image_url }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: placeholderColor }]}>
            <Ionicons name="restaurant" size={40} color="#FFFFFF" opacity={0.6} />
          </View>
        )}

        <View style={styles.recipeInfo}>
          <Text style={styles.dishName} numberOfLines={2}>
            {recipe.recipe_data.dishName}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{recipe.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render recipe grid
  const renderRecipeGrid = (recipes: (SavedRecipe | LibraryRecipe)[], isSaved: boolean) => {
    const rows: JSX.Element[] = [];
    const recipeCount = recipes.length;

    // Process recipes in pairs
    for (let i = 0; i < recipeCount - 1; i += 2) {
      rows.push(
        <View key={`row-${i}`} style={styles.row}>
          {isSaved
            ? renderSavedRecipeCard(recipes[i] as SavedRecipe)
            : renderLibraryRecipeCard(recipes[i] as LibraryRecipe)}
          {isSaved
            ? renderSavedRecipeCard(recipes[i + 1] as SavedRecipe)
            : renderLibraryRecipeCard(recipes[i + 1] as LibraryRecipe)}
        </View>
      );
    }

    // If odd number, add last one as full-width
    if (recipeCount % 2 !== 0) {
      const lastRecipe = recipes[recipeCount - 1];
      rows.push(
        <View key={`row-${recipeCount - 1}`} style={styles.fullWidthRow}>
          {isSaved
            ? renderSavedRecipeCard(lastRecipe as SavedRecipe, true)
            : renderLibraryRecipeCard(lastRecipe as LibraryRecipe, true)}
        </View>
      );
    }

    return rows;
  };

  // Render category tab
  const renderCategoryTab = (category: Category) => {
    const isActive = selectedCategory === category;
    return (
      <TouchableOpacity
        key={category}
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => setSelectedCategory(category)}
        activeOpacity={0.7}
      >
        <Text style={[styles.categoryTabText, isActive && styles.categoryTabTextActive]}>
          {category}
        </Text>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9FE870" />
        <Text style={styles.loadingText}>Loading recipes...</Text>
      </View>
    );
  }

  const displayRecipes = activeTab === 'saved' ? savedRecipes : filteredLibraryRecipes();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Recipes</Text>
        {displayRecipes.length > 0 && (
          <Text style={styles.headerCount}>{displayRecipes.length} recipes</Text>
        )}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => {
            setActiveTab('saved');
            setSelectedCategory('All');
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'library' && styles.tabActive]}
          onPress={() => setActiveTab('library')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'library' && styles.tabTextActive]}>
            Library
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs (Library only) */}
      {activeTab === 'library' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryTabsContainer}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {CATEGORIES.map(renderCategoryTab)}
        </ScrollView>
      )}

      {/* Recipe Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#9FE870"
          />
        }
      >
        {activeTab === 'saved' ? (
          savedRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="bookmark-outline" size={64} color="#666666" />
              <Text style={styles.emptyTitle}>No saved recipes yet</Text>
              <Text style={styles.emptySubtitle}>
                Recipes you save will appear here
              </Text>
            </View>
          ) : (
            renderRecipeGrid(savedRecipes, true)
          )
        ) : libraryRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>Library Coming Soon!</Text>
            <Text style={styles.emptySubtitle}>
              Curated recipes will appear here
            </Text>
          </View>
        ) : displayRecipes.length === 0 ? (
          <View style={styles.emptyFilterContainer}>
            <Ionicons name="filter-outline" size={48} color="#666666" />
            <Text style={styles.emptyFilterText}>
              No {selectedCategory} recipes yet
            </Text>
          </View>
        ) : (
          renderRecipeGrid(displayRecipes, false)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1C',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#AAAAAA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#1C1C1C',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerCount: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  tabSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#9FE870',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  tabTextActive: {
    color: '#1C1C1C',
  },
  categoryTabsContainer: {
    backgroundColor: '#1C1C1C',
    maxHeight: 50,
  },
  categoryTabsContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2C2C2C',
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#3C3C3C',
  },
  categoryTabActive: {
    backgroundColor: '#9FE870',
    borderColor: '#9FE870',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#AAAAAA',
  },
  categoryTabTextActive: {
    color: '#1C1C1C',
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
    backgroundColor: '#2C2C2C',
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
    backgroundColor: '#2C2C2C',
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1.2,
    backgroundColor: '#9FE870',
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
    backgroundColor: '#9FE870',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  complexityText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#9FE870',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1C1C1C',
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
    color: '#AAAAAA',
    textAlign: 'center',
  },
  emptyFilterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyFilterText: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 16,
    textAlign: 'center',
  },
});
