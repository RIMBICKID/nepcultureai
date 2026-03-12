/**
 * NepCulture — main.js
 * Central database wrapper, toast system, and shared utilities.
 * This file MUST be loaded before any page-specific JS.
 *
 * To swap localStorage for a real backend, replace the `db.*` methods
 * with fetch() calls as documented in README_DEMO.md.
 */

// ─────────────────────────────────────────────────────────────────────────────
// db — client-side localStorage wrapper (pseudo-database)
//
// Storage keys used across the app:
//   nepCulture_tracks     → generated music tracks
//   nepCulture_literature → library items saved to archive
// ─────────────────────────────────────────────────────────────────────────────
const db = {

  /**
   * Read all items for a key.
   * Returns [] on missing key or corrupt data.
   * BACKEND SWAP: replace with → fetch(`/api/${key}`)
   */
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      localStorage.removeItem(key);
      return [];
    }
  },

  /**
   * Overwrite the entire array for a key.
   * BACKEND SWAP: replace with → fetch(`/api/${key}`, { method: 'PUT', body: JSON.stringify(value) })
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('[db.set] Storage error:', e);
    }
  },

  /**
   * Prepend a new item to the front of the array (newest-first).
   * BACKEND SWAP: replace with → fetch(`/api/${key}`, { method: 'POST', body: JSON.stringify(item) })
   */
  add(key, item) {
    const list = this.get(key);
    list.unshift(item);
    this.set(key, list);
  },

  /**
   * Remove item by id.
   * BACKEND SWAP: replace with → fetch(`/api/${key}/${id}`, { method: 'DELETE' })
   */
  remove(key, id) {
    const list = this.get(key).filter(i => i.id !== id);
    this.set(key, list);
  },

  /**
   * Merge updater object into an item with matching id.
   * BACKEND SWAP: replace with → fetch(`/api/${key}/${id}`, { method: 'PATCH', body: JSON.stringify(updater) })
   */
  update(key, id, updater) {
    const list = this.get(key).map(i => i.id === id ? { ...i, ...updater } : i);
    this.set(key, list);
  },

  /**
   * Find a single item by id.
   * BACKEND SWAP: replace with → fetch(`/api/${key}/${id}`)
   */
  find(key, id) {
    return this.get(key).find(i => i.id === id) || null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Toast notification system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show a non-blocking toast notification.
 * @param {string} message - Human-readable message
 * @param {'gold'|'crimson'|'purple'} type - Color variant
 */
function showToast(message, type = 'gold') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const colorMap = {
    gold: 'var(--gold)',
    crimson: 'var(--crimson)',
    purple: 'var(--accent-1)'
  };

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.borderLeftColor = colorMap[type] || colorMap.gold;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `<strong>✨</strong> ${message}`;

  container.appendChild(toast);
  // Auto-remove after 3 s
  setTimeout(() => toast.remove(), 3000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Debounce utility
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a debounced version of fn (fires after `wait` ms of silence).
 * Used for search inputs to avoid thrashing on every keystroke.
 */
function debounce(fn, wait = 150) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export helpers (used by both Studio and Favorites)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Trigger a browser file-download from a data URL or object URL.
 */
function triggerDownload(filename, url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Download any JS object/array as a formatted JSON file.
 */
function exportJSON(data, filename = 'export.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(filename, URL.createObjectURL(blob));
}

// ─────────────────────────────────────────────────────────────────────────────
// Startup
// ─────────────────────────────────────────────────────────────────────────────
console.info('[NepCulture] main.js loaded — db ready.');
