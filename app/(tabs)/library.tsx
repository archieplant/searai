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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getLibraryRecipes, LibraryRecipe } from '@/src/services/supabase';

// Define categories
const CATEGORIES = ['All', 'Italian', 'Asian', 'American', 'Mediterranean', 'Vegetarian', 'Desserts'] as const;
type Category = typeof CATEGORIES[number];

// Category color mapping for placeholders
const CATEGORY_COLORS: Record<string, string> = {
  Italian: '#E07A5F',
  Asian: '#F4A261',
  American: '#E76F51',
  Mediterranean: '#2A9D8F',
  Vegetarian: '#9FE870',
  Desserts: '#9FE870',
  All: '#9FE870',
};

export default function LibraryScreen() {
  const router = useRouter();
  const [libraryRecipes, setLibraryRecipes] = useState<LibraryRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

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
    fetchLibraryRecipes();
  }, [fetchLibraryRecipes]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchLibraryRecipes(true);
  }, [fetchLibraryRecipes]);

  // Filter recipes based on selected category
  const filteredRecipes = useCallback(() => {
    if (selectedCategory === 'All') {
      return libraryRecipes;
    }
    return libraryRecipes.filter(
      (recipe) => recipe.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [libraryRecipes, selectedCategory]);

  // Handle recipe card tap
  const handleRecipeTap = useCallback(
    (recipe: LibraryRecipe) => {
      router.push({
        pathname: '/recipe',
        params: {
          recipeData: JSON.stringify(recipe.recipe_data),
          savedComplexityLevel: '2', // Default to Average for library recipes
          imageUrl: recipe.image_url || undefined,
        },
      });
    },
    [router]
  );

  // Render recipe card
  const renderRecipeCard = (item: LibraryRecipe, isFullWidth: boolean = false) => {
    const placeholderColor = CATEGORY_COLORS[item.category] || '#9FE870';

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.recipeCard, isFullWidth && styles.recipeCardFullWidth]}
        onPress={() => handleRecipeTap(item)}
        activeOpacity={0.8}
      >
        {/* Recipe Image or Placeholder */}
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { backgroundColor: placeholderColor }]}>
            <Ionicons name="restaurant" size={40} color="#FFFFFF" opacity={0.6} />
          </View>
        )}

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text style={styles.dishName} numberOfLines={2}>
            {item.recipe_data.dishName}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render recipe grid with pairs and full-width last item if odd
  const renderRecipeGrid = (recipes: LibraryRecipe[]) => {
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
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#9FE870" />
        <Text style={styles.loadingText}>Loading library...</Text>
      </View>
    );
  }

  const recipes = filteredRecipes();

  // Recipes list with tabs
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe Library</Text>
        {libraryRecipes.length > 0 && (
          <Text style={styles.headerCount}>{recipes.length} recipes</Text>
        )}
      </View>

      {/* Category Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {CATEGORIES.map(renderCategoryTab)}
      </ScrollView>

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
        {libraryRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#666666" />
            <Text style={styles.emptyTitle}>Library Coming Soon!</Text>
            <Text style={styles.emptySubtitle}>
              Curated recipes will appear here
            </Text>
          </View>
        ) : recipes.length === 0 ? (
          <View style={styles.emptyFilterContainer}>
            <Ionicons name="filter-outline" size={48} color="#666666" />
            <Text style={styles.emptyFilterText}>
              No {selectedCategory} recipes yet
            </Text>
          </View>
        ) : (
          renderRecipeGrid(recipes)
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
  tabsContainer: {
    backgroundColor: '#1C1C1C',
    maxHeight: 50,
  },
  tabsContent: {
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
  gridContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  recipeCard: {
    flex: 1,
    backgroundColor: '#2C2C2C',
    borderRadius: 12,
    overflow: 'hidden',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
