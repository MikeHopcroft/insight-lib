import {NodeType} from '../view/interfaces';

export interface TypedSourceTable<T extends any[]> {
  id: string;
  columns: {[K in keyof T]: string};
  rows: T[];
}

export const tasks: TypedSourceTable<
  [number, string, string, string, number, string]
> = {
  id: 'tasks',
  columns: ['id', 'title', 'owner', 'status', 'days', 'feature'],
  rows: [
    [11327, 'Linked list headers', 'danm', 'active', 2, 'Data driven'],
    [11568, 'Tune remote cache', 'mikeh', 'active', 2, 'Cloud deployment'],
    [10934, 'Refactor redux sagas', 'pranjalit', 'complete', 2, 'Data driven'],
    [19918, 'Command inference', 'sarak', 'active', 2, 'Interactive graphs'],
    [12145, 'Dev container', 'juris', 'complete', 2, 'Cloud deployment'],
    [17890, 'GraphQL spike', 'anneg', 'active', 2, 'Interactive graphs'],
    [18843, 'Gremlin integration', 'hsiaoy', 'active', 2, 'Interactive graphs'],
    [10648, 'Update Rancher config', 'danm', 'complete', 2, 'Cloud deployment'],
    [11333, 'Shortest path alg', 'lisat', 'active', 2, 'Interactive graphs'],
    [14127, 'Task comppiler/scheduler', 'robind', 'complete', 2, 'Data driven'],
  ],
};

export const features: TypedSourceTable<[string]> = {
  id: 'features',
  columns: ['title'],
  rows: [['Data driven'], ['Cloud deployment'], ['Interactive graphs']],
};

export const capabilities: TypedSourceTable<[string, string[]]> = {
  id: 'capabilities',
  columns: ['title', 'features'],
  rows: [
    ['DataOps', ['Data driven', 'Cloud deployment']],
    ['Adhoc Analysis', ['Data driven', 'Interactive graphs']],
  ],
};

export const accounts: TypedSourceTable<[string, string, string[]]> = {
  id: 'accounts',
  columns: ['name', 'contact', 'insights'],
  rows: [
    ['AB Corp', 'joeb', ['On Network Security', 'Azure Performance']],
    ['Defco', 'marys', ['On Network Security', 'Scalable Architectures']],
    ['G&H Inc', 'pranab', ['Azure Performance']],
  ],
};

export const insights: TypedSourceTable<[string]> = {
  id: 'insights',
  columns: ['title'],
  rows: [
    ['On Network Security'],
    ['Azure Performance'],
    ['Scalable Architectures'],
  ],
};

export const impacts: TypedSourceTable<[string, string, string]> = {
  id: 'impacts',
  columns: ['title', 'account', 'insight'],
  rows: [
    ['Impact ABC', 'AB Corp', 'On Network Security'],
    ['Impact DEF', 'Defco', 'On Network Security'],
    ['Impact GHI', 'G&H Inc', 'Azure Performance'],
  ],
};

export interface EdgeDescriptor {
  srcType: NodeType;
  srcColumn: string;
  destType: NodeType;
  destColumn: string;
}

export const edges: EdgeDescriptor[] = [
  {
    srcType: 'features',
    srcColumn: 'title',
    destType: 'tasks',
    destColumn: 'feature',
  },
  {
    srcType: 'capabilities',
    srcColumn: 'features',
    destType: 'features',
    destColumn: 'title',
  },
  {
    srcType: 'accounts',
    srcColumn: 'insights',
    destType: 'insights',
    destColumn: 'title',
  },
  {
    srcType: 'accounts',
    srcColumn: 'name',
    destType: 'impacts',
    destColumn: 'account',
  },
  {
    srcType: 'insights',
    srcColumn: 'title',
    destType: 'impacts',
    destColumn: 'insight',
  },
];
