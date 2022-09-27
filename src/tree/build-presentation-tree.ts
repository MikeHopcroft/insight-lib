import {DataTree, PresentationCell, PresentationTree} from '.';

/////////////////////////////////////////////////////////////////////////////
//
// buildPresentationTree() converts DataTree[] to PresentationTree[]
//
// Conversion does the following
//   1. Filters each level of the hierarchy, according its
//      CompiledTreeDefinition.filter
//   2. Sorts each level of the hierarchy, according to its
//      CompiledTreeDefinition.Sort.
//   3. Formats and styles each cell according to its ColumnDefintion's
//      style and format.
//
/////////////////////////////////////////////////////////////////////////////

// TODO: return header row information as well.
// Or make a separate renderer for the headers.
export function buildPresentationTree(rows: DataTree[]): PresentationTree[] {
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

  const presentationTrees: PresentationTree[] = [];
  for (const row of filteredSortedRows) {
    const cells = row.definition.columns.map(c => {
      const formatter = c.format || nopFormatter;
      // TODO: text is not always a string. Rename to value or convert.
      const y: PresentationCell = {
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
    const x: PresentationTree = {cells};
    if (row.children) {
      x.children = buildPresentationTree(row.children);
    }

    const style = d.style;
    if (style) {
      const s = style(row.fields);
      if (s) {
        x.style = s;
      }
    }

    presentationTrees.push(x);
  }
  return presentationTrees;
}

function nopFormatter(text: string): string {
  return text;
}
