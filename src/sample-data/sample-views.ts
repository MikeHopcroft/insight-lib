import {
  count,
  fieldEq,
  fieldGt,
  otherwise,
  outgoing,
  select,
  sum,
} from '../view/expressions';
import {NodeFields, RowDefinition} from '../view/interfaces';

export const taskView: RowDefinition = {
  type: 'tasks',
  columns: [{field: 'id'}, {field: 'title'}, {field: 'status'}],
  // filter: fieldEq('status', 'active'),
  sort: (a: NodeFields, b: NodeFields) => a.id - b.id,
  style: select([
    [fieldEq('status', 'active'), {backgroundColor: 'red'}],
    [otherwise, {backgroundColor: 'green'}],
  ]),
};

export const featureTaskView: RowDefinition = {
  type: 'features',
  relation: outgoing('features=>tasks', taskView),
  expressions: [
    {
      field: 'total',
      value: sum('days'),
    },
    {
      field: 'remaining',
      value: sum('days', fieldEq('status', 'active')),
    },
    {
      field: 'percent',
      value: (r: NodeFields) => Math.round((r.remaining / r.total) * 100) + '%',
    },
    {
      field: 'count',
      value: count('id'),
    },
  ],
  columns: [
    {field: 'title'},
    {
      field: 'total',
      style: select([[fieldGt('total', 6), {backgroundColor: 'red'}]]),
    },
  ],
};

export const capabilityFeatureTaskView: RowDefinition = {
  type: 'capabilities',
  relation: outgoing('capabilities=>features', featureTaskView),
  expressions: [
    {
      field: 'count',
      value: count('id'),
    },
  ],
  columns: [{field: 'title'}, {}, {field: 'count'}],
};

export const impactView: RowDefinition = {
  type: 'impacts',
  columns: [{field: 'title'}],
  sort: (a: NodeFields, b: NodeFields) => a.title.localeCompare(b.title),
};

export const insightImpactView: RowDefinition = {
  type: 'insights',
  relation: outgoing('insights=>impacts', impactView),
  columns: [{field: 'title'}],
  sort: (a: NodeFields, b: NodeFields) => a.title.localeCompare(b.title),
};

export const accountInsightImpactView: RowDefinition = {
  type: 'accounts',
  relation: outgoing('accounts=>insights', insightImpactView),
  columns: [{field: 'name'}],
  sort: (a: NodeFields, b: NodeFields) => a.name.localeCompare(b.name),
};
