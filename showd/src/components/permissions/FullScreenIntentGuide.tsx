import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius, Shadows } from '../../utils/spacing';
import {
    getOEMBrand,
    getOEMDisplayName,
    getFullScreenIntentInstructions,
} from '../../constants/oemConfig';
import { requestFullScreenIntentPermission } from '../../services/permissions';

interface FullScreenIntentGuideProps {
    visible: boolean;
    onDismiss: () => void;
}

export function FullScreenIntentGuide({ visible, onDismiss }: FullScreenIntentGuideProps) {
    const brand = getOEMBrand();
    const brandName = getOEMDisplayName();
    const steps = getFullScreenIntentInstructions(brand);

    const handleOpenSettings = async () => {
        await requestFullScreenIntentPermission();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onDismiss}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    <ScrollView
                        contentContainerStyle={styles.content}
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {/* Header */}
                        <View style={styles.headerIcon}>
                            <Feather name="maximize" size={28} color={Colors.primary} />
                        </View>
                        <Text style={styles.title}>Enable Full-Screen Reminders</Text>
                        <Text style={styles.subtitle}>
                            This permission lets Showd take over your screen when a reminder fires — even when your phone is locked.
                        </Text>

                        {/* Brand badge */}
                        <View style={styles.brandBadge}>
                            <Feather name="smartphone" size={14} color={Colors.inProgress} />
                            <Text style={styles.brandText}>
                                Steps for {brandName || 'your device'}
                            </Text>
                        </View>

                        {/* Steps */}
                        <View style={styles.stepsContainer}>
                            {steps.map((step, index) => (
                                <View key={index} style={styles.stepRow}>
                                    <View style={styles.stepNumberContainer}>
                                        <Text style={styles.stepNumber}>{index + 1}</Text>
                                    </View>
                                    <View style={styles.stepContent}>
                                        <Text style={styles.stepTitle}>{step.title}</Text>
                                        <Text style={styles.stepDescription}>{step.description}</Text>
                                    </View>
                                    {index < steps.length - 1 && <View style={styles.stepConnector} />}
                                </View>
                            ))}
                        </View>

                        {/* CTA Buttons */}
                        <TouchableOpacity style={styles.primaryButton} onPress={handleOpenSettings} activeOpacity={0.8}>
                            <Feather name="external-link" size={18} color="#FFFFFF" />
                            <Text style={styles.primaryButtonText}>Open Settings</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss} activeOpacity={0.7}>
                            <Text style={styles.secondaryButtonText}>I'll do this later</Text>
                        </TouchableOpacity>

                        {/* Hint */}
                        <Text style={styles.hintText}>
                            Come back to Showd after enabling the permission. We'll check automatically.
                        </Text>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Colors.overlayMedium,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        ...Shadows.lg,
    },
    handleBar: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.border,
        alignSelf: 'center',
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    content: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing['3xl'],
        alignItems: 'center',
    },

    // ── Header ──
    headerIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.heading2,
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        ...Typography.bodySmall,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
        marginBottom: Spacing.xl,
    },

    // ── Brand badge ──
    brandBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        backgroundColor: Colors.inProgressLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.xl,
    },
    brandText: {
        ...Typography.caption,
        color: Colors.inProgress,
        fontFamily: FontFamily.semiBold,
    },

    // ── Steps ──
    stepsContainer: {
        width: '100%',
        marginBottom: Spacing.xl,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: Spacing.lg,
        position: 'relative',
    },
    stepNumberContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
        zIndex: 1,
    },
    stepNumber: {
        color: '#FFFFFF',
        fontFamily: FontFamily.bold,
        fontSize: 14,
    },
    stepContent: {
        flex: 1,
        paddingTop: 4,
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
        lineHeight: 20,
    },
    stepConnector: {
        position: 'absolute',
        left: 15,
        top: 34,
        bottom: 0,
        width: 2,
        backgroundColor: Colors.primaryLight,
    },

    // ── Buttons ──
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        width: '100%',
        height: 56,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.primary,
        marginBottom: Spacing.md,
    },
    primaryButtonText: {
        ...Typography.button,
        color: '#FFFFFF',
    },
    secondaryButton: {
        paddingVertical: Spacing.md,
        marginBottom: Spacing.md,
    },
    secondaryButtonText: {
        ...Typography.bodySmall,
        color: Colors.textTertiary,
        fontFamily: FontFamily.medium,
    },

    // ── Hint ──
    hintText: {
        ...Typography.caption,
        color: Colors.textTertiary,
        textAlign: 'center',
        lineHeight: 18,
    },
});
