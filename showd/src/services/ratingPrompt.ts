import { Linking } from 'react-native';

const PACKAGE_NAME = 'com.showd.app';

export async function openPlayStoreRating(): Promise<void> {
  const playStoreUrl = `market://details?id=${PACKAGE_NAME}`;
  const webUrl = `https://play.google.com/store/apps/details?id=${PACKAGE_NAME}`;

  try {
    const supported = await Linking.canOpenURL(playStoreUrl);
    await Linking.openURL(supported ? playStoreUrl : webUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
}
