import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '@shared/ipc-contract.js';
import type { BillcalApi } from '@shared/ipc-contract.js';

const api: BillcalApi = {
  health: () => ipcRenderer.invoke(IPC.health),
  entities: {
    list: () => ipcRenderer.invoke(IPC.entities.list),
    create: (input) => ipcRenderer.invoke(IPC.entities.create, input),
    update: (input) => ipcRenderer.invoke(IPC.entities.update, input),
    archive: (id) => ipcRenderer.invoke(IPC.entities.archive, id),
    restore: (id) => ipcRenderer.invoke(IPC.entities.restore, id),
  },
  categories: {
    list: () => ipcRenderer.invoke(IPC.categories.list),
    create: (input) => ipcRenderer.invoke(IPC.categories.create, input),
    update: (input) => ipcRenderer.invoke(IPC.categories.update, input),
    archive: (id) => ipcRenderer.invoke(IPC.categories.archive, id),
    restore: (id) => ipcRenderer.invoke(IPC.categories.restore, id),
    merge: (input) => ipcRenderer.invoke(IPC.categories.merge, input),
  },
  suppliers: {
    list: () => ipcRenderer.invoke(IPC.suppliers.list),
    create: (input) => ipcRenderer.invoke(IPC.suppliers.create, input),
    update: (input) => ipcRenderer.invoke(IPC.suppliers.update, input),
    archive: (id) => ipcRenderer.invoke(IPC.suppliers.archive, id),
  },
};

contextBridge.exposeInMainWorld('api', api);
