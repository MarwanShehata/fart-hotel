class StorageManager {
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (_error) {
      // Silently ignore errors
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key)
      return item ? (JSON.parse(item) as T) : null
    } catch (_error) {
      // Silently ignore errors
      return null
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch (_error) {
      // Silently ignore errors
    }
  }
}

export { StorageManager }
