import {ISymbols, compile, Context} from '../expression-eval';
import {NodeFields} from '../store';

import {outgoing} from './expressions';
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

class GlobalSymbols implements ISymbols {
  symbols = new Map<string, any>();
  childContextFunctions = new Set<Function>();

  get(name: string): any {
    return this.symbols.get(name);
  }

  add(name: string, f: Function, isChildContext = false) {
    if (this.symbols.has(name)) {
      throw new Error(`Registering duplicate symbol "${name}"`);
    }
    this.symbols.set(name, f);
    if (isChildContext) {
      this.childContextFunctions.add(f);
    }
  }

  isChildContextFunction(f: Function): boolean {
    return this.childContextFunctions.has(f);
  }
}

const globalSymbols = new GlobalSymbols();
globalSymbols.add('sum', sumAggregator, true);

function sumAggregator(context: Context, args: (c: Context) => any[]): number {
  let total = 0;
  if (context.context.children) {
    for (const child of context.context.children) {
      const x = args({
        globals: context.globals,
        context: child,
      });
      if (x.length === 1 || x[1] === true) {
        total += x[0];
      }
    }
  }
  return total;
}

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
    // For now, use the first relation.
    // TODO: use all relations
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
    return f({context: {fields: context}});
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
        context,
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
