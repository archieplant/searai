import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import {  getSavedRecipes,
  signOut,
  getUserProfile,
  getCurrentUser,
  saveDietaryPreferences,
  getDietaryPreferences,
} from '@/src/services/supabase';
import { getSubscriptionStatus, getTotalAnalysesCount } from '@/src/services/subscription';
import ColorAvatar from '@/src/components/ColorAvatar';
import { AVATAR_COLORS } from '@/src/components/ColorAvatarPicker';
import { LEGAL_URLS } from '@/src/constants/legal';

const DIET_TYPE_OPTIONS = [
  'None',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Gluten-Free',
  'Dairy-Free',
];

export default function ProfileScreen() {
  const router = useRouter();
  const [savedRecipesCount, setSavedRecipesCount] = useState<number>(0);
  const [analysesCount, setAnalysesCount] = useState<number>(0);
  const [memberSince, setMemberSince] = useState<string>('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean>(false);

  // User info state
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [avatarColor, setAvatarColor] = useState<string>(AVATAR_COLORS[2]);

  // Dietary preferences state
  const [allergies, setAllergies] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);
  const [dietType, setDietType] = useState<string>('None');

  // Modal state
  const [showAllergiesModal, setShowAllergiesModal] = useState(false);
  const [showDislikesModal, setShowDislikesModal] = useState(false);
  const [showDietTypeModal, setShowDietTypeModal] = useState(false);

  // Input state
  const [allergiesInput, setAllergiesInput] = useState('');
  const [dislikesInput, setDislikesInput] = useState('');

  // Reload profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchInitialData();
    }, [])
  );

  const fetchInitialData = async () => {
    try {
      // Fetch user profile
      const profile = await getUserProfile();
      if (profile) {
        setFirstName(profile.first_name || '');
        setLastName(profile.last_name || '');
        setAvatarColor(profile.avatar_color || AVATAR_COLORS[2]);
        const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        setUserName(fullName || 'User');
      }

      // Fetch user email and subscription status
      const user = await getCurrentUser();
      if (user?.email) {
        setUserEmail(user.email);

        // Check subscription status
        const subStatus = await getSubscriptionStatus(user.id);
        setIsPremium(subStatus.isPremium);

        // Get total analyses count
        const totalAnalyses = await getTotalAnalysesCount(user.id);
        setAnalysesCount(totalAnalyses);

        // Format member since date
        if (user.created_at) {
          const createdDate = new Date(user.created_at);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const formattedDate = `${monthNames[createdDate.getMonth()]} ${createdDate.getFullYear()}`;
          setMemberSince(formattedDate);
        }
      }

      // Fetch saved recipes count
      const recipes = await getSavedRecipes();
      setSavedRecipesCount(recipes.length);

      // Load dietary preferences
      const preferences = await getDietaryPreferences();
      if (preferences) {
        setAllergies(preferences.allergies || []);
        setDislikes(preferences.dislikes || []);
        setDietType(preferences.diet_type || 'None');
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return first + last || 'U';
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleUpgradePress = () => {
    router.push('/paywall');
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'To cancel your subscription, please contact support or manage your subscription through the App Store.',
      [{ text: 'Got it' }]
    );
  };

  const handleLogout = useCallback(async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            const result = await signOut();
            if (result.error) {
              Alert.alert('Error', result.error);
            }
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
          }
        },
      },
    ]);
  }, []);

  // Allergies handlers
  const handleEditAllergies = useCallback(() => {
    setAllergiesInput(allergies.join(', '));
    setShowAllergiesModal(true);
  }, [allergies]);

  const handleSaveAllergies = useCallback(async () => {
    const allergiesList = allergiesInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    setAllergies(allergiesList);
    setShowAllergiesModal(false);

    try {
      await saveDietaryPreferences(allergiesList, dislikes, dietType);
    } catch (error) {
      console.error('Error saving allergies:', error);
      Alert.alert('Error', 'Failed to save allergies');
    }
  }, [allergiesInput, dislikes, dietType]);

  const handleRemoveAllergy = useCallback(
    async (allergyToRemove: string) => {
      const updatedAllergies = allergies.filter((a) => a !== allergyToRemove);
      setAllergies(updatedAllergies);
      try {
        await saveDietaryPreferences(updatedAllergies, dislikes, dietType);
      } catch (error) {
        console.error('Error removing allergy:', error);
      }
    },
    [allergies, dislikes, dietType]
  );

  // Dislikes handlers
  const handleEditDislikes = useCallback(() => {
    setDislikesInput(dislikes.join(', '));
    setShowDislikesModal(true);
  }, [dislikes]);

  const handleSaveDislikes = useCallback(async () => {
    const dislikesList = dislikesInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    setDislikes(dislikesList);
    setShowDislikesModal(false);

    try {
      await saveDietaryPreferences(allergies, dislikesList, dietType);
    } catch (error) {
      console.error('Error saving dislikes:', error);
      Alert.alert('Error', 'Failed to save dislikes');
    }
  }, [dislikesInput, allergies, dietType]);

  const handleRemoveDislike = useCallback(
    async (dislikeToRemove: string) => {
      const updatedDislikes = dislikes.filter((d) => d !== dislikeToRemove);
      setDislikes(updatedDislikes);
      try {
        await saveDietaryPreferences(allergies, updatedDislikes, dietType);
      } catch (error) {
        console.error('Error removing dislike:', error);
      }
    },
    [dislikes, allergies, dietType]
  );

  // Diet type handlers
  const handleEditDietType = useCallback(() => {
    setShowDietTypeModal(true);
  }, []);

  const handleSelectDietType = useCallback(
    async (selectedType: string) => {
      setDietType(selectedType);
      setShowDietTypeModal(false);
      try {
        await saveDietaryPreferences(allergies, dislikes, selectedType);
      } catch (error) {
        console.error('Error saving diet type:', error);
        Alert.alert('Error', 'Failed to save diet type');
      }
    },
    [allergies, dislikes]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card with Avatar */}
        <TouchableOpacity onPress={handleEditProfile} activeOpacity={0.7} style={styles.profileCard}>
          <ColorAvatar color={avatarColor} initials={getInitials()} size={60} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userName || 'User'}</Text>
              {isPremium && (
                <View style={styles.premiumBadgeSmall}>
                  <Ionicons name="star" size={12} color="#FFFFFF" />
                  <Text style={styles.premiumBadgeTextSmall}>Premium</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail}>{userEmail || 'Loading...'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#636366" />
        </TouchableOpacity>

        {/* Stats Widgets */}
        <View style={styles.statsGrid}>
          <View style={styles.statWidget}>
            <Text style={styles.statWidgetNumber}>{analysesCount}</Text>
            <Text style={styles.statWidgetLabel}>Recipes analysed</Text>
          </View>
          <View style={styles.statWidget}>
            <Text style={styles.statWidgetNumber}>{savedRecipesCount}</Text>
            <Text style={styles.statWidgetLabel}>Recipes saved</Text>
          </View>
          <View style={styles.statWidget}>
            <Text style={styles.statWidgetNumber}>{memberSince || '---'}</Text>
            <Text style={styles.statWidgetLabel}>Member since</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <Ionicons name="person-outline" size={22} color="#A4E900" />
                <Text style={styles.menuLabel}>Personal Details</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#636366" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleEditAllergies} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <Ionicons name="alert-circle-outline" size={22} color="#A4E900" />
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Allergies</Text>
                  <Text style={styles.menuSubtext} numberOfLines={1}>
                    {allergies.length > 0 ? allergies.join(', ') : 'None'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#636366" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleEditDislikes} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <Ionicons name="close-circle-outline" size={22} color="#A4E900" />
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Dislikes</Text>
                  <Text style={styles.menuSubtext} numberOfLines={1}>
                    {dislikes.length > 0 ? dislikes.join(', ') : 'None'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#636366" />
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleEditDietType} activeOpacity={0.7}>
              <View style={styles.menuLeft}>
                <Ionicons name="restaurant-outline" size={22} color="#A4E900" />
                <View style={styles.menuLabelContainer}>
                  <Text style={styles.menuLabel}>Diet Type</Text>
                  <Text style={styles.menuSubtext}>{dietType}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#636366" />
            </TouchableOpacity>

            {!isPremium && (
              <>
                <View style={styles.menuDivider} />
                <TouchableOpacity style={styles.menuItem} onPress={handleUpgradePress} activeOpacity={0.7}>
                  <View style={styles.menuLeft}>
                    <Ionicons name="star-outline" size={22} color="#A4E900" />
                    <Text style={styles.menuLabel}>Upgrade to Premium</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#636366" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Premium Section (if user is premium) */}
        {isPremium && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Premium</Text>
            <View style={styles.card}>
              <View style={styles.premiumContent}>
                <View style={styles.premiumHeader}>
                  <View style={styles.premiumBadge}>
                    <Ionicons name="star" size={18} color="#FFFFFF" />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                </View>
                <Text style={styles.premiumDescription}>You have access to all premium features</Text>
                <TouchableOpacity style={styles.cancelButton} onPress={handleCancelSubscription} activeOpacity={0.7}>
                  <Text style={styles.cancelButtonText}>Manage Subscription</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <Ionicons name="notifications-outline" size={22} color="#A4E900" />
                <Text style={styles.menuLabel}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#2C2C2E', true: '#A4E900' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Legal & Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal & Support</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL(LEGAL_URLS.PRIVACY_POLICY)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color="#A4E900" />
                <Text style={styles.menuLabel}>Privacy Policy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#98989D" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL(LEGAL_URLS.TERMS_OF_SERVICE)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="document-text-outline" size={22} color="#A4E900" />
                <Text style={styles.menuLabel}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#98989D" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Linking.openURL(LEGAL_URLS.CONTENT_POLICY)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Ionicons name="people-outline" size={22} color="#A4E900" />
                <Text style={styles.menuLabel}>Community Guidelines</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#98989D" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Allergies Modal */}
      <Modal visible={showAllergiesModal} animationType="slide" transparent={true} onRequestClose={() => setShowAllergiesModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Allergies</Text>
              <TouchableOpacity onPress={() => setShowAllergiesModal(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter allergies separated by commas</Text>
            <TextInput
              style={styles.modalInput}
              value={allergiesInput}
              onChangeText={setAllergiesInput}
              placeholder="e.g., nuts, shellfish, dairy"
              placeholderTextColor="#636366"
              multiline
              autoFocus
            />
            {allergies.length > 0 && (
              <View style={styles.currentChipsContainer}>
                <Text style={styles.currentChipsLabel}>Current:</Text>
                <View style={styles.chipsContainer}>
                  {allergies.map((allergy, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{allergy}</Text>
                      <TouchableOpacity onPress={() => handleRemoveAllergy(allergy)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={handleSaveAllergies} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Dislikes Modal */}
      <Modal visible={showDislikesModal} animationType="slide" transparent={true} onRequestClose={() => setShowDislikesModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dislikes</Text>
              <TouchableOpacity onPress={() => setShowDislikesModal(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Enter ingredients you dislike, separated by commas</Text>
            <TextInput
              style={styles.modalInput}
              value={dislikesInput}
              onChangeText={setDislikesInput}
              placeholder="e.g., olives, mushrooms, onions"
              placeholderTextColor="#636366"
              multiline
              autoFocus
            />
            {dislikes.length > 0 && (
              <View style={styles.currentChipsContainer}>
                <Text style={styles.currentChipsLabel}>Current:</Text>
                <View style={styles.chipsContainer}>
                  {dislikes.map((dislike, index) => (
                    <View key={index} style={styles.chip}>
                      <Text style={styles.chipText}>{dislike}</Text>
                      <TouchableOpacity onPress={() => handleRemoveDislike(dislike)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="close-circle" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={handleSaveDislikes} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Diet Type Modal */}
      <Modal visible={showDietTypeModal} animationType="slide" transparent={true} onRequestClose={() => setShowDietTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Diet Type</Text>
              <TouchableOpacity onPress={() => setShowDietTypeModal(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>Select your dietary preference</Text>
            <View style={styles.dietTypeOptions}>
              {DIET_TYPE_OPTIONS.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.dietTypeOption, dietType === type && styles.dietTypeOptionSelected]}
                  onPress={() => handleSelectDietType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dietTypeText, dietType === type && styles.dietTypeTextSelected]}>{type}</Text>
                  {dietType === type && <Ionicons name="checkmark-circle" size={24} color="#A4E900" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    overflow: 'hidden',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  statWidget: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statWidgetNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#A4E900',
    marginBottom: 6,
    textAlign: 'center',
  },
  statWidgetLabel: {
    fontSize: 11,
    color: '#98989D',
    textAlign: 'center',
    fontWeight: '500',
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userEmail: {
    fontSize: 13,
    color: '#98989D',
  },
  premiumBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A4E900',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  premiumBadgeTextSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  profileDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#A4E900',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#98989D',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuLabelContainer: {
    flex: 1,
    gap: 2,
  },
  menuLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    lineHeight: 22,
  },
  menuSubtext: {
    fontSize: 13,
    color: '#636366',
    lineHeight: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginLeft: 50,
  },
  premiumContent: {
    padding: 20,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A4E900',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  premiumDescription: {
    fontSize: 14,
    color: '#98989D',
    lineHeight: 20,
    marginBottom: 16,
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A4E900',
  },
  signOutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#98989D',
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  currentChipsContainer: {
    marginTop: 16,
  },
  currentChipsLabel: {
    fontSize: 12,
    color: '#98989D',
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#A4E900',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  modalButton: {
    backgroundColor: '#A4E900',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  dietTypeOptions: {
    gap: 12,
    marginTop: 8,
  },
  dietTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dietTypeOptionSelected: {
    borderColor: '#A4E900',
    backgroundColor: 'rgba(164, 233, 0, 0.1)',
  },
  dietTypeText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dietTypeTextSelected: {
    color: '#A4E900',
    fontWeight: '600',
  },
});
