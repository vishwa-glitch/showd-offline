import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';

interface PhotoProofCameraProps {
  taskName: string;
  onPhotoTaken: (uri: string) => void;
  onSkip: () => void;
}

/**
 * Photo proof camera screen.
 * Opens after "Done" on proof-enabled tasks.
 * Uses expo-image-picker for simplicity (camera capture).
 */
export function PhotoProofCamera({ taskName, onPhotoTaken, onSkip }: PhotoProofCameraProps) {
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCapture = async () => {
    try {
      // Dynamic import to avoid bundling when not needed
      const ImagePicker = require('expo-image-picker');

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in Settings to take proof photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.7,
        allowsEditing: false,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('[PhotoProofCamera] capture failed:', err);
      Alert.alert('Error', 'Failed to open camera. You can skip this step.');
    }
  };

  const handleUsePhoto = () => {
    if (capturedUri) {
      setLoading(true);
      onPhotoTaken(capturedUri);
    }
  };

  const handleRetake = () => {
    setCapturedUri(null);
  };

  // Preview state: show captured photo with Use/Retake buttons
  if (capturedUri) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleRetake}>
            <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Preview</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedUri }} style={styles.previewImage} resizeMode="cover" />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.usePhotoBtn}
            onPress={handleUsePhoto}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Feather name="check" size={20} color={Colors.surface} />
            <Text style={styles.usePhotoBtnText}>
              {loading ? 'Saving...' : 'Use This Photo'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
            <Text style={styles.retakeBtnText}>Retake</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Capture state: camera launcher
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSkip}>
          <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Proof</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.captureBody}>
        <Feather name="camera" size={48} color={Colors.textTertiary} />
        <Text style={styles.captureTitle}>Take a photo to prove it</Text>
        <Text style={styles.captureSubtitle}>
          Snap a quick photo showing you completed "{taskName}"
        </Text>

        <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.8}>
          <View style={styles.captureCircle}>
            <View style={styles.captureInner} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
          <Text style={styles.skipBtnText}>Skip this time</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    ...Typography.heading3,
    color: Colors.textPrimary,
  },
  captureBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  captureTitle: {
    ...Typography.heading2,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  captureSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  captureBtn: {
    marginVertical: Spacing.xl,
  },
  captureCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
  },
  skipBtn: {
    paddingVertical: Spacing.md,
  },
  skipBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textTertiary,
  },
  previewContainer: {
    flex: 1,
    margin: Spacing.xl,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  previewImage: {
    flex: 1,
    width: '100%',
  },
  buttonRow: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  usePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  usePhotoBtnText: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    color: Colors.surface,
  },
  retakeBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  retakeBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: Colors.textTertiary,
  },
});
