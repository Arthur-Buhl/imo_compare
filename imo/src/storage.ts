import type { Listing } from './types';

const KEY = 'listings';

export async function getAll(): Promise<Listing[]> {
  const res = await chrome.storage.local.get(KEY);
  return (res[KEY] as Listing[] | undefined) ?? [];
}

export async function save(listing: Listing): Promise<void> {
  const all = await getAll();
  const next = all.filter((l) => l.id !== listing.id);
  next.push({ ...listing, savedAt: Date.now() });
  await chrome.storage.local.set({ [KEY]: next });
}

export async function remove(id: string): Promise<void> {
  const all = await getAll();
  await chrome.storage.local.set({ [KEY]: all.filter((l) => l.id !== id) });
}

/** Nombre de colocataires (reglage global, partage panneau + comparaison). */
export async function getRoommates(): Promise<number> {
  const res = await chrome.storage.local.get('roommates');
  return Math.max(1, Number(res.roommates) || 1);
}

export async function setRoommates(n: number): Promise<void> {
  await chrome.storage.local.set({ roommates: Math.max(1, Math.min(20, Math.round(n))) });
}

export async function has(id: string): Promise<boolean> {
  return (await getAll()).some((l) => l.id === id);
}
