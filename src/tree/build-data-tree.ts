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
    const dataTree: DataTree = {
      fields,
      definition,
    };

    //
    // Add descendant nodes returned by the relation.
    //
    const relations = definition.relations;
    if (relations) {
      dataTree.children = [];
      for (const relation of relations) {
        const {childRowDefinition, children} = relation(context);
        if (children.length > 0) {
          dataTree.children.push(
            ...buildDataTreeRecursion(
              level + 1,
              childRowDefinition,
              children,
              context
            )
          );
        }
      }
    }

    //
    // Add computed fields.
    //
    const expressions = definition.expressions;
    if (expressions) {
      for (const expression of expressions) {
        const children = dataTree.children ? dataTree.children.map(c => c.fields) : [];
        dataTree.fields[expression.field] = expression.value(dataTree.fields, children);
      }
    }

    dataTrees.push(dataTree);
    context.pop();
  }

  return dataTrees;
}
