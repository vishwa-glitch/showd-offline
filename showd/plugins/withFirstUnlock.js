const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

const readFileIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf8')
}

const writeFileIfChanged = (filePath, content) => {
  const previous = readFileIfExists(filePath)
  if (previous === content) return
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, content)
}

// ---------------------------------------------------------------------------
// Kotlin source generators
// ---------------------------------------------------------------------------

const receiverSource = (pkg) => `package ${pkg}.firstunlock

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class UserPresentReceiver : BroadcastReceiver() {

    companion object {
        const val PREFS_NAME = "showd_first_unlock"
        const val KEY_TASKS = "tasks"
        const val CHANNEL_ID = "showd-reminder-v3"
        const val EXTRA_TASK_ID = "showd_first_unlock_task_id"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != Intent.ACTION_USER_PRESENT) return

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val tasksJson = prefs.getString(KEY_TASKS, "[]") ?: "[]"
        val tasksArray = try { JSONArray(tasksJson) } catch (e: Exception) { return }

        val now = Calendar.getInstance()
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(now.time)
        val currentMinutes = now.get(Calendar.HOUR_OF_DAY) * 60 + now.get(Calendar.MINUTE)

        val updated = JSONArray()
        for (i in 0 until tasksArray.length()) {
            val t = tasksArray.getJSONObject(i)
            try {
                val startMin = parseHMtoMinutes(t.getString("startTime"))
                val endMin = parseHMtoMinutes(t.getString("endTime"))
                val lastFired = t.optString("lastFiredDate", "")
                val inWindow = currentMinutes in startMin..endMin
                val notFiredToday = lastFired != today

                if (inWindow && notFiredToday) {
                    showFullScreenNotification(context, t.getString("taskId"), t.getString("name"))
                    t.put("lastFiredDate", today)
                }
            } catch (e: Exception) {
                // skip malformed entry, keep rest
            }
            updated.put(t)
        }

        prefs.edit().putString(KEY_TASKS, updated.toString()).apply()
    }

    private fun parseHMtoMinutes(hm: String): Int {
        val parts = hm.split(":")
        return parts[0].toInt() * 60 + parts[1].toInt()
    }

    private fun showFullScreenNotification(context: Context, taskId: String, taskName: String) {
        ensureChannel(context)
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString("pending_task_id", taskId).apply()

        val launchIntent = context.packageManager
            .getLaunchIntentForPackage(context.packageName)
            ?.apply {
                putExtra(EXTRA_TASK_ID, taskId)
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }

        val piFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        val pendingIntent = PendingIntent.getActivity(context, taskId.hashCode(), launchIntent, piFlags)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(context.applicationInfo.icon)
            .setContentTitle(taskName)
            .setContentText("Time for $taskName")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setFullScreenIntent(pendingIntent, true)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(taskId.hashCode(), notification)
    }

    private fun ensureChannel(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(CHANNEL_ID, "Reminders", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "Showd task reminders"
            enableVibration(true)
            vibrationPattern = longArrayOf(100, 400, 200, 400, 200, 400)
            setBypassDnd(true)
        }
        manager.createNotificationChannel(channel)
    }
}
`

