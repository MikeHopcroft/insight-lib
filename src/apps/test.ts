import {outgoingInContext} from '../view/expressions';
import {Renderer} from '../view/hierarchy';
import {RowDefinition} from '../view/interfaces';
import {Store} from '../view/node-store';
import {renderRowsToString} from '../view/row-to-string';
import {loadTablesAndEdges} from '../sample-data/sample-loader';
import {
  accountInsightImpactView,
  capabilityFeatureTaskView,
  impactView,
  insightImpactView,
} from '../sample-data/sample-views';

function render(store: Store, view: RowDefinition) {
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
  const store = new Store();
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
}

go();
