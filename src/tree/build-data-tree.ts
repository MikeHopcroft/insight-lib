import {Node, NodeStore} from '../store';
import {
  DataTree,
  CompiledTreeDefinition,
  PresentationCell,
  PresentationTree,
} from '.';

///////////////////////////////////////////////////////////////////////////////
//
// buildDataTree() uses a CompiledTreeDefinition to convert Nodes in the
// NodeStore to a DataTree[].
//
// Conversion does the following:
//   1. Builds out complete tree based on CompiledTreeDefinition.Relation.
//   2. Adds computed expressionn fields.
//
///////////////////////////////////////////////////////////////////////////////
export function buildDataTree(
  store: NodeStore,
  root: CompiledTreeDefinition
): DataTree[] {
  const nodes = store.getNodesWithType(root.type);
  return buildDataTreeRecursion(0, root, nodes, []);
}

function buildDataTreeRecursion(
  level: number,
  definition: CompiledTreeDefinition,
  group: Node[],
  context: Node[]
): DataTree[] {
  const dataTrees: DataTree[] = [];

  for (const node of group) {
    context.push(node);

    //
    // Initialize new DataTree node with data fields and RowDefinition.
    //
    const fields = node.fields;
    const x: DataTree = {
      fields,
      definition,
    };

    //
    // Add descendant nodes returned by the relation.
    //
    const relation = definition.relation;
    if (relation) {
      const {childRowDefinition, children} = relation(context);
      if (children.length > 0) {
        x.children = buildDataTreeRecursion(
          level + 1,
          childRowDefinition,
          children,
          context
        );
      }
    }

    //
    // Add computed fields.
    //
    const expressions = definition.expressions;
    if (expressions) {
      for (const expression of expressions) {
        const children = x.children ? x.children.map(c => c.fields) : [];
        x.fields[expression.field] = expression.value(x.fields, children);
      }
    }

    dataTrees.push(x);
    context.pop();
  }

  return dataTrees;
}
