import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import fs from 'fs';
import { initDatabase, closeDatabase } from './database';
import { registerIpcHandlers } from './ipc-handlers';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

const isDev = !app.isPackaged;

if (isDev) {
  app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
}

function getAppIconPath(): string {
  const candidates = [
    path.join(__dirname, '../build/icon.ico'),
    path.join(__dirname, '../build/icon.png'),
    path.join(__dirname, '../assets/icon.png'),
    path.join(__dirname, '../dist/icon.png'),
    path.join(process.cwd(), 'build/icon.ico'),
    path.join(process.cwd(), 'public/icon.png'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, '../build/icon.ico');
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Baran POS',
    icon: getAppIconPath(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      devTools: isDev,
    },
  });

  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          isDev
            ? "default-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' data: https://images.unsplash.com https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' ws://localhost:* http://localhost:*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;"
            : "default-src 'self' 'unsafe-inline'; img-src 'self' data: https://images.unsplash.com; font-src 'self' https://fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
        ],
      },
    });
  });

  // Block opening new windows
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Disable keyboard shortcuts in production
  if (!isDev) {
    win.webContents.on('before-input-event', (_event, input) => {
      // Block DevTools shortcuts
      if (
        (input.control && input.shift && input.key === 'I') ||
        (input.control && input.shift && input.key === 'J') ||
        (input.control && input.key === 'U') ||
        input.key === 'F12'
      ) {
        _event.preventDefault();
      }
    });
  }

  // Load the app with dev server retry
  if (isDev) {
    const loadDev = () => {
      win.loadURL('http://localhost:3000').catch(() => {
        setTimeout(loadDev, 600);
      });
    };
    loadDev();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  win.once('ready-to-show', () => {
    win.show();
    win.maximize();
  });

  return win;
}

function startApp() {
  app.whenReady().then(() => {
    // Initialize encrypted database
    initDatabase();

    // Register IPC handlers
    registerIpcHandlers();

    // Create window
    createWindow();
  });

  app.on('window-all-closed', () => {
    closeDatabase();
    app.quit();
  });

  app.on('before-quit', () => {
    closeDatabase();
  });
}

// Single instance handling
if (!isDev) {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
      }
    });
    startApp();
  }
} else {
  startApp();
}
