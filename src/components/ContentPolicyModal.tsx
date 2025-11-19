import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_URLS } from '@/src/constants/legal';

interface ContentPolicyModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * ContentPolicyModal Component
 *
 * Displays a modal asking users to accept the Content Policy before sharing
 * recipes to the community. Shown on first-time share only.
 *
 * Usage:
 * <ContentPolicyModal
 *   visible={showModal}
 *   onAccept={handleAccept}
 *   onDecline={handleDecline}
 * />
 */
export function ContentPolicyModal({ visible, onAccept, onDecline }: ContentPolicyModalProps) {
  const [accepted, setAccepted] = useState(false);

  const handleViewFullPolicy = async () => {
    try {
      const canOpen = await Linking.canOpenURL(LEGAL_URLS.CONTENT_POLICY);
      if (canOpen) {
        await Linking.openURL(LEGAL_URLS.CONTENT_POLICY);
      }
    } catch (error) {
      console.error('Error opening content policy:', error);
    }
  };

  const handleAccept = () => {
    if (accepted) {
      onAccept();
      setAccepted(false); // Reset for next time
    }
  };

  const handleDecline = () => {
    setAccepted(false);
    onDecline();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="people-outline" size={32} color="#9FE870" />
            <Text style={styles.title}>Community Guidelines</Text>
            <Text style={styles.subtitle}>
              Before sharing to the community, please review our guidelines
            </Text>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ What You Can Share</Text>
              <Text style={styles.sectionText}>• Recipe photos you took yourself</Text>
              <Text style={styles.sectionText}>• Home-cooked meals and experiments</Text>
              <Text style={styles.sectionText}>• International cuisine from any culture</Text>
              <Text style={styles.sectionText}>• Dietary adaptations (vegan, GF, etc.)</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>❌ What You Cannot Share</Text>
              <Text style={styles.sectionText}>• Offensive or discriminatory content</Text>
              <Text style={styles.sectionText}>• Copyrighted images without permission</Text>
              <Text style={styles.sectionText}>• Spam or promotional content</Text>
              <Text style={styles.sectionText}>• Misleading or fake recipes</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Be Respectful</Text>
              <Text style={styles.sectionText}>
                Treat all users with kindness, celebrate diverse cuisines, and keep the
                community positive and welcoming.
              </Text>
            </View>

            <TouchableOpacity onPress={handleViewFullPolicy} style={styles.linkButton}>
              <Text style={styles.linkText}>View Full Community Guidelines</Text>
              <Ionicons name="open-outline" size={16} color="#9FE870" />
            </TouchableOpacity>
          </ScrollView>

          {/* Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <Ionicons name="checkmark" size={18} color="#1C1C1C" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I agree to follow the Community Guidelines
            </Text>
          </TouchableOpacity>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              activeOpacity={0.7}
            >
              <Text style={styles.declineButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.acceptButton, !accepted && styles.buttonDisabled]}
              onPress={handleAccept}
              activeOpacity={0.7}
              disabled={!accepted}
            >
              <Text style={styles.acceptButtonText}>Accept & Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1C1C1C',
    borderRadius: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    maxHeight: 300,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 4,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  linkText: {
    fontSize: 14,
    color: '#9FE870',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 0,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#666666',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#9FE870',
    borderColor: '#9FE870',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  acceptButton: {
    backgroundColor: '#9FE870',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1C',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