const moduleSource = (pkg) => `package ${pkg}.firstunlock

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import org.json.JSONArray
import org.json.JSONObject
import java.util.Locale

class FirstUnlockModule(reactContext: ReactApplicationContext)
    : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "FirstUnlockModule"

    @ReactMethod
    fun syncTasks(tasks: ReadableArray, promise: Promise) {
        try {
            val context = reactApplicationContext
            val arr = JSONArray()
            for (i in 0 until tasks.size()) {
                val map = tasks.getMap(i) ?: continue
                val obj = JSONObject().apply {
                    put("taskId", map.getString("taskId"))
                    put("name", map.getString("name"))
                    put("startTime", map.getString("startTime"))
                    put("endTime", map.getString("endTime"))
                    put("lastFiredDate", map.getString("lastFiredDate") ?: "")
                }
                arr.put(obj)
            }
            val prefs = context.getSharedPreferences(UserPresentReceiver.PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putString(UserPresentReceiver.KEY_TASKS, arr.toString()).apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SYNC_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun consumePendingTaskId(promise: Promise) {
        try {
            val context = reactApplicationContext
            val prefs = context.getSharedPreferences(UserPresentReceiver.PREFS_NAME, Context.MODE_PRIVATE)
            val taskId = prefs.getString("pending_task_id", null)
            prefs.edit().remove("pending_task_id").apply()
            promise.resolve(taskId)
        } catch (e: Exception) {
            promise.reject("CONSUME_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun getLaunchTaskId(promise: Promise) {
        try {
            val activity = getCurrentActivity() ?: return promise.resolve(null)
            val taskId = activity.intent?.getStringExtra(UserPresentReceiver.EXTRA_TASK_ID)
            promise.resolve(taskId)
        } catch (e: Exception) {
            promise.reject("LAUNCH_ID_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun openAutoStartSettings(promise: Promise) {
        try {
            val context = reactApplicationContext
            val pm = context.packageManager
            val brand = Build.BRAND.lowercase(Locale.ROOT)

            @Suppress("DEPRECATION")
            fun isInstalled(pkgName: String): Boolean = try {
                pm.getApplicationInfo(pkgName, 0)
                true
            } catch (e: PackageManager.NameNotFoundException) { false }

            fun tryIntent(intent: Intent): Boolean {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                val resolved = pm.queryIntentActivities(intent, PackageManager.MATCH_DEFAULT_ONLY)
                return if (resolved.isNotEmpty()) {
                    context.startActivity(intent)
                    true
                } else false
            }

            fun component(pkgName: String, cls: String) = Intent().setClassName(pkgName, cls)

            val opened = when (brand) {
                "xiaomi", "poco", "redmi" -> {
                    val p = "com.miui.securitycenter"
                    isInstalled(p) && tryIntent(component(p, "com.miui.permcenter.autostart.AutoStartManagementActivity"))
                }
                "letv" -> {
                    val p = "com.letv.android.letvsafe"
                    isInstalled(p) && tryIntent(component(p, "com.letv.android.letvsafe.AutobootManageActivity"))
                }
                "asus" -> {
                    val p = "com.asus.mobilemanager"
                    isInstalled(p) && (
                        tryIntent(component(p, "com.asus.mobilemanager.powersaver.PowerSaverSettings")) ||
                        tryIntent(component(p, "com.asus.mobilemanager.autostart.AutoStartActivity"))
                    )
                }
                "honor" -> {
                    val p = "com.huawei.systemmanager"
                    isInstalled(p) && tryIntent(component(p, "com.huawei.systemmanager.optimize.process.ProtectActivity"))
                }
                "huawei" -> {
                    val p = "com.huawei.systemmanager"
                    isInstalled(p) && (
                        tryIntent(component(p, "com.huawei.systemmanager.startupmgr.ui.StartupNormalAppListActivity")) ||
                        tryIntent(component(p, "com.huawei.systemmanager.optimize.process.ProtectActivity"))
                    )
                }
                "oppo", "realme" -> {
                    (isInstalled("com.coloros.safecenter") &&
                        tryIntent(component("com.coloros.safecenter", "com.coloros.safecenter.permission.startup.StartupAppListActivity"))) ||
                    (isInstalled("com.oppo.safe") &&
                        tryIntent(component("com.oppo.safe", "com.oppo.safe.permission.startup.StartupAppListActivity"))) ||
                    (isInstalled("com.coloros.safecenter") &&
                        tryIntent(component("com.coloros.safecenter", "com.coloros.safecenter.startupapp.StartupAppListActivity")))
                }
                "vivo" -> {
                    (isInstalled("com.iqoo.secure") &&
                        tryIntent(component("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.AddWhiteListActivity"))) ||
                    (isInstalled("com.vivo.permissionmanager") &&
                        tryIntent(component("com.vivo.permissionmanager", "com.vivo.permissionmanager.activity.BgStartUpManagerActivity"))) ||
                    (isInstalled("com.iqoo.secure") &&
                        tryIntent(component("com.iqoo.secure", "com.iqoo.secure.ui.phoneoptimize.BgStartUpManager")))
                }
                "nokia" -> {
                    val p = "com.evenwell.powersaving.g3"
                    isInstalled(p) && tryIntent(component(p, "com.evenwell.powersaving.g3.exception.PowerSaverExceptionActivity"))
                }
                "samsung" -> {
                    val p = "com.samsung.android.lool"
                    isInstalled(p) && (
                        tryIntent(component(p, "com.samsung.android.sm.ui.battery.BatteryActivity")) ||
                        tryIntent(component(p, "com.samsung.android.sm.battery.ui.usage.CheckableAppListActivity")) ||
                        tryIntent(component(p, "com.samsung.android.sm.battery.ui.BatteryActivity"))
                    )
                }
                "oneplus" -> {
                    val p = "com.oneplus.security"
                    (isInstalled(p) && tryIntent(component(p, "com.oneplus.security.chainlaunch.view.ChainLaunchAppListActivity"))) ||
                    tryIntent(Intent("com.android.settings.action.BACKGROUND_OPTIMIZE"))
                }
                else -> false
            }

            if (!opened) {
                val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:\${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallback)
                promise.resolve(false)
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            try {
                val context = reactApplicationContext
                val fallback = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:\${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallback)
            } catch (ignored: Exception) { }
            promise.resolve(false)
        }
    }
}
`

const packageSource = (pkg) => `package ${pkg}.firstunlock

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class FirstUnlockPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(FirstUnlockModule(reactContext))

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
        emptyList()
}
`

