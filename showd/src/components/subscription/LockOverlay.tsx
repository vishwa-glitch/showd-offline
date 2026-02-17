import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';

interface LockOverlayProps {
  children: React.ReactNode;
}

export function LockOverlay({ children }: LockOverlayProps) {
  return (
    <View style={styles.container}>
      {children}
      <View style={styles.overlay}>
        <Feather name="lock" size={20} color={Colors.textTertiary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
});
