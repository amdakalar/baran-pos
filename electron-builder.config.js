const path = require('path');
const { rcedit } = require('rcedit');

/**
 * @type {import('electron-builder').Configuration}
 */
module.exports = {
  appId: 'com.baran.pos',
  productName: 'Baran POS',
  copyright: 'Copyright © 2026 Baran Stationery',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'dist-electron/**/*',
    'build/icon.ico',
    'build/icon.png',
    'assets/**/*',
    '!node_modules/**/*',
  ],
  extraMetadata: {
    main: 'dist-electron/main.js',
    type: 'commonjs',
  },
  asar: true,
  win: {
    icon: 'build/icon.ico',
    signAndEditExecutable: false,
    target: [
      {
        target: 'nsis',
        arch: ['x64'],
      },
    ],
    artifactName: '${productName}-Setup-${version}.${ext}',
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Baran POS',
    installerIcon: 'build/icon.ico',
    uninstallerIcon: 'build/icon.ico',
    installerHeaderIcon: 'build/icon.ico',
    installerLanguages: ['en_US'],
    language: '1033',
  },
  publish: {
    provider: 'github',
    owner: 'amdakalar',
    repo: 'baran-pos',
    releaseType: 'release',
  },
  afterPack: async (context) => {
    if (context.electronPlatformName === 'win32') {
      const exeName = `${context.packager.appInfo.productFilename}.exe`;
      const exePath = path.join(context.appOutDir, exeName);
      const iconPath = path.resolve(__dirname, 'build/icon.ico');
      console.log(`[afterPack] Embedding custom icon into: ${exePath}`);
      try {
        await rcedit(exePath, {
          icon: iconPath,
          'version-string': {
            CompanyName: 'Baran POS',
            FileDescription: 'Baran POS - Point of Sale System',
            ProductName: 'Baran POS',
            LegalCopyright: 'Copyright © 2026 Baran Stationery',
            OriginalFilename: 'Baran POS.exe',
          },
        });
        console.log('[afterPack] Successfully embedded custom icon & metadata into executable!');
      } catch (err) {
        console.error('[afterPack] Error running rcedit:', err);
      }
    }
  },
};
