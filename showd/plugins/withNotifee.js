const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Custom Expo Config Plugin for @notifee/react-native.
 * - Ensures Android manifest permissions
 * - Copies reminder sound into android raw resources
 * - Adds a small native module to detect Android 14+ full-screen intent access
 */

const REMINDER_SOUND_FILES = [
  'reminder_sound.mp3',
  'gentle_pulse.mp3',
  'morning_call.mp3',
  'steady_knock.mp3',
  'urgent_bell.mp3',
  'calm_wave.mp3',
];
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

const withNotifeeDependencyResolution = (config) => {
  return withDangerousMod(config, ['android', async (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const settingsGradlePath = path.join(projectRoot, 'android', 'settings.gradle');
    const rootBuildGradlePath = path.join(projectRoot, 'android', 'build.gradle');
    const appBuildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');

    const settingsGradle = readFileIfExists(settingsGradlePath);
    if (settingsGradle) {
      let patchedSettings = settingsGradle;
      const localRepoLine = 'maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }';
      const hostedRepoLine = 'maven { url("https://maven.notifee.app") }';
      const injectRepoLine = (content, repoLine) => {
        if (content.includes(repoLine)) return content;

        const withExistingRepos = content.replace(
          /dependencyResolutionManagement\s*\{[\s\S]*?repositories\s*\{/,
          (match) => `${match}\n        ${repoLine}`,
        );
        if (withExistingRepos !== content) return withExistingRepos;

        return content.replace(
          /dependencyResolutionManagement\s*\{/,
          (match) => `${match}\n    repositories {\n        ${repoLine}\n    }`,
        );
      };

      patchedSettings = injectRepoLine(patchedSettings, localRepoLine);
      patchedSettings = injectRepoLine(patchedSettings, hostedRepoLine);

      if (
        patchedSettings !== settingsGradle &&
        patchedSettings.includes('dependencyResolutionManagement') &&
        patchedSettings.includes('repositories')
      ) {
        writeFileIfChanged(settingsGradlePath, patchedSettings);
      }
    }

    const rootBuildGradle = readFileIfExists(rootBuildGradlePath);
    if (rootBuildGradle) {
      let patchedRootBuildGradle = rootBuildGradle;
      const localRepoLine = 'maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }';
      const hostedRepoLine = 'maven { url("https://maven.notifee.app") }';

      const injectAllProjectsRepo = (content, repoLine) => {
        if (content.includes(repoLine)) return content;

        const withAllProjectsRepos = content.replace(
          /allprojects\s*\{[\s\S]*?repositories\s*\{/,
          (match) => `${match}\n    ${repoLine}`,
        );
        if (withAllProjectsRepos !== content) return withAllProjectsRepos;

        return `${content}

allprojects {
  repositories {
    ${repoLine}
  }
}
`;
      };

      patchedRootBuildGradle = injectAllProjectsRepo(patchedRootBuildGradle, localRepoLine);
      patchedRootBuildGradle = injectAllProjectsRepo(patchedRootBuildGradle, hostedRepoLine);

      if (patchedRootBuildGradle !== rootBuildGradle) {
        writeFileIfChanged(rootBuildGradlePath, patchedRootBuildGradle);
      }
    }

    const appBuildGradle = readFileIfExists(appBuildGradlePath);
    if (appBuildGradle && !appBuildGradle.includes('details.requested.group == "app.notifee"')) {
      const notifeePinSnippet = `
configurations.configureEach {
    resolutionStrategy.eachDependency { details ->
        if (details.requested.group == "app.notifee" && details.requested.name == "core") {
            details.useVersion("202108261754")
            details.because("Pin Notifee core to avoid dynamic version metadata failures")
        }
    }
}
`;
      writeFileIfChanged(appBuildGradlePath, `${appBuildGradle}\n${notifeePinSnippet}`);
    }

    return modConfig;
  }]);
};

const withReminderSound = (config) => {
  return withDangerousMod(config, ['android', async (modConfig) => {
    const projectRoot = modConfig.modRequest.projectRoot;
    const destDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res', 'raw');

    try {
      fs.mkdirSync(destDir, { recursive: true });
      for (const fileName of REMINDER_SOUND_FILES) {
        const source = path.join(projectRoot, 'src', 'assets', 'sounds', fileName);
        const dest = path.join(destDir, fileName);
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, dest);
        }
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

import android.app.KeyguardManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.bridge.WritableMap;

public class ${FULL_SCREEN_MODULE_NAME} extends ReactContextBaseJavaModule {
  private static final String PREFS_NAME = "showd_overlay_prefs";
  private static final String KEY_PENDING_ACTION = "pending_action";
  private static final String KEY_PENDING_TASK_ID = "pending_task_id";

  private View overlayView = null;
  private WindowManager windowManager = null;
  private MediaPlayer overlaySoundPlayer = null;
  private Vibrator overlayVibrator = null;

  ${FULL_SCREEN_MODULE_NAME}(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "${FULL_SCREEN_MODULE_NAME}";
  }

  private int dp(int value) {
    return (int) TypedValue.applyDimension(
      TypedValue.COMPLEX_UNIT_DIP,
      value,
      getReactApplicationContext().getResources().getDisplayMetrics()
    );
  }

  private GradientDrawable roundedRect(String color, int radiusDp) {
    GradientDrawable drawable = new GradientDrawable();
    drawable.setColor(Color.parseColor(color));
    drawable.setCornerRadius(dp(radiusDp));
    return drawable;
  }

  private GradientDrawable circle(String fill, String stroke, int strokeDp) {
    GradientDrawable drawable = new GradientDrawable();
    drawable.setShape(GradientDrawable.OVAL);
    drawable.setColor(Color.parseColor(fill));
    drawable.setStroke(dp(strokeDp), Color.parseColor(stroke));
    return drawable;
  }

  private TextView createActionButton(
    Context context,
    String label,
    String bgColor,
    View.OnClickListener listener
  ) {
    TextView btn = new TextView(context);
    btn.setText(label);
    btn.setTextColor(Color.WHITE);
    btn.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
    btn.setGravity(Gravity.CENTER);
    btn.setTypeface(btn.getTypeface(), Typeface.BOLD);
    btn.setPadding(dp(16), dp(18), dp(16), dp(18));
    btn.setMinHeight(dp(64));
    btn.setBackground(roundedRect(bgColor, 16));
    btn.setOnClickListener(listener);
    btn.setClickable(true);
    btn.setFocusable(true);
    return btn;
  }

  private String extractWitnessInitials(String messageBody) {
    if (messageBody == null) return "";
    String marker = " is counting on you";
    if (!messageBody.endsWith(marker)) return "";

    String witnessName = messageBody.substring(0, messageBody.length() - marker.length()).trim();
    if (witnessName.length() == 0) return "";

    String[] parts = witnessName.split("\\\\s+");
    if (parts.length == 0) return "";
    if (parts.length == 1) {
      String first = parts[0].toUpperCase();
      return first.substring(0, Math.min(2, first.length()));
    }
    String a = parts[0].substring(0, 1).toUpperCase();
    String b = parts[1].substring(0, 1).toUpperCase();
    return a + b;
  }

  private void savePendingAction(String action, String taskId) {
    SharedPreferences prefs = getReactApplicationContext()
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    prefs.edit()
      .putString(KEY_PENDING_ACTION, action)
      .putString(KEY_PENDING_TASK_ID, taskId)
      .apply();
  }

  private void clearPendingAction() {
    SharedPreferences prefs = getReactApplicationContext()
      .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    prefs.edit()
      .remove(KEY_PENDING_ACTION)
      .remove(KEY_PENDING_TASK_ID)
      .apply();
  }

  private int resolveReminderSoundResId(String soundId) {
    String resourceName = "reminder_sound";
    if (soundId != null) {
      String trimmed = soundId.trim();
      if (trimmed.length() > 0) {
        resourceName = trimmed;
      }
    }
    return getReactApplicationContext()
      .getResources()
      .getIdentifier(resourceName, "raw", getReactApplicationContext().getPackageName());
  }

  private void stopOverlaySoundInternal() {
    if (overlaySoundPlayer == null) return;
    try {
      if (overlaySoundPlayer.isPlaying()) {
        overlaySoundPlayer.stop();
      }
    } catch (Throwable ignored) {
      // best effort
    }
    try {
      overlaySoundPlayer.release();
    } catch (Throwable ignored) {
      // best effort
    } finally {
      overlaySoundPlayer = null;
    }
  }

  private void startOverlaySoundInternal(String soundId) {
    stopOverlaySoundInternal();

    Context context = getReactApplicationContext();
    int soundResId = resolveReminderSoundResId(soundId);
    if (soundResId == 0) {
      soundResId = resolveReminderSoundResId("reminder_sound");
    }
    if (soundResId == 0) return;

    try {
      MediaPlayer player = MediaPlayer.create(context, soundResId);
      if (player == null) return;

      player.setLooping(true);
      player.setVolume(1.0f, 1.0f);
      player.setOnErrorListener((mp, what, extra) -> {
        stopOverlaySoundInternal();
        return true;
      });
      player.start();
      overlaySoundPlayer = player;
    } catch (Throwable ignored) {
      stopOverlaySoundInternal();
    }
  }

  private void stopOverlayVibrationInternal() {
    try {
      if (overlayVibrator != null) {
        overlayVibrator.cancel();
      }
    } catch (Throwable ignored) {
      // best effort
    } finally {
      overlayVibrator = null;
    }
  }

  private void startOverlayVibrationInternal() {
    stopOverlayVibrationInternal();

    Context context = getReactApplicationContext();
    Vibrator vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
    if (vibrator == null) return;

    try {
      if (!vibrator.hasVibrator()) return;
    } catch (Throwable ignored) {
      // Some OEM ROMs can throw here; continue best-effort.
    }

    long[] pattern = new long[] {0, 220, 180, 260, 180, 320};
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        vibrator.vibrate(VibrationEffect.createWaveform(pattern, -1));
      } else {
        vibrator.vibrate(pattern, -1);
      }
      overlayVibrator = vibrator;
    } catch (Throwable ignored) {
      overlayVibrator = null;
    }
  }

  private void removeOverlayInternal() {
    try {
      if (windowManager != null && overlayView != null) {
        windowManager.removeView(overlayView);
      }
    } catch (Throwable ignored) {
      // best effort
    } finally {
      stopOverlaySoundInternal();
      stopOverlayVibrationInternal();
      overlayView = null;
    }
  }

  private void openApp(String taskId, String action) {
    Context context = getReactApplicationContext();
    Intent launchIntent = context.getPackageManager()
      .getLaunchIntentForPackage(context.getPackageName());
    if (launchIntent == null) return;

    if (taskId != null) {
      launchIntent.putExtra("showd_task_id", taskId);
    }
    if (action != null) {
      launchIntent.putExtra("showd_overlay_action", action);
    }

    launchIntent.addFlags(
      Intent.FLAG_ACTIVITY_NEW_TASK
        | Intent.FLAG_ACTIVITY_SINGLE_TOP
        | Intent.FLAG_ACTIVITY_CLEAR_TOP
    );
    context.startActivity(launchIntent);
  }

  private boolean isUnlocked() {
    KeyguardManager keyguard =
      (KeyguardManager) getReactApplicationContext().getSystemService(Context.KEYGUARD_SERVICE);
    return keyguard == null || !keyguard.isKeyguardLocked();
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

  @ReactMethod
  public void canDrawOverlays(Promise promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(true);
      return;
    }

    try {
      boolean allowed = Settings.canDrawOverlays(getReactApplicationContext());
      promise.resolve(allowed);
    } catch (Throwable error) {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void openOverlayPermissionSettings(Promise promise) {
    try {
      Context context = getReactApplicationContext();
      Intent intent = new Intent(
        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
        Uri.parse("package:" + context.getPackageName())
      );
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      context.startActivity(intent);
      promise.resolve(true);
    } catch (Throwable error) {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void openAppForReminderIfUnlocked(String taskId, Promise promise) {
    try {
      Context context = getReactApplicationContext();
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
        promise.resolve(false);
        return;
      }
      if (!isUnlocked()) {
        promise.resolve(false);
        return;
      }
      openApp(taskId, "open");
      promise.resolve(true);
    } catch (Throwable error) {
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void showReminderOverlay(
    String taskId,
    String title,
    String body,
    String description,
    String soundId,
    String witnessPhotoUri,
    Promise promise
  ) {
    UiThreadUtil.runOnUiThread(() -> {
      try {
        Context context = getReactApplicationContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
          promise.resolve(false);
          return;
        }
        if (!isUnlocked()) {
          promise.resolve(false);
          return;
        }

        if (windowManager == null) {
          windowManager = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
        }
        if (windowManager == null) {
          promise.resolve(false);
          return;
        }

        removeOverlayInternal();
        startOverlaySoundInternal(soundId);
        startOverlayVibrationInternal();

        FrameLayout root = new FrameLayout(context);
        root.setClickable(true);
        root.setFocusable(true);
        root.setBackgroundColor(Color.parseColor("#F20F0A14"));

        LinearLayout content = new LinearLayout(context);
        content.setOrientation(LinearLayout.VERTICAL);
        content.setGravity(Gravity.CENTER_HORIZONTAL);
        content.setPadding(dp(32), 0, dp(32), 0);

        FrameLayout.LayoutParams contentParams = new FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.MATCH_PARENT,
          FrameLayout.LayoutParams.WRAP_CONTENT,
          Gravity.CENTER
        );
        content.setLayoutParams(contentParams);

        TextView categoryIcon = new TextView(context);
        categoryIcon.setText("◉");
        categoryIcon.setTextColor(Color.parseColor("#E6FFFFFF"));
        categoryIcon.setTextSize(TypedValue.COMPLEX_UNIT_SP, 48);
        LinearLayout.LayoutParams categoryParams = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.WRAP_CONTENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        categoryParams.bottomMargin = dp(24);
        categoryIcon.setLayoutParams(categoryParams);

        String initials = extractWitnessInitials(body);
        String cleanDescription = description != null ? description.trim() : "";
        String cleanWitnessPhotoUri = witnessPhotoUri != null ? witnessPhotoUri.trim() : "";

        FrameLayout pulseCircle = new FrameLayout(context);
        pulseCircle.setBackground(circle("#4DFF4D6A", "#99FF4D6A", 2));
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
          pulseCircle.setClipToOutline(true);
        }
        LinearLayout.LayoutParams pulseParams = new LinearLayout.LayoutParams(dp(96), dp(96));
        pulseParams.bottomMargin = dp(32);
        pulseCircle.setLayoutParams(pulseParams);

        boolean hasWitnessPhoto = cleanWitnessPhotoUri.length() > 0;
        if (hasWitnessPhoto) {
          try {
            ImageView witnessPhoto = new ImageView(context);
            witnessPhoto.setScaleType(ImageView.ScaleType.CENTER_CROP);
            witnessPhoto.setImageURI(Uri.parse(cleanWitnessPhotoUri));
            if (witnessPhoto.getDrawable() != null) {
              FrameLayout.LayoutParams witnessPhotoParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
              );
              witnessPhoto.setLayoutParams(witnessPhotoParams);
              pulseCircle.addView(witnessPhoto);
            } else {
              hasWitnessPhoto = false;
            }
          } catch (Throwable ignored) {
            hasWitnessPhoto = false;
          }
        }

        if (!hasWitnessPhoto) {
          TextView initialsView = new TextView(context);
          initialsView.setText(initials.length() > 0 ? initials : "U");
          initialsView.setTextColor(Color.parseColor("#E6FFFFFF"));
          initialsView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 24);
          initialsView.setTypeface(initialsView.getTypeface(), Typeface.BOLD);
          initialsView.setGravity(Gravity.CENTER);
          FrameLayout.LayoutParams initialsParams = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
          );
          initialsView.setLayoutParams(initialsParams);
          pulseCircle.addView(initialsView);
        }

        TextView titleView = new TextView(context);
        titleView.setText(title != null && title.length() > 0 ? title : "Reminder");
        titleView.setTextColor(Color.WHITE);
        titleView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        titleView.setGravity(Gravity.CENTER);
        titleView.setTypeface(titleView.getTypeface(), Typeface.BOLD);
        titleView.setMaxLines(3);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        titleParams.bottomMargin = dp(12);
        titleView.setLayoutParams(titleParams);

        TextView bodyView = new TextView(context);
        bodyView.setText(body != null && body.length() > 0 ? body : "Time to show up for yourself");
        bodyView.setTextColor(Color.parseColor("#CCFFFFFF"));
        bodyView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        bodyView.setGravity(Gravity.CENTER);
        bodyView.setMaxLines(3);
        bodyView.setLineSpacing(0f, 1.12f);
        LinearLayout.LayoutParams bodyParams = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        bodyParams.bottomMargin = cleanDescription.length() > 0 ? dp(10) : dp(28);
        bodyView.setLayoutParams(bodyParams);

        TextView descriptionView = null;
        if (cleanDescription.length() > 0) {
          descriptionView = new TextView(context);
          descriptionView.setText(cleanDescription);
          descriptionView.setTextColor(Color.parseColor("#B8FFFFFF"));
          descriptionView.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
          descriptionView.setGravity(Gravity.CENTER);
          descriptionView.setMaxLines(4);
          descriptionView.setLineSpacing(0f, 1.12f);
          LinearLayout.LayoutParams descriptionParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
          );
          descriptionParams.bottomMargin = dp(22);
          descriptionView.setLayoutParams(descriptionParams);
        }

        LinearLayout buttons = new LinearLayout(context);
        buttons.setOrientation(LinearLayout.VERTICAL);
        buttons.setGravity(Gravity.CENTER_HORIZONTAL);
        LinearLayout.LayoutParams buttonsParams = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        buttonsParams.topMargin = dp(24);
        buttons.setLayoutParams(buttonsParams);

        TextView doneButton = createActionButton(
          context,
          "Done",
          "#2ECC71",
          v -> {
            savePendingAction("done", taskId);
            removeOverlayInternal();
            openApp(taskId, "done");
          }
        );
        TextView snoozeButton = createActionButton(
          context,
          "Snooze 15min",
          "#F5A623",
          v -> {
            savePendingAction("snooze", taskId);
            removeOverlayInternal();
            openApp(taskId, "snooze");
          }
        );
        TextView strugglingButton = createActionButton(
          context,
          "Struggling Today",
          "#7C8DB5",
          v -> {
            clearPendingAction();
            removeOverlayInternal();
            openApp(taskId, "open");
          }
        );

        LinearLayout.LayoutParams eachBtn = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        eachBtn.bottomMargin = dp(12);
        doneButton.setLayoutParams(eachBtn);

        LinearLayout.LayoutParams eachBtn2 = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        eachBtn2.bottomMargin = dp(12);
        snoozeButton.setLayoutParams(eachBtn2);

        LinearLayout.LayoutParams eachBtn3 = new LinearLayout.LayoutParams(
          LinearLayout.LayoutParams.MATCH_PARENT,
          LinearLayout.LayoutParams.WRAP_CONTENT
        );
        strugglingButton.setLayoutParams(eachBtn3);

        TextView branding = new TextView(context);
        branding.setText("Showd.");
        branding.setTextColor(Color.parseColor("#1AFFFFFF"));
        branding.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        branding.setTypeface(branding.getTypeface(), Typeface.BOLD);
        FrameLayout.LayoutParams brandParams = new FrameLayout.LayoutParams(
          FrameLayout.LayoutParams.WRAP_CONTENT,
          FrameLayout.LayoutParams.WRAP_CONTENT,
          Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL
        );
        brandParams.bottomMargin = dp(44);
        branding.setLayoutParams(brandParams);

        buttons.addView(doneButton);
        buttons.addView(snoozeButton);
        buttons.addView(strugglingButton);

        content.addView(categoryIcon);
        content.addView(pulseCircle);
        content.addView(titleView);
        content.addView(bodyView);
        if (descriptionView != null) {
          content.addView(descriptionView);
        }
        content.addView(buttons);

        root.addView(content);
        root.addView(branding);

        int overlayType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
          ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
          : WindowManager.LayoutParams.TYPE_PHONE;

        WindowManager.LayoutParams params = new WindowManager.LayoutParams(
          WindowManager.LayoutParams.MATCH_PARENT,
          WindowManager.LayoutParams.MATCH_PARENT,
          overlayType,
          WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
            | WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            | WindowManager.LayoutParams.FLAG_FULLSCREEN,
          PixelFormat.TRANSLUCENT
        );
        params.gravity = Gravity.TOP | Gravity.START;

        windowManager.addView(root, params);
        overlayView = root;
        promise.resolve(true);
      } catch (Throwable error) {
        promise.resolve(false);
      }
    });
  }

  @ReactMethod
  public void hideReminderOverlay(Promise promise) {
    UiThreadUtil.runOnUiThread(() -> {
      removeOverlayInternal();
      promise.resolve(true);
    });
  }

  @ReactMethod
  public void consumePendingOverlayAction(Promise promise) {
    try {
      SharedPreferences prefs = getReactApplicationContext()
        .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
      String action = prefs.getString(KEY_PENDING_ACTION, null);
      String taskId = prefs.getString(KEY_PENDING_TASK_ID, null);

      if (action == null || taskId == null) {
        promise.resolve(null);
        return;
      }

      clearPendingAction();
      WritableMap map = Arguments.createMap();
      map.putString("action", action);
      map.putString("taskId", taskId);
      promise.resolve(map);
    } catch (Throwable error) {
      promise.resolve(null);
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
      'android.permission.SYSTEM_ALERT_WINDOW',
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
  config = withNotifeeDependencyResolution(config);
  return config;
};
