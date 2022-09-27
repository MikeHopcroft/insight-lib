import {ISymbols, Context} from '../expression-eval';
import {Edge, Node} from '../store';

export class GlobalSymbols implements ISymbols {
  symbols = new Map<string, any>();
  childContextFunctions = new Set<Function>();

  get(name: string): any {
    return this.symbols.get(name);
  }

  add(name: string, f: any, isChildContext = false) {
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

export const globalSymbols = new GlobalSymbols();
globalSymbols.add('sum', sumAggregator, true);
globalSymbols.add('count', countAggregator, true);
globalSymbols.add('ancestor', hasAncestor, false);

// TODO: SECURITY: security review
globalSymbols.add('Math', Math, false);

// Predicate that returns true when a Node's parent along the `parent`
// incoming edge is one of its tree traversal ancestors.
function hasAncestor(ancestors: Node[], edge: Edge, parent: string) {
  const node = edge.to;
  const edges2 = node.incoming[parent];
  if (edges2) {
    const ancestor = edges2[0].to;
    return ancestors.includes(ancestor);
  }
  return false;
}

function sumAggregator(context: Context, args: (c: Context) => any[]): number {
  let total = 0;
  if (context.locals.children) {
    for (const child of context.locals.children) {
      const x = args({
        globals: context.globals,
        locals: child,
      });
      if (x.length === 1 || x[1] === true) {
        total += x[0];
      }
    }
  }
  return total;
}

function countAggregator(
  context: Context,
  args: (c: Context) => any[]
): number {
  let count = 0;
  if (context.locals.children) {
    for (const child of context.locals.children) {
      const x = args({
        globals: context.globals,
        locals: child,
      });
      if (x.length === 0 || x[1] === true) {
        count++;
      }
    }
  }
  return count;
}
