///////////////////////////////////////////////////////////////////////////////
//
// Nodes and Edges
//
///////////////////////////////////////////////////////////////////////////////
export type NodeType = string;
export type NodeId = number;
export type NodeFields = {[key: string]: any};

export interface Node {
  type: NodeType;
  id: NodeId;
  incoming: {[type: EdgeType]: Edge[]};
  outgoing: {[type: EdgeType]: Edge[]};
  fields: NodeFields;
}

export type EdgeType = string;

export interface Edge {
  type: EdgeType;
  from: Node;
  to: Node;
}

///////////////////////////////////////////////////////////////////////////////
//
// Working proposal for serialization format.
//
// DESIGN NOTE: SerilaizableId will likely have a structure like
//   `urn:is:${node.type}:${node.id}`
// where node.id, will likely be a string encoding of the service's id for
// the node.
//
///////////////////////////////////////////////////////////////////////////////
export type SerializableNodeId = string;
export type SerializableEdge = {[edgeType: string]: SerializableNodeId};

export interface SerializableNode {
  id: SerializableNodeId;
  outgoing: SerializableEdge[];
  fields: NodeFields;
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

export interface ColumnDefinition {
  // Use field: undefined for a padding cell
  field?: string;

  // Presentation
  format?: Formatter;
  style?: Styler;
}

type Formatter = (value: any) => string | {[key:string]:any};;
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
  text: string | {[key:string]:any};
  style?: Style;
}

export interface RenderRow {
  cells: RenderCell[];
  children?: RenderRow[];
  style?: Style;
}
