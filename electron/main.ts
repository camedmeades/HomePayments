import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initLogger, log } from './lib/logger.js';
import { initEncryption } from './lib/crypto.js';
import { initDb, closeDb } from './db/index.js';
import { registerIpcHandlers } from './ipc.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#fafaf9',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  mainWindow.on('ready-to-show', () => mainWindow?.show());

  // External links open in the user's default browser, not a new Electron window.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  // In dev, electron-vite serves the renderer; in production it's a packaged file.
  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

void app.whenReady().then(async () => {
  initLogger();
  log.info(`Billcal v${app.getVersion()} starting`);
  log.info(`Electron ${process.versions.electron}, Node ${process.versions.node}`);

  await initEncryption();
  const { schemaVersion } = initDb();
  registerIpcHandlers(schemaVersion);

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) await createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  closeDb();
});

// Hardening: block all permission requests by default; we'll allow specifics
// later if/when we add features that legitimately need them (e.g. notifications).
app.on('web-contents-created', (_e, contents) => {
  contents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
});
