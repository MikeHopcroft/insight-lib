# TreeView

* x Uninstall jsepObject
* Add title to hyperlink
* Move expression-eval into tree folder
  * Check dependency web
* Rename expressions.ts to built-ins.ts.
  * Or remove after compileTree() migration
* Consider combining columns and expressions
  * One downside is the expression order can be used to allow expressions to reference each other. If expressions and columns were the same, we'd want the order to be screen order. Also, do we want a 1:1 correspondance? What about expressions with intermediate results?
* Stop exporting compiled tree subtypes (e.g. Filter)
  * This requires migrating insight-demo away from the compiled tree.
* x Get linter clean
* x Mock up insight-demo view as TreeDefinition
* x Publish npm package
* x Integrate npm package into insight-demo
* x Bring in jest and jest test explorer recommendation
  * x Reenable Object Literal tests
  * x Migrate expression-eval tests to jest
* ===============================================
* Catch and handle parse and eval errors
* Consider separate global context for relation predicates, expressions, and formatters
* Cleanup evaluateObjectLiteral()
* Consider throwing at the default case of evaluate()
* Enforce expression topological ordering so expressions can reference each other.
* ===============================================
* RELATIONS: Reference childRowDefinition by id
  * Cache compilations
* Data-driven formatter table
* Compiled formatters
* General sort functions for things like status where sort is not lexographic
* Consider list of reserved field names (id, type, parent, child, sum, count, max, min)
  * Or perhaps disallow anything that starts with _ so that we can have _id, _type, etc.
* SECURITY: Consider disabling member variable access entirely or for functions
* SECURITY: determine whether Math is a safe global. Might need to replace it with a mock.
* SECURITY: Make sure evaluateMember() doesn't return global symbols as members.
* ===============================================
* x Formatters
* x RELATIONS: Figure out work-around for outgoingInContext(), outgoingWithNodeFilter()
  * x First without predicate
  * x Then with predicate
  * x Rename RelationDefinition2
* x Modify expression-eval for aggregate expressions
* x Add MIT license
* x Fix unit tests
* x Bring in expression-eval and jsep
* . TreeDefinition compiler
  * x Column styling
  * x Structure: columns and relations
  * x Expressions
    * x Parent context only
    * x Add child context for aggregates
  * x Filters => child context only
  * x Formatters - these are structural formatters (e.g. hyperlinks, number format)
  * x Relations
  * x Sorters => child context only
  * x Stylers
* x Relation expressions should be able to filter on edge type and node type
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
* x Change sample-view.ts to use TreeDefinition instead of CompiledTreeDefinition
* x .filter might become an array
* x Introduce an editable RowSpec
  * x A RowDefinition is a compiled RowSpec
* Figure out original intent for formatter signature
* Look into vm2 (https://www.npmjs.com/package/vm2)
* x Look into expression-eval (https://www.npmjs.com/package/expression-eval)

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


https://www.google.com/search?q=javascript+import+returns+type+module+__esmodule&rlz=1C1GCEU_enUS825US825&sxsrf=ALiCzsbPHZkz60bhegQZ4OlWbwuNj1tHWA%3A1664224225443&ei=4QsyY5vcGqSG0PEPxNuYkAg&oq=javascript+import+returns+type+module+__esmodu&gs_lcp=Cgdnd3Mtd2l6EAMYADIFCCEQoAEyBQghEKABMgUIIRCgAToKCAAQRxDWBBCwAzoFCCEQqwI6CAghEB4QFhAdOgcIIRCgARAKSgQIQRgASgQIRhgAULQEWI8tYO07aAJwAXgAgAFniAH2BpIBAzguMpgBAKABAcgBCLgBA8ABAQ&sclient=gws-wiz

https://stackoverflow.com/questions/69041454/error-require-of-es-modules-is-not-supported-when-importing-node-fetch
https://stackoverflow.com/questions/69200697/why-does-typescript-allow-me-to-import-dependencies-it-cant-use-at-runtime
https://stackoverflow.com/questions/41219542/how-to-import-js-modules-into-typescript-file


## Problem importing jsepObject

Works fine in insight-lib console apps.
Imports as an ES module in insight-demo. This leads to an invalid jsep plugin error.

// const jsepObject = require("@jsep-plugin/object");
// const jsepObject = require('./jsep-object');
// import * as jsepObject from './jsep-object';
// import * as jsepObject from module('./jsep-object');
// const fetch = (...args) =>
//   import('node-fetch').then(({default: fetch}) => fetch(...args));

// https://stackoverflow.com/questions/69041454/error-require-of-es-modules-is-not-supported-when-importing-node-fetch
// const jsepObject = (...args: any[]) =>
//   import('@jsep-plugin/object').then(({default: jsepObject}) =>
//     jsepObject(...args);
//   );


tsconfig.json
~~~
{
  "extends": "./node_modules/gts/tsconfig-google.json",
  "compilerOptions": {
    "rootDir": ".",
    "outDir": "build",
    "allowJs": true,
    "checkJs": false
  },
  // "esModuleInterop": true,
  // "module": "esnext",
  // "moduleResolution": "node",
  // "isolatedModules": true,
  "include": [
    "src/**/*.ts",
    "src/**/*.js",
    "test/**/*.ts"
  ]
}
~~~
