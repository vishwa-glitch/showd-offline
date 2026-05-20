const { withDangerousMod } = require('@expo/config-plugins')
const fs = require('fs')
const path = require('path')

// Pin Android Gradle Plugin to a version known to work with RN 0.81 / Expo SDK 54.
//
// Without an explicit version, the versionless:
//   classpath('com.android.tools.build:gradle')
// ...resolves to whatever is newest in Google Maven at build time. EAS build
// environments that include AGP 8.11.0+ break ALL react-native native modules
// with "No variants exist" because AGP 8.11.0 is not yet supported by RN 0.81.
//
// AGP 8.7.3 is the last release that RN 0.81 modules are compatible with,
// and it works fine with Gradle 8.9+.

const AGP_VERSION = '8.7.3'

module.exports = function withBuildConfig(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const buildGradlePath = path.join(
        modConfig.modRequest.projectRoot,
        'android',
        'build.gradle',
      )

      if (!fs.existsSync(buildGradlePath)) return modConfig

      const original = fs.readFileSync(buildGradlePath, 'utf8')

      // Match both quote styles and with or without surrounding whitespace.
      // Handles: classpath('com.android.tools.build:gradle')
      //      and classpath("com.android.tools.build:gradle")
      const patched = original.replace(
        /classpath\((['"])com\.android\.tools\.build:gradle\1\)/,
        `classpath('com.android.tools.build:gradle:${AGP_VERSION}')`,
      )

      if (patched !== original) {
        fs.writeFileSync(buildGradlePath, patched)
      }

      return modConfig
    },
  ])
}
