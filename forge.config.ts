import type { ForgeConfig } from '@electron-forge/shared-types'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerDMG } from '@electron-forge/maker-dmg'
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives'
import { WebpackPlugin } from '@electron-forge/plugin-webpack'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import { FuseV1Options, FuseVersion } from '@electron/fuses'

import { mainConfig } from './webpack.main.config'
import { rendererConfig } from './webpack.renderer.config'

const config: ForgeConfig = {
  packagerConfig: {
    name: 'Intranet',
    executableName: 'intranet',
    icon: './assets/icon',
    asar: true
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      loadingGif: './assets/loading.gif',
      setupIcon: './assets/icon.ico',
      iconUrl: 'https://amaranzero.com/themes/custom/amara_theme/assets/images/favicon/favicon.ico'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        icon: './assets/icon.png'
      }
    }),
    new MakerDeb({
      options: {
        icon: './assets/icon.png'
      }
    }),
    new MakerDMG({
      // format: 'ULFO',
      iconSize: 40,
      icon: './assets/icon.icns',
      background: './assets/logo.png'
    })
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy:
        "default-src 'self' 'unsafe-eval' 'unsafe-inline' static: data: blob: http: https: ws:;",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/renderer/index.html',
            js: './src/main/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/main/preload.ts'
            }
          }
        ]
      }
    }),
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true
    })
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'NZero-Labs',
          name: 'intranet-electron-nzero'
        },
        draft: false, // publish immediately
        prerelease: false, // mark as a full release
        releaseType: 'release' // ensure it's treated as a proper release
      }
    }
  ]
}

export default config
