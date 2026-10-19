const copy = value => JSON.parse(JSON.stringify(value));
const validKey = key => { if (typeof key !== 'string' || !key.trim()) throw new TypeError('Memory entry key must be a nonempty string'); };

/** Create JSON task memory with optional localStorage-compatible persistence.
 * Every write persists before changing the in-memory snapshot. Instances are single-writer;
 * reload explicitly to observe another instance's updates. Never store credentials here.
 * @param {{storage?:{getItem:Function,setItem:Function,removeItem?:Function},key?:string}} options
 * @returns {{get:Function,set:Function,delete:Function,list:Function,snapshot:Function,reload:Function,clear:Function}}
 */
export function createMemory({ storage, key = 'done-means-done:memory' } = {}) {
  validKey(key);
  if (storage && (typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function')) throw new TypeError('storage must implement getItem and setItem');
  let entries = Object.create(null);
  const reload = () => {
    const raw = storage?.getItem(key);
    if (raw == null) { entries = Object.create(null); return; }
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || !parsed.entries || typeof parsed.entries !== 'object' || Array.isArray(parsed.entries)) throw new Error('Unsupported or corrupt memory');
    entries = Object.assign(Object.create(null), parsed.entries);
  };
  const commit = next => {
    const serialized = JSON.stringify({ version: 1, entries: next });
    storage?.setItem(key, serialized);
    entries = Object.assign(Object.create(null), JSON.parse(serialized).entries);
  };
  reload();
  return Object.freeze({
    /** Read a cloned entry; missing entries return undefined. */
    get(name) { validKey(name); return Object.hasOwn(entries, name) ? copy(entries[name]) : undefined; },
    /** Save a JSON value. Undefined/functions/symbols and nonfinite numbers are rejected. */
    set(name, value) {
      validKey(name);
      const seen = new Set();
      const validate = item => {
        if (item === null || typeof item === 'string' || typeof item === 'boolean') return;
        if (typeof item === 'number' && Number.isFinite(item)) return;
        if (typeof item !== 'object' || seen.has(item) || (!Array.isArray(item) && Object.getPrototypeOf(item) !== Object.prototype && Object.getPrototypeOf(item) !== null)) throw new TypeError('Memory values must be acyclic JSON data');
        seen.add(item); Object.values(item).forEach(validate); seen.delete(item);
      };
      validate(value);
      const next = Object.assign(Object.create(null), entries); next[name] = copy(value); commit(next);
      return copy(entries[name]);
    },
    /** Delete one entry and return whether it existed. */
    delete(name) { validKey(name); const exists = Object.hasOwn(entries, name); const next = Object.assign(Object.create(null), entries); delete next[name]; commit(next); return exists; },
    /** List entry keys in sorted order. */
    list: () => Object.keys(entries).sort(),
    /** Return a detached JSON snapshot. */
    snapshot: () => copy(entries),
    /** Reload persisted state, throwing for malformed or unsupported data. */
    reload,
    /** Remove all entries, preserving a valid versioned store. */
    clear: () => commit(Object.create(null)),
  });
}
