/**
 * Best-available storage for the web review surface.
 *
 * `localStorage` is not always reachable. A page served in a sandboxed iframe
 * without `allow-same-origin` throws on every access, as do private windows
 * and browsers set to block site data. The artifact viewer this app is
 * reviewed in is exactly such a frame.
 *
 * Throwing there would be bad; silently storing nothing is worse, because the
 * app then looks broken in a way that points at the wrong thing — you register,
 * it works, you reload, and you are back at the password with no explanation.
 *
 * So: use localStorage when it is genuinely usable, and fall back to memory
 * when it is not. Memory does not survive a reload, but it keeps everything
 * working within a session, which is the difference between a demo that runs
 * and one that appears to be broken.
 *
 * Web only. Native uses SQLite and the keychain and never reaches this file.
 */
const memory = new Map<string, string>();

let usable: boolean | null = null;

/**
 * Probe once, by actually writing. Feature-detecting `window.localStorage`
 * is not enough — it is present and throws on use in the cases that matter.
 */
function localStorageUsable(): boolean {
  if (usable !== null) return usable;
  try {
    const probe = '__kennel_probe__';
    globalThis.localStorage.setItem(probe, '1');
    globalThis.localStorage.removeItem(probe);
    usable = true;
  } catch {
    usable = false;
  }
  return usable;
}

export function readWebValue(key: string): string | null {
  if (localStorageUsable()) {
    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      /* fall through to memory */
    }
  }
  return memory.get(key) ?? null;
}

export function writeWebValue(key: string, value: string): void {
  if (localStorageUsable()) {
    try {
      globalThis.localStorage.setItem(key, value);
      return;
    } catch {
      /* fall through to memory */
    }
  }
  memory.set(key, value);
}

export function deleteWebValue(key: string): void {
  if (localStorageUsable()) {
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      /* fall through to memory */
    }
  }
  memory.delete(key);
}

/** True when values will survive a reload. Used only to describe the surface. */
export function webStorageIsDurable(): boolean {
  return localStorageUsable();
}
