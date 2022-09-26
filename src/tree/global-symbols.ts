import {ISymbols, Context} from '../expression-eval';

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
globalSymbols.add('Math', Math, false);

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

function countAggregator(context: Context, args: (c: Context) => any[]): number {
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
