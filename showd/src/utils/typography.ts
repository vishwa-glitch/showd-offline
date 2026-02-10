import { TextStyle } from 'react-native';

export const FontFamily = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semiBold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
} as const;

export const Typography = {
  heading1: {
    fontFamily: FontFamily.bold,
    fontSize: 32,
    lineHeight: 40,
  } as TextStyle,
  heading2: {
    fontFamily: FontFamily.semiBold,
    fontSize: 24,
    lineHeight: 32,
  } as TextStyle,
  heading3: {
    fontFamily: FontFamily.semiBold,
    fontSize: 18,
    lineHeight: 24,
  } as TextStyle,
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodySmall: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
  caption: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  button: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    lineHeight: 22,
  } as TextStyle,
  reminderTask: {
    fontFamily: FontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
  } as TextStyle,
  reminderWitness: {
    fontFamily: FontFamily.medium,
    fontSize: 18,
    lineHeight: 24,
  } as TextStyle,
  timerDisplay: {
    fontFamily: FontFamily.bold,
    fontSize: 56,
    lineHeight: 64,
  } as TextStyle,
  timerLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
} as const;
