import {Node, NodeFields, NodeType} from '../store/interfaces';

///////////////////////////////////////////////////////////////////////////////
//
// CompiledTreeDefinition
//
///////////////////////////////////////////////////////////////////////////////
export interface CompiledTreeDefinition {
  // Data source, hierarchical structure, and computed fields.
  type: NodeType;
  relation?: Relation;
  expressions?: Expression[];

  // Presentation
  filter?: Filter;
  sort?: Sorter;
  style?: Styler;
  columns: ColumnDefinition[];
}

export type Relation = (context: Node[]) => {
  childRowDefinition: CompiledTreeDefinition;
  children: Node[];
};

export interface Expression {
  field: string;
  value: (parent: NodeFields, children: NodeFields[]) => any;
}

export interface ColumnDefinition {
  // Use field: undefined for a padding cell
  field?: string;

  // Presentation
  format?: Formatter;
  style?: Styler;
}

type Formatter = (value: any) => string | {[key: string]: any};
export type Filter = (row: NodeFields) => boolean;
type Sorter = (a: NodeFields, b: NodeFields) => number;
type Styler = (row: NodeFields) => PresentationStyle | undefined;

///////////////////////////////////////////////////////////////////////////////
//
// DataTree
//
///////////////////////////////////////////////////////////////////////////////
export interface DataTree {
  fields: NodeFields;

  // Used by render pass.
  definition: CompiledTreeDefinition;

  // TODO: DESIGN: store in data._children?
  children?: DataTree[];
}

///////////////////////////////////////////////////////////////////////////////
//
// Render Tree
//
///////////////////////////////////////////////////////////////////////////////
export interface PresentationStyle {
  backgroundColor?: string;
  color?: string;
}

export interface PresentationCell {
  text: string | {[key: string]: any};
  style?: PresentationStyle;
}

export interface PresentationTree {
  cells: PresentationCell[];
  children?: PresentationTree[];
  style?: PresentationStyle;
}
