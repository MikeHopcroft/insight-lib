import {CompiledColumn, DataTree, Formatter} from './interfaces';

///////////////////////////////////////////////////////////////////////////////
//
// Formatters
//
///////////////////////////////////////////////////////////////////////////////
// TODO: replace this temporary implementation with a real one.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hyperlink(fields: string[]): Formatter {
  return (row: DataTree, cell: CompiledColumn) => {
    const text = 'link'; // row.fields[fields[1]]
    const href = cell.field ? row.fields[cell.field] : '';
    if (href) {
      return {href, text};
    } else {
      return '';
    }
  };
}

export function dollars(row: DataTree, cell: CompiledColumn) {
  const value = cell.field ? row.fields[cell.field] : '';
  const formatting_options = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  };
  const dollarString = new Intl.NumberFormat('en-US', formatting_options);
  return dollarString.format(value);
}
