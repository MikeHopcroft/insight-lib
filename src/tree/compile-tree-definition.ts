import {compile} from '../expression-eval';
import {EdgeCollection, Node, NodeFields} from '../store';

import {globalSymbols} from './global-symbols';
import {
  CompiledTreeDefinition,
  DataTree,
  Expression,
  ExpressionDefinition,
  Filter,
  FilterDefinition,
  Relation,
  RelationDefinition,
  RelationDefinition2,
  Sorter,
  SorterDefinition,
  SorterDefinitionList,
  Styler,
  StylerDefinition,
  StylerDefinitionList,
  TreeDefinition,
} from './interfaces';

///////////////////////////////////////////////////////////////////////////////
//
// compileTree
//
///////////////////////////////////////////////////////////////////////////////
export function compileTree(tree: TreeDefinition): CompiledTreeDefinition {
  const relations = compileRelations2(tree.relations);
  const expressions = compileExpressions(tree.expressions);
  const filter = compileFilter(tree.filter);
  const sort = compileSorters(tree.sort);
  const style = compileStylers(tree.style);
  const columns = compileColumns(tree.columns);

  const compiled: CompiledTreeDefinition = {
    type: tree.type,
    columns,
    expressions,
    filter,
    relations,
    sort,
    style,
  };
  return compiled;
}

///////////////////////////////////////////////////////////////////////////////
//
// compileColumns
//
///////////////////////////////////////////////////////////////////////////////
function compileColumns(
  columns: TreeDefinition['columns']
): CompiledTreeDefinition['columns'] {
  return columns.map(c => ({
    field: c.field,
    style: compileStylers(c.style),
    // For now, drop formatter
    // TODO: compile formatter
  }));
}

///////////////////////////////////////////////////////////////////////////////
//
// compileExpressions 
//
///////////////////////////////////////////////////////////////////////////////
function compileExpressions(
  expressions: ExpressionDefinition[] | undefined
): Expression[] {
  if (!expressions) {
    return [];
  }

  const y = expressions.map(e => {
    const f = compile(e.value);
    const value = (context: DataTree): any => {
      return f({
        globals: globalSymbols,
        locals: context,
      });
    };
    const x = {
      field: e.field,
      value: value,
    };
    return x;
  });

  return y;
}

///////////////////////////////////////////////////////////////////////////////
//
// compileFilter
//
///////////////////////////////////////////////////////////////////////////////
function compileFilter(
  filter: FilterDefinition | undefined
): Filter | undefined {
  if (!filter) {
    return undefined;
  }

  const f = compile(filter.predicate);
  const result = (context: NodeFields): any => {
    return f({locals: {fields: context}});
  };

  return result;
}

///////////////////////////////////////////////////////////////////////////////
//
// compileRelations
//
///////////////////////////////////////////////////////////////////////////////
// function compileRelations(
//   relations: RelationDefinition[] | undefined
// ): Relation[] {
//   if (!relations) {
//     return [];
//   }

//   return relations.map(r => {
//     return outgoing(r.predicate, compileTree(r.childRowDefinition));
//   });
// }

function compileRelations2(
  relations: RelationDefinition2[] | undefined
): Relation[] {
  if (!relations) {
    return [];
  }

  return relations.map(r => {
    return traverseEdges(r);
  });
}

function traverseEdges(relation: RelationDefinition2): Relation {
  const childRowDefinition = compileTree(relation.childRowDefinition);
  const predicate = relation.predicate
    ? compile(relation.predicate)
    : undefined;
  return (ancestors: Node[]) => {
    const children = getNodes(
      ancestors,
      relation.direction,
      relation.edgeType,
      relation.nodeType,
      // predicate
    );
    return {
      childRowDefinition,
      children,
    };
  };
}

function getNodes(
  ancestors: Node[],
  direction: string | undefined,
  edgeType: string | undefined,
  nodeType: string | undefined,
  // predicate: ((ancestors: Node[], node: Node) => boolean) | undefined
): Node[] {
  if (ancestors.length === 0) {
    throw new Error('Internal error: ancestors must contain at least one node');
  }
  const node = ancestors[ancestors.length - 1];
  const collection =
    direction === undefined || direction === 'outgoing'
      ? node.outgoing
      : direction === 'incoming'
      ? node.incoming
      : undefined;

  if (collection === undefined) {
    throw new Error(`Unsupported edge collection ${collection}`);
  }

  return [
    ...getNodesGenerator(ancestors, collection, edgeType, nodeType),
    // ...getNodesGenerator(ancestors, collection, edgeType, nodeType, predicate),
  ];
}

function* getNodesGenerator(
  ancestors: Node[],
  collection: EdgeCollection,
  edgeType: string | undefined,
  nodeType: string | undefined,
  // predicate: ((ancestors: Node[], node: Node) => boolean) | undefined
): Generator<Node> {
  for (const type in collection) {
    for (const edge of collection[type]) {
      if (edgeType && edge.type !== edgeType) {
        continue;
      }
      if (nodeType && edge.to.type !== nodeType) {
        continue;
      }
      // if (predicate && !predicate(ancestors, edge.to)) {
      //   continue;
      // }
      yield edge.to;
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// compileSorters
//
///////////////////////////////////////////////////////////////////////////////
function compileSorters(
  sorters: SorterDefinitionList | undefined
): Sorter | undefined {
  if (!sorters) {
    return undefined;
  }
  const comparers = sorters.map(x => compareFields(x));

  return (a: NodeFields, b: NodeFields) => {
    for (const comparer of comparers) {
      const sign = comparer(a, b);
      if (sign) {
        return sign;
      }
    }
    return 0;
  };
}

function compareFields({field: fieldName, increasing}: SorterDefinition) {
  return (a: NodeFields, b: NodeFields) => {
    const x = a[fieldName];
    const y = b[fieldName];
    let sign: number;
    if (typeof x === 'number' && typeof y === 'number') {
      sign = x - y;
    } else {
      sign = x.toString().localeCompare(y);
    }
    if (increasing) {
      return sign;
    } else {
      return -sign;
    }
  };
}

///////////////////////////////////////////////////////////////////////////////
//
// compileStylers
//
///////////////////////////////////////////////////////////////////////////////
function compileStylers(
  stylers: StylerDefinitionList | undefined
): Styler | undefined {
  if (!stylers) {
    return undefined;
  }

  const cases = stylers.map(styler => {
    const predicate = compile(styler.predicate);
    const style = compile(styler.style);
    return {predicate, style};
  });

  const result = (fields: NodeFields): any => {
    const context = {locals: {fields}};
    for (const c of cases) {
      if (c.predicate(context)) {
        return c.style(context);
      }
    }
    return {};
  };

  return result;
}
