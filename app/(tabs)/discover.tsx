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
  FlatList,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CommunityRecipe,
  saveCommunityRecipeToMyRecipes,
  getRecipeOfTheWeek,
  getTrendingRecipes,
  hasUserSavedCommunityRecipe,
} from '@/src/services/supabase';

export default function DiscoverScreen() {
  const router = useRouter();
  const [recipeOfWeek, setRecipeOfWeek] = useState<CommunityRecipe | null>(null);
  const [trendingRecipes, setTrendingRecipes] = useState<CommunityRecipe[]>([]);
  const [savedStatuses, setSavedStatuses] = useState<Map<string, boolean>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);

  // Fetch Recipe of the Week and Trending recipes
  const fetchDiscoverContent = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Fetch Recipe of the Week
      const weekRecipe = await getRecipeOfTheWeek();
      setRecipeOfWeek(weekRecipe);

      // Fetch Trending recipes (exclude Recipe of the Week)
      const trending = await getTrendingRecipes(8, weekRecipe?.id);
      setTrendingRecipes(trending);

      // Check saved status for all recipes
      const allRecipes = [weekRecipe, ...trending].filter(Boolean) as CommunityRecipe[];
      const statusMap = new Map<string, boolean>();

      await Promise.all(
        allRecipes.map(async (recipe) => {
          const isSaved = await hasUserSavedCommunityRecipe(recipe.id);
          statusMap.set(recipe.id, isSaved);
        })
      );

      setSavedStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching discover content:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load discover content'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load content on mount
  useEffect(() => {
    fetchDiscoverContent();
  }, [fetchDiscoverContent]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDiscoverContent();
    }, [fetchDiscoverContent])
  );

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchDiscoverContent(true);
  }, [fetchDiscoverContent]);

  // Handle Hero card tap (opens at complexity level 2 - Average)
  const handleHeroRecipeTap = useCallback(
    (recipe: CommunityRecipe) => {
      router.push({
        pathname: '/recipe',
        params: {
          recipeData: JSON.stringify(recipe.recipe_data),
          savedComplexityLevel: '2', // Always open at level 2 (Average)
          imageUrl: recipe.image_url || undefined,
        },
      });
    },
    [router]
  );

  // Handle Trending recipe tap (opens at saved complexity level)
  const handleTrendingRecipeTap = useCallback(
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

        // Update saved status locally
        setSavedStatuses((prev) => new Map(prev).set(recipe.id, true));

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

  // Render Hero Recipe Card (Recipe of the Week)
  const renderHeroCard = () => {
    if (!recipeOfWeek) return null;

    const isSaving = savingRecipeId === recipeOfWeek.id;
    const isSaved = savedStatuses.get(recipeOfWeek.id) || false;

    return (
      <View style={styles.heroSection}>
        <View style={styles.heroHeader}>
          <Ionicons name="trophy" size={20} color="#A4E900" />
          <Text style={styles.heroLabel}>Recipe of the Week</Text>
        </View>

        <TouchableOpacity
          style={styles.heroCard}
          onPress={() => handleHeroRecipeTap(recipeOfWeek)}
          activeOpacity={0.9}
        >
          {recipeOfWeek.image_url ? (
            <Image
              source={{ uri: recipeOfWeek.image_url }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.heroImagePlaceholder}>
              <Ionicons name="restaurant" size={80} color="#FFFFFF" opacity={0.6} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroDishName} numberOfLines={2}>
                {recipeOfWeek.recipe_data.dishName}
              </Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Ionicons name="bookmark" size={16} color="#A4E900" />
                  <Text style={styles.heroStatText}>{recipeOfWeek.save_count} saves</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Saved Status Badge */}
          {isSaved && (
            <View style={styles.savedBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#A4E900" />
            </View>
          )}

          {/* Save Button */}
          {!isSaved && (
            <TouchableOpacity
              style={[styles.heroSaveButton, isSaving && styles.saveButtonDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                handleSaveCommunityRecipe(recipeOfWeek);
              }}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Ionicons
                name={isSaving ? "hourglass-outline" : "bookmark-outline"}
                size={20}
                color="#000000"
              />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render Trending Recipe Card
  const renderTrendingCard = ({ item, index }: { item: CommunityRecipe; index: number }) => {
    const isSaving = savingRecipeId === item.id;
    const isSaved = savedStatuses.get(item.id) || false;

    return (
      <TouchableOpacity
        style={styles.trendingCard}
        onPress={() => handleTrendingRecipeTap(item)}
        activeOpacity={0.8}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={styles.trendingImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.trendingImagePlaceholder}>
            <Ionicons name="restaurant" size={32} color="#FFFFFF" opacity={0.6} />
          </View>
        )}

        {/* Rank Badge */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        {/* Saved Status Badge */}
        {isSaved && (
          <View style={styles.trendingSavedBadge}>
            <Ionicons name="checkmark-circle" size={18} color="#A4E900" />
          </View>
        )}

        <View style={styles.trendingInfo}>
          <Text style={styles.trendingDishName} numberOfLines={2}>
            {item.recipe_data.dishName}
          </Text>
          <View style={styles.trendingStats}>
            <Ionicons name="bookmark" size={12} color="#98989D" />
            <Text style={styles.trendingStatText}>{item.save_count}</Text>
          </View>

          {/* Save Button */}
          {!isSaved && (
            <TouchableOpacity
              style={[styles.trendingSaveButton, isSaving && styles.saveButtonDisabled]}
              onPress={(e) => {
                e.stopPropagation();
                handleSaveCommunityRecipe(item);
              }}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Ionicons
                name={isSaving ? "hourglass-outline" : "bookmark-outline"}
                size={14}
                color="#000000"
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A4E900" />
        <Text style={styles.loadingText}>Loading discover...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <Text style={styles.headerSubtitle}>Popular Community Recipes</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#A4E900"
          />
        }
      >
        {!recipeOfWeek && trendingRecipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="compass-outline" size={64} color="#636366" />
            <Text style={styles.emptyTitle}>No Community Recipes Yet!</Text>
            <Text style={styles.emptySubtitle}>
              Share your recipes to get started
            </Text>
          </View>
        ) : (
          <>
            {/* Recipe of the Week */}
            {renderHeroCard()}

            {/* Trending This Week */}
            {trendingRecipes.length > 0 && (
              <View style={styles.trendingSection}>
                <View style={styles.trendingHeader}>
                  <Ionicons name="trending-up" size={20} color="#A4E900" />
                  <Text style={styles.trendingLabel}>Trending This Week</Text>
                </View>

                <FlatList
                  data={trendingRecipes}
                  renderItem={renderTrendingCard}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.trendingList}
                  ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                />
              </View>
            )}
          </>
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
  content: {
    paddingBottom: 40,
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

  // Hero Card Styles
  heroSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroCard: {
    height: 300,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#A4E900',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: 20,
  },
  heroDishName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 28,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroStatText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  savedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 4,
  },
  heroSaveButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#A4E900',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },

  // Trending Section Styles
  trendingSection: {
    marginBottom: 32,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  trendingLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  trendingList: {
    paddingHorizontal: 20,
  },
  trendingCard: {
    width: 150,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  trendingImage: {
    width: '100%',
    height: 120,
  },
  trendingImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#A4E900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  trendingSavedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 3,
  },
  trendingInfo: {
    padding: 12,
  },
  trendingDishName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  trendingStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingStatText: {
    fontSize: 12,
    color: '#98989D',
    fontWeight: '500',
  },
  trendingSaveButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#A4E900',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
