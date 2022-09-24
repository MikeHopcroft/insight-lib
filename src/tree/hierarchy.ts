import {Node, NodeStore} from '../store';
import {HierarchyRow, RowDefinition, RenderCell, RenderRow} from '../tree';

///////////////////////////////////////////////////////////////////////////////
//
// Renderer.buildHierarchy() uses a RowDefinition to convert Nodes in the
// NodeStore to a HierarchyRow[].
//
// Conversion does the following:
//   1. Builds out complete tree based on RowDefinition.Relation.
//   2. Adds computed fields.
//
///////////////////////////////////////////////////////////////////////////////
export class Renderer {
  store: NodeStore;

  constructor(store: NodeStore) {
    this.store = store;
  }

  buildHierarchy(root: RowDefinition): HierarchyRow[] {
    const nodes = this.store.getNodesWithType(root.type);
    return this.buildHierarchyInternal(0, root, nodes, []);
  }

  private buildHierarchyInternal(
    level: number,
    definition: RowDefinition,
    group: Node[],
    context: Node[]
  ): HierarchyRow[] {
    const hierarchy: HierarchyRow[] = [];

    for (const node of group) {
      context.push(node);

      //
      // Initialize new HierarchyRow with data fields and RowDefinition.
      //
      const fields = node.fields;
      const x: HierarchyRow = {
        fields,
        definition,
      };

      //
      // Add descendant nodes returned by the relation.
      //
      const relation = definition.relation;
      if (relation) {
        const {childRowDefinition, children} = relation(context);
        if (children.length > 0) {
          x.children = this.buildHierarchyInternal(
            level + 1,
            childRowDefinition,
            children,
            context
          );
        }
      }

      //
      // Add computed fields.
      //
      const expressions = definition.expressions;
      if (expressions) {
        for (const expression of expressions) {
          const children = x.children ? x.children.map(c => c.fields) : [];
          x.fields[expression.field] = expression.value(x.fields, children);
        }
      }

      hierarchy.push(x);
      context.pop();
    }

    return hierarchy;
  }

  /////////////////////////////////////////////////////////////////////////////
  //
  // renderHierarchy converts HierarchyRow[] to RenderRow[]
  //
  // Conversion does the following
  //   1. Filters each level of the hierarchy, according its
  //      RowDefinition.filter
  //   2. Sorts each level of the hierarchy, according to its
  //      RowDefinition.Sort.
  //   3. Formats and styles each cell according to its ColumnDefintion's
  //      style and format.
  //
  /////////////////////////////////////////////////////////////////////////////

  // TODO: return header row information as well.
  // Or make a separate renderer for the headers.
  renderHierarchy(rows: HierarchyRow[]): RenderRow[] {
    console.log('renderHierarchy ==================================');
    // Makes tree that includes only specified columns.
    // Filters and sorts children
    // Applies formatting
    // Applies styling
    if (rows.length < 1) {
      return [];
    }

    const d = rows[0].definition;
    const {filter, sort} = d;
    let filteredSortedRows = rows;
    if (filter) {
      filteredSortedRows = filteredSortedRows.filter(x => filter(x.fields));
    }
    if (sort) {
      filteredSortedRows = [...filteredSortedRows].sort((a, b) =>
        sort(a.fields, b.fields)
      );
    }

    const render: RenderRow[] = [];
    for (const row of filteredSortedRows) {
      const cells = row.definition.columns.map(c => {
        const formatter = c.format || nopFormatter;
        // TODO: text is not always a string. Rename to value or convert.
        const y: RenderCell = {
          text: c.field ? formatter(row.fields[c.field]) : '',
        };
        const styler = c.style;
        if (styler) {
          const style = styler(row.fields);
          if (style) {
            y.style = style;
          }
        }
        return y;
      });
      const x: RenderRow = {cells};
      if (row.children) {
        x.children = this.renderHierarchy(row.children);
      }

      const style = d.style;
      if (style) {
        const s = style(row.fields);
        if (s) {
          x.style = s;
        }
      }

      render.push(x);
    }
    return render;
  }
}

function nopFormatter(text: string): string {
  return text;
}
