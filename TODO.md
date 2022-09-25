# TreeView

* . Bring in expression-eval and jsep
  * SECURITY: Consider disabling member variable access entirely or for functions
* Bring in jest and jest test explorer recommendation
* Migrate expression-eval tests to jest
* Modify expression-eval for aggregate expressions
* x Add MIT license
* . TreeDefinition compiler
  * . Structure: columns and relations
  * Expressions
    * x Parent context only
    * Add child context for aggregates
    * Rename expressions.ts to built-ins.ts.
    * Consider combining columns and expressions
    * Catch and handle parse errors
    * Catch and handle eval errors
    * Enforce expression topological ordering so expressions can reference each other.
  * x Filters => child context only
  * Formatters
  * Relations
  * Sorters => child context only
    * General sort functions for things like status where sort is not lexographic
  * Stylers
* Publish npm package
* . Integrate npm package into insight-demo
* Relation expressions should be able to filter on edge type and node type
* Schema inference
* What is EdgeDescriptor?
* Document current render pipeline.
* x Break src/view folder into src/store and src/tree
* x test2.js
* x Replace GenericTreeDefinition.relation with relations.
* x Split interfaces.ts between src/store and src/tree
* x Choose better names for
  * x RowDefinition => CompiledTreeDefinition, TreeDefinition
  * x HierarchyRow => DataTree
  * x RenderRow => PresentationTree
  * x class Renderer builds DataTree.
* x Should Renderer even be a class?
* Change sample-view.ts to use TreeDefinition instead of CompiledTreeDefinition
* RowDefinition.filter might become an array
* Introduce an editable RowSpec
  * A RowDefinition is a compiled RowSpec
* Stop exporting compiled tree subtypes (e.g. Filter)
* Figure out original intent for formatter signature
* Look into vm2 (https://www.npmjs.com/package/vm2)
* Look into expression-eval (https://www.npmjs.com/package/expression-eval)

# Stages

* TreeDefinition
  * Editable data structure
  * Can traverse entire hierarchy (e.g. across relations)
  * Probably should be serializable for saving to local storage
* CompiledTreeDefinition
  * Compiled data structure, suitable for direct hierarchy construction
* DataTree[]
  * The data tree
* PresentationTree[]
  * The logical presentation tree
* React component tree

