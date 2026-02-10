const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Custom Expo Config Plugin for @notifee/react-native
 * Only modifies AndroidManifest.xml for required permissions
 * 
 * NOTE: Notifee handles full-screen behavior internally through its JS API.
 * No MainActivity modifications are needed.
 */

const withNotifee = (config) => {
    return withAndroidManifest(config, async (config) => {
        const manifest = config.modResults.manifest;

        // Ensure permissions array exists
        if (!manifest['uses-permission']) {
            manifest['uses-permission'] = [];
        }

        // Add required permissions for full-screen intent and alarms
        const permissions = [
            'android.permission.USE_FULL_SCREEN_INTENT',
            'android.permission.WAKE_LOCK',
            'android.permission.RECEIVE_BOOT_COMPLETED',
            'android.permission.VIBRATE',
            'android.permission.POST_NOTIFICATIONS',
            'android.permission.SCHEDULE_EXACT_ALARM',
            'android.permission.USE_EXACT_ALARM',
        ];

        permissions.forEach((permission) => {
            const exists = manifest['uses-permission'].some(
                (p) => p.$?.['android:name'] === permission
            );
            if (!exists) {
                manifest['uses-permission'].push({
                    $: { 'android:name': permission },
                });
            }
        });

        // Optional: Add showWhenLocked and turnScreenOn to MainActivity in manifest
        // This is the proper way to declare these attributes
        const application = manifest.application?.[0];
        if (application?.activity) {
            const mainActivity = application.activity.find(
                (activity) =>
                    activity.$?.['android:name'] === '.MainActivity' ||
                    activity.$?.['android:name']?.includes('MainActivity')
            );

            if (mainActivity) {
                mainActivity.$['android:showWhenLocked'] = 'true';
                mainActivity.$['android:turnScreenOn'] = 'true';
                mainActivity.$['android:launchMode'] = 'singleTask';
            }
        }

        return config;
    });
};

module.exports = withNotifee;
