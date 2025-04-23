import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { WebpackPlugin } from '@electron-forge/plugin-webpack';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

import { mainConfig } from './webpack.main.config';
import { rendererConfig } from './webpack.renderer.config';

const config: ForgeConfig = {
  packagerConfig: {
    name: "Intranet",
    
    executableName: 'intranet',
    icon: './assets/icon.ico',
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({
      setupIcon: './assets/icon.ico',
      iconUrl: 'https://amaranzero.com/themes/custom/amara_theme/assets/images/favicon/favicon.ico',
    }), 
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        icon: './assets/icon.ico'
      }
    }), 
    new MakerDeb({
      options: {
        icon: './assets/icon.ico'
      }
    })
  ],
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new WebpackPlugin({
      mainConfig,
      devContentSecurityPolicy: "default-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob: http: https: ws:;",
      // devContentSecurityPolicy:
      // "default-src 'self' 'unsafe-eval' 'unsafe-inline' static: http: https: ws:",
      // contentSecurityPolicy:
      //   "default-src 'self' 'unsafe-eval' 'unsafe-inline' data: blob: http: https: ws:;",
      renderer: {
        config: rendererConfig,
        entryPoints: [
          {
            html: './src/index.html',
            js: './src/renderer.ts',
            name: 'main_window',
            preload: {
              js: './src/preload.ts',
            },
          },
        ],
      },
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
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'NZero-Labs',
          name: 'intranet-electron-nzero'
        },
        prerelease: true
      }
    }
  ]
};

export default config;
