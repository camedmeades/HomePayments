import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc-contract.js';
import { getHealthReport } from './services/health.js';
import {
  listEntities,
  createEntity,
  updateEntity,
  archiveEntity,
  restoreEntity,
} from './services/entities.js';
import {
  listCategories,
  createCategory,
  updateCategory,
  archiveCategory,
  restoreCategory,
  mergeCategory,
} from './services/categories.js';
import {
  listSuppliers,
  createSupplier,
  updateSupplier,
  archiveSupplier,
} from './services/suppliers.js';
import { log } from './lib/logger.js';

export function registerIpcHandlers(schemaVersion: number): void {
  handle(IPC.health, async () => getHealthReport(schemaVersion));

  handle(IPC.entities.list, async () => listEntities());
  handle(IPC.entities.create, async (_e, input) => createEntity(input));
  handle(IPC.entities.update, async (_e, input) => updateEntity(input));
  handle(IPC.entities.archive, async (_e, id: string) => archiveEntity(id));
  handle(IPC.entities.restore, async (_e, id: string) => restoreEntity(id));

  handle(IPC.categories.list, async () => listCategories());
  handle(IPC.categories.create, async (_e, input) => createCategory(input));
  handle(IPC.categories.update, async (_e, input) => updateCategory(input));
  handle(IPC.categories.archive, async (_e, id: string) => archiveCategory(id));
  handle(IPC.categories.restore, async (_e, id: string) => restoreCategory(id));
  handle(IPC.categories.merge, async (_e, input) => mergeCategory(input));

  handle(IPC.suppliers.list, async () => listSuppliers());
  handle(IPC.suppliers.create, async (_e, input) => createSupplier(input));
  handle(IPC.suppliers.update, async (_e, input) => updateSupplier(input));
  handle(IPC.suppliers.archive, async (_e, id: string) => archiveSupplier(id));

  log.info('IPC handlers registered');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Handler<T> = (event: Electron.IpcMainInvokeEvent, ...args: any[]) => Promise<T>;

function handle<T>(channel: string, fn: Handler<T>): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await fn(event, ...args);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`IPC handler ${channel} failed: ${msg}`);
      // Throwing here causes ipcRenderer.invoke to reject with this message.
      throw new Error(msg);
    }
  });
}
