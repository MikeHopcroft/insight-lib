import {Node, NodeFields, NodeType} from '../store/interfaces';

///////////////////////////////////////////////////////////////////////////////
//
// GenericTreeDefinition
//
///////////////////////////////////////////////////////////////////////////////
export interface GenericTreeDefinition<
  EXPRESSION,
  FILTER,
  FORMATTER,
  RELATION,
  SORTER,
  STYLER
> {
  // Data source, hierarchical structure, and computed fields.
  type: NodeType;
  relations?: RELATION[];
  expressions?: EXPRESSION[];

  // Presentation
  filter?: FILTER;
  sort?: SORTER;
  style?: STYLER;
  columns: ColumnDefinition<FORMATTER, STYLER>[];
}

export interface ColumnDefinition<FORMATTER, STYLER> {
  // Use field: undefined for a padding cell
  field?: string;

  // Presentation
  format?: FORMATTER;
  style?: STYLER;
}

///////////////////////////////////////////////////////////////////////////////
//
// TreeDefinition
//
///////////////////////////////////////////////////////////////////////////////
export type TreeDefinition = GenericTreeDefinition<
  ExpressionDefinition,
  FilterDefinition,
  FormatterDefinition,
  RelationDefinition,
  SorterDefinitionList,
  StylerDefinitionList
>;

export interface ExpressionDefinition {
  field: string;
  value: string;
}

export interface FilterDefinition {
  predicate: string;
}

export interface FormatterDefinition {
  format: string;
}

export type RelationDefinition = {
  childRowDefinition: TreeDefinition;
  direction?: string; // Defaults to 'outgoing'
  edgeType?: string;  // Default behavior allows all edge types
  nodeType?: string;  // Default behavior allows all node types
  predicate?: string; // Default behavior allows all edges
}

export type SorterDefinition = {field: string; increasing: boolean};
export type SorterDefinitionList = SorterDefinition[];

export type StylerDefinition = {predicate: string; style: string};
export type StylerDefinitionList = StylerDefinition[];

///////////////////////////////////////////////////////////////////////////////
//
// CompiledTreeDefinition
//
///////////////////////////////////////////////////////////////////////////////
export type CompiledTreeDefinition = GenericTreeDefinition<
  Expression,
  Filter,
  Formatter,
  Relation,
  Sorter,
  Styler
>;

export interface Expression {
  field: string;
  value: (node: DataTree) => any;
}

export type Filter = (row: NodeFields) => boolean;
export type Formatter = (value: any) => string | {[key: string]: any};

export type Relation = (context: Node[]) => {
  childRowDefinition: CompiledTreeDefinition;
  children: Node[];
};

export type Sorter = (a: NodeFields, b: NodeFields) => number;
export type Styler = (row: NodeFields) => PresentationStyle | undefined;

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
// PresentationTree
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