// ---------------------------------------------------------------------------
// MainApplication patching — Kotlin + Java fallback (mirrors withNotifee.js)
// ---------------------------------------------------------------------------

const patchMainApplicationKotlin = (filePath, androidPackage) => {
  const original = readFileIfExists(filePath)
  if (!original) return
  let content = original

  // 1. Import
  const importLine = `import ${androidPackage}.firstunlock.FirstUnlockPackage`
  if (!content.includes(importLine)) {
    content = content.replace(/(import\s+[^\n]+\n)/, `$1${importLine}\n`)
  }

  // 2. Register in getPackages()
  if (!content.includes('FirstUnlockPackage()')) {
    if (content.includes('ShowdFullScreenIntentPackage()')) {
      // withNotifee already ran — chain alongside it inside the same apply block
      content = content.replace(
        'add(ShowdFullScreenIntentPackage())',
        'add(ShowdFullScreenIntentPackage()); add(FirstUnlockPackage())',
      )
    } else if (content.includes('PackageList(this).packages')) {
      // withNotifee hasn't run yet — inject our own apply block
      content = content.replace(
        'PackageList(this).packages',
        'PackageList(this).packages.apply { add(FirstUnlockPackage()) }',
      )
    }
  }

  if (content !== original) fs.writeFileSync(filePath, content)
}

const patchMainApplicationJava = (filePath, androidPackage) => {
  const original = readFileIfExists(filePath)
  if (!original) return
  let content = original

  const importLine = `import ${androidPackage}.firstunlock.FirstUnlockPackage;`
  if (!content.includes(importLine)) {
    content = content.replace(/(import\s+[^\n]+;\n)/, `$1${importLine}\n`)
  }

  if (!content.includes('new FirstUnlockPackage()')) {
    if (content.includes('new ShowdFullScreenIntentPackage()')) {
      content = content.replace(
        'packages.add(new ShowdFullScreenIntentPackage());',
        'packages.add(new ShowdFullScreenIntentPackage());\n      packages.add(new FirstUnlockPackage());',
      )
    } else if (content.includes('new PackageList(this).getPackages()')) {
      content = content.replace(
        'List<ReactPackage> packages = new PackageList(this).getPackages();',
        'List<ReactPackage> packages = new PackageList(this).getPackages();\n      packages.add(new FirstUnlockPackage());',
      )
    }
  }

  if (content !== original) fs.writeFileSync(filePath, content)
}

// ---------------------------------------------------------------------------
// Plugin: write Kotlin files + patch MainApplication
// ---------------------------------------------------------------------------

const withFirstUnlockFiles = (config) =>
  withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot
      const androidPackage = modConfig.android?.package || 'com.showd.app'
      const packageDir = androidPackage.split('.').join(path.sep)
      const baseDir = path.join(
        projectRoot,
        'android', 'app', 'src', 'main', 'java',
        packageDir,
      )
      const firstUnlockDir = path.join(baseDir, 'firstunlock')

      writeFileIfChanged(
        path.join(firstUnlockDir, 'UserPresentReceiver.kt'),
        receiverSource(androidPackage),
      )
      writeFileIfChanged(
        path.join(firstUnlockDir, 'FirstUnlockModule.kt'),
        moduleSource(androidPackage),
      )
      writeFileIfChanged(
        path.join(firstUnlockDir, 'FirstUnlockPackage.kt'),
        packageSource(androidPackage),
      )

      patchMainApplicationKotlin(path.join(baseDir, 'MainApplication.kt'), androidPackage)
      patchMainApplicationJava(path.join(baseDir, 'MainApplication.java'), androidPackage)

      return modConfig
    },
  ])

// ---------------------------------------------------------------------------
// Plugin: register BroadcastReceiver in AndroidManifest.xml
// ---------------------------------------------------------------------------

const withFirstUnlockManifest = (config) =>
  withAndroidManifest(config, async (modConfig) => {
    const androidPackage = modConfig.android?.package || 'com.showd.app'
    const application = modConfig.modResults.manifest.application?.[0]
    if (!application) return modConfig

    if (!application.receiver) application.receiver = []

    const RECEIVER_NAME = `${androidPackage}.firstunlock.UserPresentReceiver`
    const alreadyAdded = application.receiver.some(
      (r) => r.$ && r.$['android:name'] === RECEIVER_NAME,
    )

    if (!alreadyAdded) {
      application.receiver.push({
        $: {
          'android:name': RECEIVER_NAME,
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.intent.action.USER_PRESENT' } }],
          },
        ],
      })
    }

    return modConfig
  })

// ---------------------------------------------------------------------------

module.exports = (config) => {
  config = withFirstUnlockFiles(config)
  config = withFirstUnlockManifest(config)
  return config
}
