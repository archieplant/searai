import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

interface ColorAvatarPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  initials: string;
}

// Available avatar colors
export const AVATAR_COLORS = [
  '#8B7FE8', // Purple
  '#4ECDC4', // Teal
  '#FF6B35', // Orange (default)
  '#E74C9E', // Pink
  '#45B7D1', // Blue
];

export default function ColorAvatarPicker({
  selectedColor,
  onColorSelect,
  initials,
}: ColorAvatarPickerProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {AVATAR_COLORS.map((color) => {
          const isSelected = color === selectedColor;
          return (
            <TouchableOpacity
              key={color}
              onPress={() => onColorSelect(color)}
              activeOpacity={0.7}
              style={styles.colorOption}
            >
              <View
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  isSelected && styles.selectedCircle,
                ]}
              >
                <View style={styles.initialsContainer}>
                  <View style={styles.initialsCircle}>
                    <View style={styles.initialsInner}>
                      {/* Initials are not shown in picker, just circles */}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.swipeHint}>
        <View style={styles.swipeIndicator} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
  },
  scrollContent: {
    paddingHorizontal: 40,
    gap: 20,
    alignItems: 'center',
  },
  colorOption: {
    padding: 4,
  },
  colorCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    borderWidth: 4,
    borderColor: '#1C1C1C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  initialsContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsInner: {
    width: '100%',
    height: '100%',
  },
  swipeHint: {
    alignItems: 'center',
    marginTop: 12,
  },
  swipeIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#AAAAAA',
    borderRadius: 2,
  },
});
