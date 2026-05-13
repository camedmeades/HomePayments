import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

function userDataDir(): string {
  const dir = process.platform === 'win32'
    ? 'C:\\dev\\HomePayments'
    : app.getPath('userData');
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
