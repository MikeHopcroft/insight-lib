# TreeView

* What is EdgeDescriptor?
* Document current render pipeline.
* x Break src/view folder into src/store and src/tree
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