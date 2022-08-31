import * as chalk from 'chalk';

import {RenderRow, Style} from './interfaces';

export function renderRowsToString(roots: RenderRow[]): string {
  const widths: number[] = [];
  for (const root of roots) {
    computeColumnWidths(0, root, widths);
  }
  const lines: string[] = [];
  for (const root of roots) {
    formatRow(0, root, widths, lines);
  }
  return lines.join('\n');
}

const indent = 2;

function computeColumnWidths(level: number, root: RenderRow, widths: number[]) {
  for (const [i, cell] of root.cells.entries()) {
    const w = String(cell.text).length + (i == 0 ? indent : 0);
    if (!widths[i] || w > widths[i]) {
      widths[i] = w;
    }
  }
  if (root.children) {
    for (const child of root.children) {
      computeColumnWidths(level + 1, child, widths);
    }
  }
}

function formatRow(
  level: number,
  root: RenderRow,
  widths: number[],
  lines: string[]
) {
  const cells = root.cells.map((cell, i) => {
    let text = String(cell.text);
    if (cell.style) {
      text = applyStyle(cell.style)(text);
    }
    if (i === 0) {
      text = ' '.repeat(indent * level) + text;
    }
    text = text.padEnd(widths[i], ' ');
    return text;
  });

  let line = cells.join('|');
  if (root.style) {
    line =
      ' '.repeat(indent * level) +
      applyStyle(root.style)(line.slice(indent * level));
  }
  lines.push(line);

  if (root.children) {
    for (const child of root.children) {
      formatRow(level + 1, child, widths, lines);
    }
  }
}

function applyStyle(style: Style) {
  if (style.backgroundColor) {
    switch (style.backgroundColor) {
      case 'red':
        return chalk.bgRed;
      case 'green':
        return chalk.bgGreen;
      default:
        return (s: string) => s;
    }
  } else {
    return (s: string) => s;
  }
}
