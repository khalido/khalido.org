/** Simple localStorage key-value store for API keys. Keys never leave the browser. */

const STORE_KEY = "khalido-tool-keys";

export function getKeys(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function getKey(name: string): string {
  return getKeys()[name] || "";
}

export function setKey(name: string, value: string) {
  const keys = getKeys();
  if (value) {
    keys[name] = value;
  } else {
    delete keys[name];
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(keys));
}

export function clearKeys() {
  localStorage.removeItem(STORE_KEY);
}
