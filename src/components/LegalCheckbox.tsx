import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface LegalCheckboxProps {
  checked: boolean;
  onCheckChange: (checked: boolean) => void;
  label: string;
  linkText?: string;
  linkUrl?: string;
  additionalLinkText?: string;
  additionalLinkUrl?: string;
}

/**
 * LegalCheckbox Component
 *
 * A checkbox with label and optional clickable legal links.
 *
 * Usage:
 * <LegalCheckbox
 *   checked={ageVerified}
 *   onCheckChange={setAgeVerified}
 *   label="I confirm I am 13 years or older"
 * />
 *
 * <LegalCheckbox
 *   checked={termsAccepted}
 *   onCheckChange={setTermsAccepted}
 *   label="I agree to the"
 *   linkText="Terms of Service"
 *   linkUrl="https://..."
 *   additionalLinkText="and Privacy Policy"
 *   additionalLinkUrl="https://..."
 * />
 */
export function LegalCheckbox({
  checked,
  onCheckChange,
  label,
  linkText,
  linkUrl,
  additionalLinkText,
  additionalLinkUrl,
}: LegalCheckboxProps) {
  const handleLinkPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.error('Cannot open URL:', url);
      }
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onCheckChange(!checked)}
      activeOpacity={0.7}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={18} color="#1C1C1C" />}
      </View>

      <View style={styles.labelContainer}>
        <Text style={styles.label}>
          {label}
          {linkText && linkUrl && (
            <>
              {' '}
              <Text
                style={styles.link}
                onPress={(e) => {
                  e.stopPropagation();
                  handleLinkPress(linkUrl);
                }}
              >
                {linkText}
              </Text>
            </>
          )}
          {additionalLinkText && additionalLinkUrl && (
            <>
              {' '}
              <Text
                style={styles.link}
                onPress={(e) => {
                  e.stopPropagation();
                  handleLinkPress(additionalLinkUrl);
                }}
              >
                {additionalLinkText}
              </Text>
            </>
          )}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#636366',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#A4E900',
    borderColor: '#A4E900',
  },
  labelContainer: {
    flex: 1,
    paddingTop: 2,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  link: {
    color: '#A4E900',
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
