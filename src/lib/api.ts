/**
 * Thin typed wrapper around window.api. Renderer code should call functions
 * here rather than touching window.api directly.
 */

export const api = {
  health: () => window.api.health(),
  entities: window.api.entities,
  categories: window.api.categories,
  suppliers: window.api.suppliers,
};
