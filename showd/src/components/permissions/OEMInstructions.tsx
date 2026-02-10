import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { getOEMInstructions, type OEMBrand } from '../../constants/oemConfig';

interface OEMInstructionsProps {
  brand: OEMBrand;
}

export function OEMInstructions({ brand }: OEMInstructionsProps) {
  const steps = getOEMInstructions(brand);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <View key={index} style={styles.step}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepDescription}>{step.description}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    gap: Spacing.base,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontFamily: FontFamily.bold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 15,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  stepDescription: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
});
