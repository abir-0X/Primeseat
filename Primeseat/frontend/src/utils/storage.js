/**
 * Safe LocalStorage Interceptor Wrapper
 * 
 * Catches security/access exceptions (e.g. Brave Shield cookie block, private/incognito contexts)
 * and gracefully falls back to an in-memory object store to prevent app crashes.
 */
let isStorageSupported = false;
try {
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isStorageSupported = true;
} catch (e) {
    isStorageSupported = false;
}

const memoryStore = {};

export const safeStorage = {
    getItem: (key) => {
        if (isStorageSupported) {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                return memoryStore[key] || null;
            }
        }
        return memoryStore[key] || null;
    },
    setItem: (key, value) => {
        if (isStorageSupported) {
            try {
                window.localStorage.setItem(key, value);
                return;
            } catch (e) {
                // fall through
            }
        }
        memoryStore[key] = String(value);
    },
    removeItem: (key) => {
        if (isStorageSupported) {
            try {
                window.localStorage.removeItem(key);
                return;
            } catch (e) {
                // fall through
            }
        }
        delete memoryStore[key];
    }
};
