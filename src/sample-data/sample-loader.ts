import {Node} from '../view/interfaces';
import {NodeStore} from '../view/node-store';

import {
  accounts,
  capabilities,
  EdgeDescriptor,
  edges,
  features,
  impacts,
  insights,
  tasks,
  TypedSourceTable,
} from './sample-data';

export function loadTablesAndEdges(store: NodeStore) {
  createTable(store, tasks);
  createTable(store, features);
  createTable(store, capabilities);
  createTable(store, impacts);
  createTable(store, insights);
  createTable(store, accounts);
  createEdges(store, edges);
}

function createTable<T extends any[]>(
  store: NodeStore,
  table: TypedSourceTable<T>
) {
  const type = table.id;
  for (const [id, row] of table.rows.entries()) {
    const fields = createFields(table.columns, row);
    store.createNode(type, id, fields);
  }
}

function createFields<T extends any[]>(
  keys: {[K in keyof T]: string},
  values: T
) {
  const result: {[key: string]: any} = {};
  for (const [i, key] of keys.entries()) {
    result[key] = values[i];
  }
  return result;
}

function createEdges(store: NodeStore, edges: EdgeDescriptor[]) {
  for (const edge of edges) {
    createEdge(store, edge);
  }
}

function createEdge(store: NodeStore, edge: EdgeDescriptor) {
  const srcNodes = store.getNodesWithType(edge.srcType);
  const destNodes = store.getNodesWithType(edge.destType);

  // Group destNodes by edge.destColumn
  const index = new Map<string, Node[]>();
  for (const node of destNodes) {
    const key = node.fields[edge.destColumn];
    const group = index.get(key);
    if (group) {
      group.push(node);
    } else {
      index.set(key, [node]);
    }
  }

  for (const src of srcNodes) {
    let keys = src.fields[edge.srcColumn];
    if (!(keys instanceof Array)) {
      keys = [keys];
    }

    for (const key of keys) {
      const group = index.get(key);
      if (group) {
        for (const dest of group) {
          const type = edge.srcType + '=>' + edge.destType;
          store.createEdge(type, src, dest);
        }
      }
    }
  }
}
