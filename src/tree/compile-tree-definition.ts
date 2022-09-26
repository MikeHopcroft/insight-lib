import {compile} from '../expression-eval';
import {NodeFields} from '../store';

import {outgoing} from './expressions';
import { globalSymbols } from './global-symbols';
import {
  ColumnDefinition,
  CompiledTreeDefinition,
  DataTree,
  Expression,
  ExpressionDefinition,
  Filter,
  FilterDefinition,
  Relation,
  RelationDefinition,
  TreeDefinition,
} from './interfaces';

export function compileTree(tree: TreeDefinition): CompiledTreeDefinition {
  const relations = compileRelations(tree.relations);
  const expressions = compileExpressions(tree.expressions);
  const filter = compileFilter(tree.filter);
  const sort = undefined;
  const style = undefined;
  const a = tree.columns;
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

function compileRelations(
  relations: RelationDefinition[] | undefined
): Relation[] {
  if (!relations) {
    return [];
  }

  return relations.map(r => {
    return outgoing(r.predicate, compileTree(r.childRowDefinition));
  });
}

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

function compileColumns(
  columns: TreeDefinition['columns']
): CompiledTreeDefinition['columns'] {
  return columns.map(c => ({
    field: c.field,
    // For now, drop formatter and styler
    // TODO: compile formatter and styler
  }));
}
