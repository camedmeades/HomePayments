import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

/**
 * On Windows this resolves to %APPDATA%\billcal\
 * On macOS this resolves to ~/Library/Application Support/billcal/
 */
function userDataDir(): string {
  const dir = app.getPath('userData');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const paths = {
  userData: userDataDir,
  dbFile: (): string => path.join(userDataDir(), 'billcal.db'),
  logsDir: (): string => {
    const dir = path.join(userDataDir(), 'logs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  },
  backupsDir: (): string => {
    const dir = path.join(userDataDir(), 'backups');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
  },
};
