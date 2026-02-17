// RevenueCat is disabled until Play Console credentials are configured.
// Uncomment the real implementation below when ready.

// import Purchases, { type PurchasesOffering } from 'react-native-purchases';
// import { Platform } from 'react-native';
//
// const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
// const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';
//
// export async function initPurchases() {
//   await Purchases.configure({
//     apiKey: Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID,
//   });
// }
//
// export async function checkProStatus(): Promise<boolean> {
//   const info = await Purchases.getCustomerInfo();
//   return info.entitlements.active['pro'] !== undefined;
// }
//
// export async function getOfferings(): Promise<PurchasesOffering | null> {
//   const offerings = await Purchases.getOfferings();
//   return offerings.current;
// }
//
// export async function purchasePro(pkg: any): Promise<boolean> {
//   try {
//     const { customerInfo } = await Purchases.purchasePackage(pkg);
//     return customerInfo.entitlements.active['pro'] !== undefined;
//   } catch (e: any) {
//     if (e.userCancelled) return false;
//     throw e;
//   }
// }
//
// export async function restorePurchases(): Promise<boolean> {
//   const info = await Purchases.restorePurchases();
//   return info.entitlements.active['pro'] !== undefined;
// }

// ── Stubs: treat everyone as Pro while RevenueCat is disabled ──

export async function initPurchases(): Promise<void> {
  // no-op
}

export async function checkProStatus(): Promise<boolean> {
  return true; // Everyone is Pro for now
}

export async function getOfferings(): Promise<null> {
  return null;
}

export async function purchasePro(_pkg: any): Promise<boolean> {
  return true;
}

export async function restorePurchases(): Promise<boolean> {
  return true;
}
