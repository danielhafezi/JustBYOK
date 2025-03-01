/**
 * Storage utility for handling localStorage with prefix management and serialization
 * This provides a consistent way to interact with localStorage across the application
 */

const APP_PREFIX = 'APP_';

/**
 * Get a value from localStorage
 * @param key The key to retrieve (without prefix)
 * @param defaultValue The default value to return if key doesn't exist
 * @returns The parsed value or defaultValue if not found
 */
export const storage = {
  get: <T>(key: string, defaultValue?: T): T => {
    const rawValue = localStorage.getItem(`${APP_PREFIX}${key}`);
    if (!rawValue) return defaultValue as T;
    try {
      return JSON.parse(rawValue, (key, value) => {
        // Handle date deserialization
        if (key.endsWith('At') && typeof value === 'string') {
          return new Date(value);
        }
        return value;
      }) as T;
    } catch (e) {
      console.error(`Error parsing ${key}`, e);
      return defaultValue as T;
    }
  },

  /**
   * Store a value in localStorage
   * @param key The key to store (without prefix)
   * @param value The value to store
   */
  set: (key: string, value: any): void => {
    localStorage.setItem(`${APP_PREFIX}${key}`, JSON.stringify(value));
  },

  /**
   * Remove a value from localStorage
   * @param key The key to remove (without prefix)
   */
  remove: (key: string): void => {
    localStorage.removeItem(`${APP_PREFIX}${key}`);
  },

  /**
   * Get all keys in localStorage that start with the app prefix
   * @returns Array of keys without the prefix
   */
  getKeys: (): string[] => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(APP_PREFIX)) {
        keys.push(key.replace(APP_PREFIX, ''));
      }
    }
    return keys;
  },

  /**
   * Clear all app-related values from localStorage
   */
  clearAll: (): void => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(APP_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
};

export default storage; 