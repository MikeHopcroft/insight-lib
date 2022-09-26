import {
  loadTablesAndEdges,
} from '../sample-data';
import {NodeStore} from '../store';
import {
  buildDataTree,
  buildPresentationTree,
  compileTree,
  presentationTreeToString,
  TreeDefinition,
} from '../tree';

function render(store: NodeStore, view: TreeDefinition) {
  const compiledTree = compileTree(view);
  console.log(JSON.stringify(compiledTree, null, 2));
  console.log('=============================');

  const dataTree = buildDataTree(store, compiledTree);
  // console.log(JSON.stringify(dataTree, null, 2));
  // console.log('=============================');

  const presentationTree = buildPresentationTree(dataTree);
  // console.log(JSON.stringify(renderRows, null, 2));
  // console.log('=============================');

  console.log(presentationTreeToString(presentationTree));
}

export const taskView: TreeDefinition = {
  type: 'tasks',
  columns: [{field: 'id'}, {field: 'title'}, {field: 'status'}, {field: 'exp'}],
  expressions: [{field: 'exp', value: 'id + 1'}],
  // filter: {predicate: 'status!=="active"'},
  sort: [{field: 'id', increasing: false}],
  style: [
    {predicate: 'status === "active"', style: "{backgroundColor: 'red'}"},
    {predicate: 'true', style: "{backgroundColor: 'green'}"}
  ],
};

export const featureTaskView: TreeDefinition = {
  type: 'features',
  relations: [{childRowDefinition: taskView, predicate: 'features=>tasks'}],
  expressions: [
    {
      field: 'total',
      value: 'sum(days)',
    },
    {
      field: 'remaining',
      value: "sum(days, status !== 'active')",
    },
],

  // expressions: [
  //   {
  //     field: 'total',
  //     value: sum('days'),
  //   },
  //   {
  //     field: 'remaining',
  //     value: sum('days', fieldEq('status', 'active')),
  //   },
  //   {
  //     field: 'percent',
  //     value: (r: NodeFields) => Math.round((r.remaining / r.total) * 100) + '%',
  //   },
  //   {
  //     field: 'count',
  //     value: count('id'),
  //   },
  // ],
  columns: [
    {field: 'title'},
    {field: 'total'},
    {field: 'remaining'},
    // {
    //   field: 'total',
    //   style: select([[fieldGt('total', 6), {backgroundColor: 'red'}]]),
    // },
  ],
};


function go() {
  const store = new NodeStore();
  loadTablesAndEdges(store);

  // Render plain hierarchical view
  // render(store, taskView);
  render(store, featureTaskView);

  console.log('======================');

  // // Change relation to only show impacts if their account
  // // is somewhere in the context (ancestor chain)
  // insightImpactView.relation = outgoingInContext(
  //   'insights=>impacts',
  //   impactView,
  //   'accounts=>impacts'
  // );
  // render(store, accountInsightImpactView);

  // render(store, capabilityFeatureTaskView);

  // console.log(JSON.stringify(store.serialize(), null, 2));
}

go();
