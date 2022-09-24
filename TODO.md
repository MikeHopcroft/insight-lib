# TreeView

* What is EdgeDescriptor?
* Document current render pipeline.
* x Break src/view folder into src/store and src/tree
* x Split interfaces.ts between src/store and src/tree
* Choose better names for
  * RowDefinition => CompiledTreeDefinition, TreeDefinition
  * HierarchyRow => DataTree
  * RenderRow => PresentationTree
  * class Renderer builds DataTree.
* Should Renderer even be a class?
* Introduce an editable RowSpec
  * A RowDefinition is a compiled RowSpec
* RowDefinition.filter might become an array

# Stages

* RowSpec
  * Editable data structure
  * Can traverse entire hierarchy (e.g. across relations)
  * Probably should be serializable for saving to local storage
* RowDefinition
  * Compiled data structure, suitable for direct hierarchy construction
* HierarchyRow[]
  * The data tree
* RenderRow[]
  * The logical presentation tree
* React component tree