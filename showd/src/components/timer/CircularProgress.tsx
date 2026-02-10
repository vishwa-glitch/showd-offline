import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../utils/colors';

interface CircularProgressProps {
  /** Progress value from 0 to 1 (fills clockwise from 12 o'clock) */
  progress: number;
  /** Diameter in pixels (default: 200) */
  size?: number;
  /** Stroke width in pixels (default: 6) */
  strokeWidth?: number;
  /** Progress color (default: Colors.inProgress) */
  color?: string;
  /** Track color (default: white at 15% opacity) */
  trackColor?: string;
  /** Content to render inside the ring */
  children?: React.ReactNode;
}

export function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 6,
  color = Colors.inProgress,
  trackColor = 'rgba(255, 255, 255, 0.15)',
  children,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
