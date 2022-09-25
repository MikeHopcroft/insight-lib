import {outgoing} from './expressions';
import {
  ColumnDefinition,
  CompiledTreeDefinition,
  Expression,
  ExpressionDefinition,
  Relation,
  RelationDefinition,
  TreeDefinition,
} from './interfaces';

export function compile(tree: TreeDefinition): CompiledTreeDefinition {
  const relations = compileRelations(tree.relations);
  const expressions = compileExpressions(tree.expressions);
  const filter = undefined;
  const sort = undefined;
  const style = undefined;
  const a = tree.columns;
  const columns = compileColumns(tree.columns);

  const compiled: CompiledTreeDefinition = {
    type: tree.type,
    columns,
    expressions,
    filter,
    // For now, use the first relation.
    // TODO: use all relations
    relations,
    sort,
    style,
  };
  return compiled;
}

function compileRelations(
  relations: RelationDefinition[] | undefined
): Relation[] {
  if (!relations) {
    return [];
  }

  return relations.map(r => {
    return outgoing(r.predicate, compile(r.childRowDefinition));
  });
}

function compileExpressions(
  expressions: ExpressionDefinition[] | undefined
): Expression[] {
  if (!expressions) {
    return [];
  }

  return expressions.map(e => ({
    field: e.field,
    // For now all expressions return 0.
    // TODO: wire up expression parser/evaluator here.
    value: () => 0,
  }));
}

function compileColumns(
  columns: TreeDefinition['columns']
): CompiledTreeDefinition['columns'] {
  return columns.map(c => ({
    field: c.field,
    // For now, drop formatter and styler
    // TODO: compile formatter and styler
  }));
}
