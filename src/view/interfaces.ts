export type NodeType = string;
export type NodeId = number;
export type NodeFields = {[key: string]: any};

///////////////////////////////////////////////////////////////////////////////
//
// Nodes and Edges
//
///////////////////////////////////////////////////////////////////////////////
export interface Node {
  type: NodeType;
  id: NodeId;
  incoming: {[type: string]: Edge[]};
  outgoing: {[type: string]: Edge[]};
  fields: NodeFields;
}

export type EdgeType = string;

export interface Edge {
  type: EdgeType;
  node: Node;
}

///////////////////////////////////////////////////////////////////////////////
//
// RowDefinition
//
///////////////////////////////////////////////////////////////////////////////
export interface RowDefinition {
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
  childRowDefinition: RowDefinition;
  children: Node[];
};

export interface Expression {
  field: string;
  value: (parent: NodeFields, children: NodeFields[]) => any;
}

interface ColumnDefinition {
  // Use field: undefined for a padding cell
  field?: string;

  // Presentation
  format?: Formatter;
  style?: Styler;
}

type Formatter = (value: any) => string;
export type Filter = (row: NodeFields) => boolean;
type Sorter = (a: NodeFields, b: NodeFields) => number;
type Styler = (row: NodeFields) => Style | undefined;

///////////////////////////////////////////////////////////////////////////////
//
// Hierarchy/Outline/Structural Tree
//
///////////////////////////////////////////////////////////////////////////////
export interface HierarchyRow {
  fields: NodeFields;

  // Used by render pass.
  definition: RowDefinition;

  // TODO: DESIGN: store in data._children?
  children?: HierarchyRow[];
}

///////////////////////////////////////////////////////////////////////////////
//
// Render Tree
//
///////////////////////////////////////////////////////////////////////////////
export interface Style {
  backgroundColor?: string;
  color?: string;
}

export interface RenderCell {
  text: string;
  style?: Style;
}

export interface RenderRow {
  cells: RenderCell[];
  children?: RenderRow[];
  style?: Style;
}
