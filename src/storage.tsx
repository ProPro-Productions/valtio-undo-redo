import { ProxyPersistStorageEngine } from "valtio-persist";
import { del, get, set, keys, UseStore } from "idb-keyval";

export async function storage(
  db: UseStore,
): Promise<ProxyPersistStorageEngine> {
  return {
    getItem: (name: string) => {
      const g = get(name, db);
      return g == undefined ? null : g;
    },
    setItem: (name, value) => {
      return set(name, value, db);
    },
    removeItem: (name) => {
      del(name, db);
    },
    getAllKeys: () => {
      return keys(db);
    },
  };
}
