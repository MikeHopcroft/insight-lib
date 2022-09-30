import {loadTablesAndEdges} from '../sample-data';

import {NodeStore} from '../store';

import {
  buildDataTree,
  buildPresentationTree,
  compileTree,
  FormatterType,
  presentationTreeToString,
  TreeDefinition,
} from '../tree';

///////////////////////////////////////////////////////////////////////////////
//
// Capability => Feature => Task
//
////////////////////////////////////////////////////////////////////////////////
const taskView: TreeDefinition = {
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

const featureTaskView: TreeDefinition = {
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

const capabilityFeatureTaskView: TreeDefinition = {
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
const impactView: TreeDefinition = {
  id: 'impactView',
  type: 'impacts',
  columns: [{id: 'title', field: 'title'}],
  sort: [{field: 'title', increasing: false}],
};

const insightImpactView: TreeDefinition = {
  id: 'insightImpactView',
  type: 'insights',
  relations: [{childRowDefinition: impactView, edgeType: 'insights=>impacts'}],
  columns: [{id: 'title', field: 'title'}],
  sort: [{field: 'title', increasing: false}],
};

const accountInsightImpactView: TreeDefinition = {
  id: 'accountInsightImpactView',
  type: 'accounts',
  relations: [
    {childRowDefinition: insightImpactView, edgeType: 'accounts=>insights'},
  ],
  columns: [{id: 'name', field: 'name'}],
  sort: [{field: 'name', increasing: false}],
};

///////////////////////////////////////////////////////////////////////////////
//
// Demo code
//
////////////////////////////////////////////////////////////////////////////////
function render(store: NodeStore, view: TreeDefinition) {
  const compiledTree = compileTree(view);
  // console.log(JSON.stringify(compiledTree, null, 2));
  // console.log('=============================');

  const dataTree = buildDataTree(store, compiledTree);
  // console.log(JSON.stringify(dataTree, null, 2));
  // console.log('=============================');

  const presentationTree = buildPresentationTree(dataTree);
  // console.log(JSON.stringify(renderRows, null, 2));
  // console.log('=============================');

  console.log(presentationTreeToString(presentationTree));
}

function go() {
  const store = new NodeStore();
  loadTablesAndEdges(store);

  // Render plain hierarchical view
  // render(store, taskView);
  // render(store, featureTaskView);
  render(store, capabilityFeatureTaskView);
  render(store, accountInsightImpactView);

  console.log('======================');

  // Change relation to only show impacts if their account
  // is somewhere in the context (ancestor chain)
  insightImpactView.relations = [
    {
      childRowDefinition: impactView,
      edgeType: 'insights=>impacts',
      predicate: 'ancestor(ancestors, edge, "accounts=>impacts")',
    },
  ];
  render(store, accountInsightImpactView);

  // render(store, capabilityFeatureTaskView);

  // console.log(JSON.stringify(store.serialize(), null, 2));
}

go();
