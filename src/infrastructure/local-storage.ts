import type { StorageProvider } from "./storage.js";

export function createLocalStorageProvider(): StorageProvider {
  return {
    getItem(key: string): string | null {
      return localStorage.getItem(key);
    },
    setItem(key: string, value: string): void {
      localStorage.setItem(key, value);
    },
    removeItem(key: string): void {
      localStorage.removeItem(key);
    },
    keys(): readonly string[] {
      const result: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key !== null) {
          result.push(key);
        }
      }
      return result;
    },
  };
}
