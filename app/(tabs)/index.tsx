import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser, getRecentRecipes, RecentRecipe, getLibraryRecipes, LibraryRecipe, getUserProfile } from '@/src/services/supabase';

export default function HomeScreen() {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [hasNotifications, setHasNotifications] = useState(false);
  const [recentRecipes, setRecentRecipes] = useState<RecentRecipe[]>([]);
  const [libraryRecipes, setLibraryRecipes] = useState<LibraryRecipe[]>([]);

  useEffect(() => {
    loadUserData();
    loadLibraryRecipes();
  }, []);

  // Reload recipes when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadRecentRecipes();
    }, [])
  );

  const loadUserData = async () => {
    try {
      // Try to get user profile first (has first name)
      const profile = await getUserProfile();
      if (profile?.first_name) {
        setUserName(profile.first_name);
        return;
      }

      // Fallback to extracting name from email if no profile
      const user = await getCurrentUser();
      if (user?.email) {
        const name = user.email.split('@')[0];
        setUserName(name.charAt(0).toUpperCase() + name.slice(1));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadRecentRecipes = async () => {
    try {
      const recipes = await getRecentRecipes(2); // Load 2 most recent
      setRecentRecipes(recipes);
    } catch (error) {
      console.error('Error loading recent recipes:', error);
    }
  };

  // Get week number of the year for consistent weekly rotation
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Seeded random number generator for consistent weekly selection
  const seededRandom = (seed: number, max: number): number => {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };

  const loadLibraryRecipes = async () => {
    try {
      const recipes = await getLibraryRecipes();

      if (recipes.length === 0) {
        setLibraryRecipes([]);
        return;
      }

      // Get current week number to seed the random selection
      const weekNumber = getWeekNumber(new Date());

      // Select 2 random recipes based on the week
      const selectedRecipes: LibraryRecipe[] = [];
      const recipeCount = recipes.length;

      if (recipeCount <= 2) {
        // If 2 or fewer recipes, show all
        setLibraryRecipes(recipes);
      } else {
        // Use week number as seed to get consistent random indices
        const index1 = seededRandom(weekNumber, recipeCount);
        let index2 = seededRandom(weekNumber + 1, recipeCount);

        // Ensure we don't pick the same recipe twice
        if (index2 === index1) {
          index2 = (index2 + 1) % recipeCount;
        }

        selectedRecipes.push(recipes[index1], recipes[index2]);
        setLibraryRecipes(selectedRecipes);
      }
    } catch (error) {
      console.error('Error loading library recipes:', error);
    }
  };

  const handleAnalyseRecipe = () => {
    // Navigate to upload screen
    router.push('/upload');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'No new notifications');
  };

  const handleSettings = () => {
    router.push('/profile');
  };

  const handleSeeMore = () => {
    router.push('/library');
  };

  const handleRecipeClick = (recipe: RecentRecipe) => {
    router.push({
      pathname: '/recipe',
      params: {
        recipeData: JSON.stringify(recipe.recipe_data),
        savedComplexityLevel: recipe.saved_complexity_level.toString(),
        imageUrl: recipe.image_url || undefined,
      },
    });
  };

  const handleTryRecipe = (recipe: LibraryRecipe) => {
    router.push({
      pathname: '/recipe',
      params: {
        recipeData: JSON.stringify(recipe.recipe_data),
        savedComplexityLevel: '2', // Default to Average for library recipes
        imageUrl: recipe.image_url || undefined,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Hey {userName || 'there'}
        </Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNotifications}
          >
            <Ionicons name="notifications-outline" size={24} color="#FFFFFF" />
            {hasNotifications && <View style={styles.notificationBadge} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSettings}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Card - Analyse Recipe */}
      <View style={styles.heroCardWrapper}>
        <TouchableOpacity
          style={styles.heroCard}
          onPress={handleAnalyseRecipe}
          activeOpacity={0.8}
        >
          <View style={styles.heroIconContainer}>
            <Ionicons name="camera-outline" size={40} color="#000000" />
          </View>
          <Text style={styles.heroTitle}>Analyse Recipe</Text>
          <Text style={styles.heroSubtitle}>
            Upload a photo or paste a recipe
          </Text>
        </TouchableOpacity>
      </View>

      {/* Recent Recipes Section */}
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>Recent Recipes</Text>
          </View>

          {recentRecipes.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="restaurant-outline" size={48} color="#636366" />
              <Text style={styles.emptyStateText}>No recipes yet</Text>
              <Text style={styles.emptyStateSubtext}>Analyse your first recipe above!</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {recentRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => handleRecipeClick(recipe)}
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
                    <Text style={styles.recipeName} numberOfLines={2}>
                      {recipe.recipe_data.dishName}
                    </Text>
                    <Text style={styles.recipeTime}>
                      {recipe.recipe_data.versions[recipe.saved_complexity_level]?.time}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Try These Section */}
        <View style={styles.section}>
          <View style={styles.tryTheseHeader}>
            <Text style={styles.sectionTitle}>Try These</Text>
            <TouchableOpacity onPress={handleSeeMore} activeOpacity={0.7}>
              <Text style={styles.seeMoreText}>See More</Text>
            </TouchableOpacity>
          </View>

          {libraryRecipes.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="book-outline" size={48} color="#636366" />
              <Text style={styles.emptyStateText}>Library Coming Soon</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {libraryRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={styles.recipeCard}
                  onPress={() => handleTryRecipe(recipe)}
                  activeOpacity={0.8}
                >
                  {recipe.image_url ? (
                    <Image
                      source={{ uri: recipe.image_url }}
                      style={styles.recipeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.imagePlaceholder, { backgroundColor: '#A4E900' }]}>
                      <Ionicons name="restaurant" size={40} color="#FFFFFF" opacity={0.6} />
                    </View>
                  )}
                  <View style={styles.recipeInfo}>
                    <Text style={styles.recipeName} numberOfLines={2}>
                      {recipe.recipe_data.dishName}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>{recipe.category}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#A4E900',
  },
  heroCardWrapper: {
    marginHorizontal: 20,
    marginBottom: 36,
  },
  heroCard: {
    backgroundColor: '#A4E900',
    padding: 28,
    borderRadius: 16,
    alignItems: 'center',
  },
  heroIconContainer: {
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#1C1C1E',
    textAlign: 'center',
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 36,
  },
  sectionTitleContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tryTheseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A4E900',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
    gap: 12,
  },
  recipeCard: {
    width: '47%',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
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
  recipeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 18,
    minHeight: 36,
  },
  recipeTime: {
    fontSize: 12,
    color: '#98989D',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#A4E900',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000000',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#98989D',
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#636366',
    marginTop: 4,
  },
});
