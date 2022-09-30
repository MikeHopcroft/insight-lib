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
  id: string;

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
  id: string;

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

export enum FormatterType {
  STATIC,
  DYNAMIC,
}

export interface FormatterDefinitionBase {
  type: FormatterType;
  formatter: string;
}

export type StaticFormatterNames = 'dollar';

export interface StaticFormatterDefinition extends FormatterDefinitionBase {
  type: FormatterType.STATIC;
  formatter: StaticFormatterNames;
  parameter?: string;
}

export type DynamicFormatterNames = 'hyperlink';

export interface DynamicFormatterDefinition extends FormatterDefinitionBase {
  type: FormatterType.DYNAMIC;
  formatter: DynamicFormatterNames;
  fields?: string[];
}

export type FormatterDefinition =
  | StaticFormatterDefinition
  | DynamicFormatterDefinition;

export type RelationDefinition = {
  childRowDefinition: TreeDefinition;
  direction?: string; // Defaults to 'outgoing'
  edgeType?: string; // Default behavior allows all edge types
  nodeType?: string; // Default behavior allows all node types
  predicate?: string; // Default behavior allows all edges
};

export type SorterDefinition = {field: string; increasing?: boolean};
export type SorterDefinitionList = SorterDefinition[];

export type StylerDefinition = {predicate: string; style: PresentationStyle};
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

export type CompiledColumn = CompiledTreeDefinition['columns'][0];

export interface Expression {
  field: string;
  value: (node: DataTree) => any;
}

export type Filter = (row: NodeFields) => boolean;
export type Formatter = (
  row: DataTree,
  cell: CompiledColumn
) => string | {[key: string]: any};

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
  id: string;
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
  id: string;
  text: string | {[key: string]: any};
  style?: PresentationStyle;
}

export interface PresentationTree {
  id: string;
  cells: PresentationCell[];
  children?: PresentationTree[];
  style?: PresentationStyle;
}
