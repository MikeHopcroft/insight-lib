import {loadTablesAndEdges} from '../sample-data';

import {NodeStore} from '../store';

import {
  buildDataTree,
  buildPresentationTree,
  compileTree,
  presentationTreeToString,
  TreeDefinition,
} from '../tree';

///////////////////////////////////////////////////////////////////////////////
//
// Capability => Feature => Task
//
////////////////////////////////////////////////////////////////////////////////
const taskView: TreeDefinition = {
  type: 'tasks',
  columns: [{field: 'id'}, {field: 'title'}, {field: 'status'}, {field: 'exp'}],
  expressions: [{field: 'exp', value: 'id + 1'}],
  // filter: {predicate: 'status==="active"'},
  sort: [{field: 'id', increasing: false}],
  style: [
    {predicate: 'status === "active"', style: "{backgroundColor: 'red'}"},
    {predicate: 'true', style: "{backgroundColor: 'green'}"},
  ],
};

const featureTaskView: TreeDefinition = {
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
    {field: 'title'},
    {
      field: 'total',
      style: [{predicate: 'total > 6', style: '{backgroundColor: "red"}'}],
    },
    {field: 'remaining'},
    {field: 'percent'},
    {field: 'count'},
  ],
};

const capabilityFeatureTaskView: TreeDefinition = {
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
  columns: [{field: 'title'}, {}, {field: 'count'}],
};

///////////////////////////////////////////////////////////////////////////////
//
// Account => Insight => Impact
//
////////////////////////////////////////////////////////////////////////////////
const impactView: TreeDefinition = {
  type: 'impacts',
  columns: [{field: 'title'}],
  sort: [{field: 'title', increasing: false}],
};

const insightImpactView: TreeDefinition = {
  type: 'insights',
  relations: [{childRowDefinition: impactView, edgeType: 'insights=>impacts'}],
  columns: [{field: 'title'}],
  sort: [{field: 'title', increasing: false}],
};

const accountInsightImpactView: TreeDefinition = {
  type: 'accounts',
  relations: [
    {childRowDefinition: insightImpactView, edgeType: 'accounts=>insights'},
  ],
  columns: [{field: 'name'}],
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
