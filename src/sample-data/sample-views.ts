import {FormatterType, TreeDefinition} from '../tree';

///////////////////////////////////////////////////////////////////////////////
//
// Capability => Feature => Task
//
////////////////////////////////////////////////////////////////////////////////
export const taskView: TreeDefinition = {
  id: 'taskView',
  type: 'tasks',
  columns: [
    {id: 'id', field: 'id'},
    {id: 'title', field: 'title'},
    {id: 'status', field: 'status'},
    {id: 'exp', field: 'exp'},
  ],
  expressions: [{field: 'exp', value: 'id + 1'}],
  // filter: {predicate: 'status==="active"'},
  sort: [{field: 'id', increasing: false}],
  style: [
    {predicate: 'status === "active"', style: {backgroundColor: 'red'}},
    {predicate: 'true', style: {backgroundColor: 'green'}},
  ],
};

export const featureTaskView: TreeDefinition = {
  id: 'featureTaskView',
  type: 'features',
  relations: [{childRowDefinition: taskView, edgeType: 'features=>tasks'}],
  expressions: [
    {
      field: 'total',
      value: 'sum(days)',
    },
    {
      field: 'remaining',
      value: "sum(days, status !== 'active')",
    },
    {
      field: 'percent',
      value: 'Math.round((remaining / total) * 100) + "%"',
    },
    {
      field: 'count',
      value: 'count()',
    },
  ],

  columns: [
    {id: 'title', field: 'title'},
    {
      id: 'total',
      field: 'total',
      style: [{predicate: 'total > 6', style: {backgroundColor: 'red'}}],
    },
    {id: 'remaining', field: 'remaining'},
    {id: 'percent', field: 'percent'},
    {id: 'count', field: 'count'},
  ],
};

export const capabilityFeatureTaskView: TreeDefinition = {
  id: 'capabilityFeatureTaskView',
  type: 'capabilities',
  relations: [
    {childRowDefinition: featureTaskView, edgeType: 'capabilities=>features'},
  ],
  expressions: [
    {
      field: 'count',
      value: 'count()',
    },
  ],
  columns: [
    {id: 'title', field: 'title'},
    {id: 'spacer'},
    {
      id: 'count',
      field: 'count',
      format: {type: FormatterType.STATIC, formatter: 'dollar'},
    },
  ],
};

///////////////////////////////////////////////////////////////////////////////
//
// Account => Insight => Impact
//
////////////////////////////////////////////////////////////////////////////////
export const impactView: TreeDefinition = {
  id: 'impactView',
  type: 'impacts',
  columns: [{id: 'title', field: 'title'}],
  sort: [{field: 'title', increasing: false}],
};

export const insightImpactView: TreeDefinition = {
  id: 'insightImpactView',
  type: 'insights',
  relations: [{childRowDefinition: impactView, edgeType: 'insights=>impacts'}],
  columns: [{id: 'title', field: 'title'}],
  sort: [{field: 'title', increasing: false}],
};

export const accountInsightImpactView: TreeDefinition = {
  id: 'accountInsightImpactView',
  type: 'accounts',
  relations: [
    {childRowDefinition: insightImpactView, edgeType: 'accounts=>insights'},
  ],
  columns: [{id: 'name', field: 'name'}],
  sort: [{field: 'name', increasing: false}],
};
