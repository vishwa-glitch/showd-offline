import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../utils/colors';
import { Typography, FontFamily } from '../../utils/typography';
import { Spacing, BorderRadius } from '../../utils/spacing';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import type { PhoneInputScreenProps } from '../../types/navigation';

export function PhoneInputScreen({ navigation }: PhoneInputScreenProps) {
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = phoneNumber.replace(/\D/g, '').length >= 10;

  const handleSendCode = () => {
    setLoading(true);
    // Mock: simulate sending code
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('OTPVerify', {
        phoneNumber: `${countryCode}${phoneNumber}`,
      });
    }, 1000);
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
        <Text style={styles.heading}>What's your number?</Text>
        <Text style={styles.subtext}>
          We'll send you a code to verify.
        </Text>

        <View style={styles.phoneRow}>
          <TouchableOpacity style={styles.countryCode}>
            <Text style={styles.countryCodeText}>{countryCode}</Text>
            <Feather name="chevron-down" size={16} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.phoneInputWrapper}>
            <Input
              placeholder="Phone number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoFocus
              containerStyle={styles.phoneInput}
            />
          </View>
        </View>
      </View>

      <View style={styles.bottomSection}>
        <Button
          label="Send Code"
          onPress={handleSendCode}
          disabled={!isValid}
          loading={loading}
          fullWidth
        />
        <Text style={styles.terms}>
          By continuing, you agree to our Terms & Privacy Policy
        </Text>
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
  phoneRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    height: 48,
    gap: Spacing.xs,
  },
  countryCodeText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  phoneInputWrapper: {
    flex: 1,
  },
  phoneInput: {
    marginBottom: 0,
  },
  bottomSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  terms: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});
