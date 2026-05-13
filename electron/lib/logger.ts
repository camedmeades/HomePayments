import log from 'electron-log/main';
import path from 'node:path';
import { paths } from './paths.js';

let initialised = false;

export function initLogger(): typeof log {
  if (initialised) return log;

  log.transports.file.resolvePathFn = () => path.join(paths.logsDir(), 'main.log');
  log.transports.file.maxSize = 5 * 1024 * 1024; // 5 MB before rotation
  log.transports.console.level = 'debug';
  log.transports.file.level = 'info';

  log.initialize();
  initialised = true;
  log.info('Logger initialised');
  return log;
}

export { log };
