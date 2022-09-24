import {
  EdgeType,
  Node,
  NodeFields,
} from '../store';
import {
  Expression,
  Filter,
  RowDefinition,
  Relation,
} from '../tree';

///////////////////////////////////////////////////////////////////////////////
//
// Field expressions
//
///////////////////////////////////////////////////////////////////////////////
export function sum(field: string, filter?: Filter): Expression['value'] {
  return (_ignore: NodeFields, children: NodeFields[]) => {
    let x = 0;
    for (const row of children) {
      if (!filter || filter(row)) {
        x += row[field];
      }
    }
    return x;
  };
}

export function count(field: string, filter?: Filter): Expression['value'] {
  return (_ignore: NodeFields, children: NodeFields[]) => {
    let x = 0;
    for (const row of children) {
      if (!filter || filter(row)) {
        x++;
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
export function outgoing(
  type: EdgeType,
  childRowDefinition: RowDefinition
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

export function outgoingInContext(
  type: EdgeType,
  childRowDefinition: RowDefinition,
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
export function hyperlink(text: string) {
  return (href: string) => {
    if (href) {
      return {href, text};
    } else {
      return '';
    }
  }
}
