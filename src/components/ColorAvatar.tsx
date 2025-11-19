import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

interface ColorAvatarProps {
  color: string;
  initials: string;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function ColorAvatar({
  color,
  initials,
  size = 80,
  onPress,
  style,
}: ColorAvatarProps) {
  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  };

  const fontSize = size * 0.4; // Font size is 40% of avatar size

  const content = (
    <View style={[styles.avatar, avatarStyle, style]}>
      <Text style={[styles.initials, { fontSize }]}>{initials.toUpperCase()}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
