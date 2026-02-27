const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo Config Plugin for @notifee/react-native.
 * - Ensures Android manifest permissions
 * - Copies reminder sound into android raw resources
 * - Adds a small native module to detect Android 14+ full-screen intent access
 */

const REMINDER_SOUND_FILE = 'reminder_sound.mp3';
const FULL_SCREEN_MODULE_NAME = 'ShowdFullScreenIntent';
const FULL_SCREEN_PACKAGE_NAME = 'ShowdFullScreenIntentPackage';

const readFileIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
};

const writeFileIfChanged = (filePath, content) => {
  const previous = readFileIfExists(filePath);
  if (previous === content) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
};

const withReminderSound = (config) => {
  return withDangerousMod(config, ['android', async (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const source = path.join(projectRoot, 'src', 'assets', 'sounds', REMINDER_SOUND_FILE);
    const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');
    const dest = path.join(destDir, REMINDER_SOUND_FILE);

    try {
      if (fs.existsSync(source)) {
        fs.mkdirSync(destDir, { recursive: true });
        fs.copyFileSync(source, dest);
      }
    } catch {
      // Best-effort copy; build will still succeed with default sound if missing.
    }

    return modConfig;
  }]);
};

const patchMainApplicationKotlin = (mainApplicationPath, packageName) => {
  const original = readFileIfExists(mainApplicationPath);
  if (!original) return;
  let content = original;

  const packageImport = `import ${packageName}.${FULL_SCREEN_PACKAGE_NAME}`;
  if (!content.includes(packageImport)) {
    content = content.replace(/(import\s+[^\n]+\n)/, `$1${packageImport}\n`);
  }

  if (
    !content.includes(`${FULL_SCREEN_PACKAGE_NAME}()`) &&
    content.includes('PackageList(this).packages')
  ) {
    content = content.replace(
      'PackageList(this).packages',
      `PackageList(this).packages.apply { add(${FULL_SCREEN_PACKAGE_NAME}()) }`,
    );
  }

  if (content !== original) {
    fs.writeFileSync(mainApplicationPath, content);
  }
};

const patchMainApplicationJava = (mainApplicationPath, packageName) => {
  const original = readFileIfExists(mainApplicationPath);
  if (!original) return;
  let content = original;

  const packageImport = `import ${packageName}.${FULL_SCREEN_PACKAGE_NAME};`;
  if (!content.includes(packageImport)) {
    content = content.replace(/(import\s+[^\n]+;\n)/, `$1${packageImport}\n`);
  }

  if (
    !content.includes(`new ${FULL_SCREEN_PACKAGE_NAME}()`) &&
    content.includes('new PackageList(this).getPackages()')
  ) {
    content = content.replace(
      'List<ReactPackage> packages = new PackageList(this).getPackages();',
      `List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new ${FULL_SCREEN_PACKAGE_NAME}());`,
    );
  }

  if (content !== original) {
    fs.writeFileSync(mainApplicationPath, content);
  }
};

const withFullScreenIntentDetector = (config) => {
  return withDangerousMod(config, ['android', async (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const androidPackage = modConfig.android?.package || 'com.showd.app';
    const packageDir = androidPackage.split('.').join(path.sep);
    const javaDir = path.join(
      projectRoot,
      'android',
      'app',
      'src',
      'main',
      'java',
      packageDir,
    );

    const modulePath = path.join(javaDir, `${FULL_SCREEN_MODULE_NAME}.java`);
    const packagePath = path.join(javaDir, `${FULL_SCREEN_PACKAGE_NAME}.java`);

    const moduleSource = `package ${androidPackage};

import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ${FULL_SCREEN_MODULE_NAME} extends ReactContextBaseJavaModule {
  ${FULL_SCREEN_MODULE_NAME}(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "${FULL_SCREEN_MODULE_NAME}";
  }

  @ReactMethod
  public void canUseFullScreenIntent(Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      promise.resolve(true);
      return;
    }

    try {
      NotificationManager manager =
          (NotificationManager) getReactApplicationContext().getSystemService(Context.NOTIFICATION_SERVICE);
      boolean allowed = manager != null && manager.canUseFullScreenIntent();
      promise.resolve(allowed);
    } catch (Throwable error) {
      promise.resolve(true);
    }
  }
}
`;

    const packageSource = `package ${androidPackage};

import androidx.annotation.NonNull;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ${FULL_SCREEN_PACKAGE_NAME} implements ReactPackage {
  @NonNull
  @Override
  public List<NativeModule> createNativeModules(@NonNull ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();
    modules.add(new ${FULL_SCREEN_MODULE_NAME}(reactContext));
    return modules;
  }

  @NonNull
  @Override
  public List<ViewManager> createViewManagers(@NonNull ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }
}
`;

    writeFileIfChanged(modulePath, moduleSource);
    writeFileIfChanged(packagePath, packageSource);

    const mainApplicationKotlin = path.join(javaDir, 'MainApplication.kt');
    const mainApplicationJava = path.join(javaDir, 'MainApplication.java');
    patchMainApplicationKotlin(mainApplicationKotlin, androidPackage);
    patchMainApplicationJava(mainApplicationJava, androidPackage);

    return modConfig;
  }]);
};

const withNotifee = (config) => {
  return withAndroidManifest(config, async (modConfig) => {
    const manifest = modConfig.modResults.manifest;

    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }

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
        (item) => item.$?.['android:name'] === permission,
      );
      if (!exists) {
        manifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    const application = manifest.application?.[0];
    if (application?.activity) {
      const mainActivity = application.activity.find(
        (activity) =>
          activity.$?.['android:name'] === '.MainActivity' ||
          activity.$?.['android:name']?.includes('MainActivity'),
      );

      if (mainActivity) {
        mainActivity.$['android:showWhenLocked'] = 'true';
        mainActivity.$['android:turnScreenOn'] = 'true';
        mainActivity.$['android:launchMode'] = 'singleTask';
      }
    }

    return modConfig;
  });
};

module.exports = (config) => {
  config = withNotifee(config);
  config = withReminderSound(config);
  config = withFullScreenIntentDetector(config);
  return config;
};

