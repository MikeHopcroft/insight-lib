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
  Sorter,
  SorterDefinition,
  SorterDefinitionList,
  TreeDefinition,
} from './interfaces';

export function compileTree(tree: TreeDefinition): CompiledTreeDefinition {
  const relations = compileRelations(tree.relations);
  const expressions = compileExpressions(tree.expressions);
  const filter = compileFilter(tree.filter);
  const sort = compileSorters(tree.sort);
  const style = undefined;
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

function compileColumns(
  columns: TreeDefinition['columns']
): CompiledTreeDefinition['columns'] {
  return columns.map(c => ({
    field: c.field,
    // For now, drop formatter and styler
    // TODO: compile formatter and styler
  }));
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
  }
}

function compareFields({field: fieldName, increasing}: SorterDefinition) {
  return (a: NodeFields, b: NodeFields) => {
    const x = a[fieldName];
    const y = b[fieldName];
    let sign: number;
    if (typeof x === 'number' && typeof y === 'number') {
      sign = x -y;
    } else {
      sign = x.toString().localeCompare(y);
    }
    if (increasing) {
      return sign;
    } else {
      return -sign;
    }
  }
}

