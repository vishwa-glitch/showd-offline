import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Button } from '../../components/ui/Button';
import { sendOTP, verifyOTP } from '../../services/auth';
import { checkAllPermissions } from '../../services/permissions';
import { getUser } from '../../services/database';
import { dbToUser } from '../../utils/mappers';
import { useSignIn } from '../../store/authStore';
import { usePermissionStoreBase } from '../../store/permissionStore';
import type { OTPVerifyScreenProps } from '../../types/navigation';

const CODE_LENGTH = 6;

export function OTPVerifyScreen({ navigation, route }: OTPVerifyScreenProps) {
  const { phoneNumber } = route.params;
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const signIn = useSignIn();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleChange = (text: string, index: number) => {
    setError('');
    const newCode = [...code];

    if (text.length > 1) {
      // Handle paste
      const digits = text.replace(/\D/g, '').split('').slice(0, CODE_LENGTH);
      digits.forEach((d, i) => {
        if (i + index < CODE_LENGTH) {
          newCode[i + index] = d;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const digit = text.replace(/[^0-9]/g, '');
      newCode[index] = digit;
      setCode(newCode);
      if (text && index < CODE_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    // Auto-submit when all digits filled
    const fullCode = newCode.join('');
    if (fullCode.length === CODE_LENGTH && !fullCode.includes('')) {
      Keyboard.dismiss();
      handleVerify(fullCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    const token = fullCode || code.join('');
    if (token.length !== CODE_LENGTH) return;

    setLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, token);

      if (result.isNewUser) {
        navigation.navigate('ProfileSetup', { phone: phoneNumber });
      } else {
        // Existing user → fetch profile and check onboarding status
        const { data: existingUser } = await getUser(result.userId);
        if (existingUser) {
          const mappedUser = dbToUser(existingUser);
          const { onboardingPermissionsCompleted } =
            usePermissionStoreBase.getState();

          // Layer 1: Never completed permission onboarding
          if (!onboardingPermissionsCompleted) {
            navigation.navigate('PermissionSetup', { user: mappedUser });
            return;
          }

          // Layer 2: Flag says completed, but verify actual OS permissions
          // (handles reinstall / user revoked permissions in Settings)
          const status = await checkAllPermissions();
          if (!status.notifications || !status.exactAlarm) {
            Alert.alert(
              'Permissions Needed',
              'Showd needs notification permissions to send reminders. Let\'s set that up.',
              [{
                text: 'Continue',
                onPress: () =>
                  navigation.navigate('PermissionSetup', { user: mappedUser }),
              }],
              { cancelable: false },
            );
            return;
          }

          // Both layers passed → sign in directly
          signIn(mappedUser);
        }
        // Navigation will automatically switch to main tabs via AppNavigator
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendTimer(30);
    setCode(Array(CODE_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    try {
      await sendOTP(phoneNumber);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend code.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Feather name="arrow-left" size={24} color={Colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.heading}>Enter the code</Text>
        <Text style={styles.subtext}>
          Sent to {phoneNumber}
        </Text>

        {/* OTP Inputs */}
        <View style={styles.codeRow}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputRefs.current[index] = ref; }}
              style={[
                styles.codeInput,
                digit && styles.codeInputFilled,
                error && styles.codeInputError,
              ]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={index === 0 ? CODE_LENGTH : 1}
              autoFocus={index === 0}
              selectTextOnFocus
            />
          ))}
        </View>

        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}

        {/* Resend */}
        <View style={styles.resendRow}>
          {resendTimer > 0 ? (
            <Text style={styles.resendTimer}>
              Resend code in {resendTimer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Resend code</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.wrongNumber}>Wrong number? Go back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSection}>
        <Button
          label="Verify"
          onPress={() => handleVerify()}
          disabled={code.some((d) => !d)}
          loading={loading}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  backButton: {
    padding: Spacing.base,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  heading: {
    ...Typography.heading1,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtext: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing['2xl'],
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  codeInput: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceSecondary,
    fontFamily: FontFamily.bold,
    fontSize: 24,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  codeInputError: {
    borderColor: Colors.missed,
  },
  error: {
    ...Typography.bodySmall,
    color: Colors.missed,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resendTimer: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
  },
  resendLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
  },
  wrongNumber: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
});
