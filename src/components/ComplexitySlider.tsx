import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ComplexitySliderProps {
  currentLevel: number; // 0-4
  onLevelChange: (level: number) => void;
}

const LEVELS = [
  { value: 0, label: 'Recipe\nKiller', shortLabel: 'Killer' },
  { value: 1, label: 'Simple', shortLabel: 'Simple' },
  { value: 2, label: 'Average', shortLabel: 'Average' },
  { value: 3, label: 'Complex', shortLabel: 'Complex' },
  { value: 4, label: 'Very\nComplex', shortLabel: 'V. Complex' },
];

export default function ComplexitySlider({
  currentLevel,
  onLevelChange,
}: ComplexitySliderProps) {
  return (
    <View style={styles.container}>
      {/* Slider Track */}
      <View style={styles.trackContainer}>
        <View style={styles.track} />

        {/* Slider Points */}
        <View style={styles.pointsContainer}>
          {LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={styles.pointWrapper}
              onPress={() => onLevelChange(level.value)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.point,
                  currentLevel === level.value && styles.pointActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Labels */}
      <View style={styles.labelsContainer}>
        {LEVELS.map((level) => (
          <TouchableOpacity
            key={level.value}
            style={styles.labelWrapper}
            onPress={() => onLevelChange(level.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                currentLevel === level.value && styles.labelActive,
              ]}
              numberOfLines={2}
            >
              {level.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 16,
  },
  trackContainer: {
    height: 56,
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  track: {
    position: 'absolute',
    left: 40,
    right: 40,
    height: 16,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  pointWrapper: {
    padding: 10,
  },
  point: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1E',
    borderWidth: 3,
    borderColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  pointActive: {
    backgroundColor: '#A4E900',
    borderColor: '#A4E900',
    shadowColor: '#A4E900',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  labelWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 13,
    color: '#98989D',
    textAlign: 'center',
    lineHeight: 17,
  },
  labelActive: {
    color: '#A4E900',
    fontWeight: '700',
  },
});
