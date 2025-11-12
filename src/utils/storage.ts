const KEY = 'lab_manuals';

export function saveManuals(data: unknown) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function loadManuals<T>(): T | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
