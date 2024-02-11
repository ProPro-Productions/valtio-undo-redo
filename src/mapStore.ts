import proxyWithPersist, { PersistStrategy } from "valtio-persist";
import throttle from "./throttel";
import { storage } from "./storage";
import { createStore } from "idb-keyval";
import { snapshot, subscribe } from "valtio";
import { INTERNAL_Snapshot, unstable_buildProxyFunction } from "valtio/vanilla";
import { devtools } from "valtio/utils";

const currentStackAndAreaStateStore = createStore(
  "currentStackAndAreaStateDB",
  "currentStackAndAreaStateStore",
);

let refSet: WeakSet<object> | undefined;
const isObject = (value: unknown): value is object =>
  !!value && typeof value === "object";

export const deepClone = <T>(value: T): T => {
  if (!refSet) {
    refSet = unstable_buildProxyFunction()[2];
  }
  if (!isObject(value) || refSet.has(value)) {
    return value;
  }
  const baseObject: T = Array.isArray(value)
    ? []
    : Object.create(Object.getPrototypeOf(value));
  Reflect.ownKeys(value).forEach((key) => {
    baseObject[key as keyof T] = deepClone(value[key as keyof T]);
  });
  return baseObject;
};

export type HistoryNode<T> = {
  /**
   * The snapshot being tracked
   */
  snapshot: INTERNAL_Snapshot<T>;
  /**
   * The date when the node was created
   */
  createdAt: Date;
  /**
   * The date when the node was updated. Will be undefined if
   * the node was never updated.
   */
  updatedAt?: Date;
};

export type History<T> = {
  /**
   * field for holding sandbox changes; used to avoid infinite loops
   */
  wip?: INTERNAL_Snapshot<T>;
  /**
   * the nodes of the history for each change
   */
  nodes: HistoryNode<T>[];
  /**
   * the history index of the current snapshot
   */
  index: number;
};

type valueType = { stacks: string[] };

type dataType = {
  value: valueType;
  history: History<valueType>;
};

export const store = proxyWithPersist<{
  [mapId: string]: dataType;
}>({
  name: "maps",
  initialState: {},
  persistStrategies: PersistStrategy.MultiFile,
  version: 0,
  migrations: {},
  onBeforeBulkWrite: throttle((bulkWrite) => bulkWrite(), 1000),

  getStorage: () => storage(currentStackAndAreaStateStore),
});

const saveHistory = (proxyObject: dataType) => {
  proxyObject.history.nodes.splice(proxyObject.history.index + 1);
  proxyObject.history.nodes.push({
    createdAt: new Date(),
    snapshot: snapshot(proxyObject).value,
  });
  ++proxyObject.history.index;
};

const shouldSaveHistory = (
  ops: Parameters<Parameters<typeof subscribe>[1]>[0],
  proxyObject: dataType,
) => {
  return ops.every(
    (op) =>
      op[1][1] === "value" &&
      (op[0] !== "set" || op[2] !== proxyObject.history.wip),
  );
};

export const map = (firstKey: string) => {
  return store[firstKey];
};

subscribe(store, (ops) => {
  console.log(ops);
  const firstKey = Object.values(ops[0][1])[0].toString();
  if (shouldSaveHistory(ops, map(firstKey))) {
    saveHistory(map(firstKey));
  }
});

const canUndo = (proxyObject: dataType) => proxyObject.history.index > 0;

const canRedo = (proxyObject: dataType) =>
  proxyObject.history.index < proxyObject.history.nodes.length - 1;

export const undo = (proxyObject: dataType) => {
  if (canUndo(proxyObject)) {
    proxyObject.history.wip = deepClone(
      proxyObject.history.nodes[--proxyObject.history.index]?.snapshot,
    );
    proxyObject.value = proxyObject.history.wip;
  }
};

export const redo = (proxyObject: dataType) => {
  if (canRedo(proxyObject)) {
    proxyObject.history.wip = deepClone(
      proxyObject.history.nodes[++proxyObject.history.index]?.snapshot,
    );
    proxyObject.value = proxyObject.history.wip;
  }
};

devtools(store, {
  name: "csaass",
  enabled: true,
  trace: true,
});
