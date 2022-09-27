import {EdgeType, Node, NodeFields} from '../store';

import {
  CompiledTreeDefinition,
  DataTree,
  Expression,
  Filter,
  Relation,
} from '../tree';

///////////////////////////////////////////////////////////////////////////////
//
// Field expressions
//
///////////////////////////////////////////////////////////////////////////////
export function sum(field: string, filter?: Filter): Expression['value'] {
  return (node: DataTree) => {
    let x = 0;
    if (node.children) {
      for (const row of node.children) {
        if (!filter || filter(row)) {
          x += row.fields[field];
        }
      }
    }
    return x;
  };
}

export function count(field: string, filter?: Filter): Expression['value'] {
  return (node: DataTree) => {
    let x = 0;
    if (node.children) {
      for (const row of node.children) {
        if (!filter || filter(row)) {
          x++;
        }
      }
    }
    return x;
  };
}

export function select<T>(cases: [Filter, T][]) {
  return (parent: NodeFields) => {
    for (const c of cases) {
      if (c[0](parent)) {
        return c[1];
      }
    }
    return undefined;
  };
}

export function fieldEq<T>(field: string, value: T) {
  return (parent: NodeFields) => {
    return parent[field] === value;
  };
}

export function fieldNe<T>(field: string, value: T) {
  return (parent: NodeFields) => {
    return parent[field] !== value;
  };
}

export function fieldGt<T>(field: string, value: T) {
  return (parent: NodeFields) => {
    return parent[field] > value;
  };
}

export function otherwise() {
  return true;
}

///////////////////////////////////////////////////////////////////////////////
//
// Sort expressions
//
///////////////////////////////////////////////////////////////////////////////
export function ByField(fieldName: string) {
  return (a: NodeFields, b: NodeFields) =>
    a[fieldName].localeCompare(b[fieldName]);
}

///////////////////////////////////////////////////////////////////////////////
//
// Relations
//
///////////////////////////////////////////////////////////////////////////////

// All outgoing edges
export function outgoing(
  type: EdgeType,
  childRowDefinition: CompiledTreeDefinition
): Relation {
  return (context: Node[]) => {
    const node = context[context.length - 1];
    const edges = node.outgoing[type];
    if (edges) {
      return {childRowDefinition, children: edges.map(c => c.to)};
    } else {
      return {childRowDefinition, children: []};
    }
  };
}

// Outgoing edges to nodes who's first incoming edge of type direct
// connects to a node on the traversal context.
export function outgoingInContext(
  type: EdgeType,
  childRowDefinition: CompiledTreeDefinition,
  direct: EdgeType
): Relation {
  return (context: Node[]) => {
    const node = context[context.length - 1];
    const edges = node.outgoing[type];
    if (edges) {
      const children = edges
        .map(c => c.to)
        .filter(child => {
          const edges2 = child.incoming[direct];
          if (edges2) {
            const ancestor = edges2[0].to;
            return context.includes(ancestor);
          }
          return false;
        });
      return {childRowDefinition, children};
    } else {
      return {childRowDefinition, children: []};
    }
  };
}

///////////////////////////////////////////////////////////////////////////////
//
// Formatters
//
///////////////////////////////////////////////////////////////////////////////
export function hyperlink(href: string) {
  const text = 'link';
  if (href) {
    return {href, text};
  } else {
    return '';
  }
}

export function dollars(value: number) {
  const formatting_options = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };
  const dollarString = new Intl.NumberFormat('en-US', formatting_options);
  return dollarString.format(value);
}
