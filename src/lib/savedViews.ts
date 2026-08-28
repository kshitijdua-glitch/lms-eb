/**
 * Saved views — named filter sets persisted per user + module so reports and
 * exports can be reproduced consistently.
 */

export type ViewFilters = Record<string, string>;

export interface SavedView {
  id: string;
  name: string;
  filters: ViewFilters;
  createdAt: string;
}

const KEY = "lms.savedViews.v1";

type Store = Record<string, SavedView[]>;

function readStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable — views simply do not persist */
  }
}

const scopeKey = (module: string, owner: string) => `${owner}::${module}`;

export function listSavedViews(module: string, owner: string): SavedView[] {
  return readStore()[scopeKey(module, owner)] ?? [];
}

export function saveView(module: string, owner: string, name: string, filters: ViewFilters): SavedView {
  const store = readStore();
  const key = scopeKey(module, owner);
  const existing = store[key] ?? [];
  const view: SavedView = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    filters,
    createdAt: new Date().toISOString(),
  };
  store[key] = [...existing.filter(v => v.name.toLowerCase() !== view.name.toLowerCase()), view];
  writeStore(store);
  return view;
}

export function deleteView(module: string, owner: string, id: string) {
  const store = readStore();
  const key = scopeKey(module, owner);
  store[key] = (store[key] ?? []).filter(v => v.id !== id);
  writeStore(store);
}
