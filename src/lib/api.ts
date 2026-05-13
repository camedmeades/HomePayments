import type { BillcalApi } from '@shared/ipc-contract.js';

/**
 * Thin typed wrapper around window.api. Renderer code should call functions
 * here rather than touching window.api directly.
 */

export const api = {
  health: () => window.api.health(),
  entities: {
    list: () => window.api.entities.list(),
    create: (input: Parameters<BillcalApi['entities']['create']>[0]) => window.api.entities.create(input),
    update: (input: Parameters<BillcalApi['entities']['update']>[0]) => window.api.entities.update(input),
    archive: (id: string) => window.api.entities.archive(id),
    restore: (id: string) => window.api.entities.restore(id),
  },
  categories: {
    list: () => window.api.categories.list(),
    create: (input: Parameters<BillcalApi['categories']['create']>[0]) => window.api.categories.create(input),
    update: (input: Parameters<BillcalApi['categories']['update']>[0]) => window.api.categories.update(input),
    archive: (id: string) => window.api.categories.archive(id),
    restore: (id: string) => window.api.categories.restore(id),
    merge: (input: Parameters<BillcalApi['categories']['merge']>[0]) => window.api.categories.merge(input),
  },
  suppliers: {
    list: () => window.api.suppliers.list(),
    create: (input: Parameters<BillcalApi['suppliers']['create']>[0]) => window.api.suppliers.create(input),
    update: (input: Parameters<BillcalApi['suppliers']['update']>[0]) => window.api.suppliers.update(input),
    archive: (id: string) => window.api.suppliers.archive(id),
  },
};
