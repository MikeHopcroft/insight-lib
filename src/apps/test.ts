import {
  accountInsightImpactView,
  capabilityFeatureTaskView,
  impactView,
  insightImpactView,
  loadTablesAndEdges,
} from '../sample-data';
import {NodeStore} from '../store';
import {
  outgoingInContext,
  Renderer,
  renderRowsToString,
  RowDefinition,
} from '../tree';

function render(store: NodeStore, view: RowDefinition) {
  const renderer = new Renderer(store);
  const viewRows = renderer.buildHierarchy(view);
  // console.log(JSON.stringify(viewRows, null, 2));
  // console.log('=============================');

  const renderRows = renderer.renderHierarchy(viewRows);
  // console.log(JSON.stringify(renderRows, null, 2));
  // console.log('=============================');

  console.log(renderRowsToString(renderRows));
}

function go() {
  const store = new NodeStore();
  loadTablesAndEdges(store);

  // Render plain hierarchical view
  render(store, accountInsightImpactView);

  console.log('======================');

  // Change relation to only show impacts if their account
  // is somewhere in the context (ancestor chain)
  insightImpactView.relation = outgoingInContext(
    'insights=>impacts',
    impactView,
    'accounts=>impacts'
  );
  render(store, accountInsightImpactView);

  render(store, capabilityFeatureTaskView);

  // console.log(JSON.stringify(store.serialize(), null, 2));
}

go();
