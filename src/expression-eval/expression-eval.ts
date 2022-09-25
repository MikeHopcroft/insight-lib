///////////////////////////////////////////////////////////////////////////////
// This is a fork of index.ts from the expression-eval npm package.
// https://github.com/donmccurdy/expression-eval/commit/698342fabcee7a1a0f6f031ec3a014a28e1613b5
// After the fork, the code was modified to support aggregate functions where
// parameters are evaluated in a child context.
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
// The MIT License (MIT)
//
// Copyright (c) 2017 Don McCurdy
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
///////////////////////////////////////////////////////////////////////////////

import * as jsep from 'jsep';
import {NodeFields} from '../store';

export interface ISymbols {
  get(name: string): any;
  isChildContextFunction(f: Function): boolean;
}

export interface ContextData {
  fields: NodeFields;
  children?: ContextData[];
}

export interface Context {
  globals?: ISymbols;
  context: ContextData;
}

/**
 * Evaluation code from JSEP project, under MIT License.
 * Copyright (c) 2013 Stephen Oney, http://jsep.from.so/
 */

// Default operator precedence from https://github.com/EricSmekens/jsep/blob/master/src/jsep.js#L55
const DEFAULT_PRECEDENCE = {
  '||': 1,
  '&&': 2,
  '|': 3,
  '^': 4,
  '&': 5,
  '==': 6,
  '!=': 6,
  '===': 6,
  '!==': 6,
  '<': 7,
  '>': 7,
  '<=': 7,
  '>=': 7,
  '<<': 8,
  '>>': 8,
  '>>>': 8,
  '+': 9,
  '-': 9,
  '*': 10,
  '/': 10,
  '%': 10,
};

const binops: {[key: string]: (a: any, b: any) => any} = {
  '||': function (a: any, b: any) {
    return a || b;
  },
  '&&': function (a: any, b: any) {
    return a && b;
  },
  '|': function (a: any, b: any) {
    return a | b;
  },
  '^': function (a: any, b: any) {
    return a ^ b;
  },
  '&': function (a: any, b: any) {
    return a & b;
  },
  '==': function (a: any, b: any) {
    return a == b;
  }, // jshint ignore:line
  '!=': function (a: any, b: any) {
    return a != b;
  }, // jshint ignore:line
  '===': function (a: any, b: any) {
    return a === b;
  },
  '!==': function (a: any, b: any) {
    return a !== b;
  },
  '<': function (a: any, b: any) {
    return a < b;
  },
  '>': function (a: any, b: any) {
    return a > b;
  },
  '<=': function (a: any, b: any) {
    return a <= b;
  },
  '>=': function (a: any, b: any) {
    return a >= b;
  },
  '<<': function (a: any, b: any) {
    return a << b;
  },
  '>>': function (a: any, b: any) {
    return a >> b;
  },
  '>>>': function (a: any, b: any) {
    return a >>> b;
  },
  '+': function (a: any, b: any) {
    return a + b;
  },
  '-': function (a: any, b: any) {
    return a - b;
  },
  '*': function (a: any, b: any) {
    return a * b;
  },
  '/': function (a: any, b: any) {
    return a / b;
  },
  '%': function (a: any, b: any) {
    return a % b;
  },
};

const unops: {[key: string]: (a: any) => any} = {
  '-': function (a: any) {
    return -a as any;
  },
  '+': function (a: any) {
    return +a as any;
  },
  '~': function (a: any) {
    return ~a as any;
  },
  '!': function (a: any) {
    return !a as any;
  },
};

declare type operand = number | string;
// declare type unaryCallback = (a: operand) => operand;
// declare type binaryCallback = (a: operand, b: operand) => operand;

type AnyExpression =
  | jsep.ArrayExpression
  | jsep.BinaryExpression
  | jsep.CallExpression
  | jsep.ConditionalExpression
  | jsep.Identifier
  | jsep.Literal
  // | jsep.LogicalExpression (was in jsep@0.0.3. Not in jsep@1.3.7.)
  | jsep.MemberExpression
  | jsep.ThisExpression
  | jsep.UnaryExpression;

function evaluateArray(list: any, context: Context) {
  return list.map(function (v: any) {
    return evaluate(v, context);
  });
}

function evaluateMember(node: jsep.MemberExpression, context: Context) {
  const object: any = evaluate(node.object, context);
  let key: string;
  if (node.computed) {
    key = evaluate(node.property, context);
  } else {
    key = (node.property as jsep.Identifier).name;
  }
  if (/^__proto__|prototype|constructor$/.test(key)) {
    throw Error(`Access to member "${key}" disallowed.`);
  }
  return [object, object[key]];
}

function evaluate(_node: jsep.Expression, context: Context): any {
  const node = _node as AnyExpression;

  switch (node.type) {
    case 'ArrayExpression':
      return evaluateArray(node.elements, context);

    case 'BinaryExpression':
      // TODO: evaluate this code block moved from logical expression
      if (node.operator === '||') {
        return evaluate(node.left, context) || evaluate(node.right, context);
      } else if (node.operator === '&&') {
        return evaluate(node.left, context) && evaluate(node.right, context);
      }
      return binops[node.operator](
        evaluate(node.left, context),
        evaluate(node.right, context)
      );

    case 'CallExpression':
      let caller, fn, assign;
      if (node.callee.type === 'MemberExpression') {
        assign = evaluateMember(node.callee as jsep.MemberExpression, context);
        caller = assign[0];
        fn = assign[1];
      } else {
        fn = evaluate(node.callee, context);
      }
      if (typeof fn !== 'function') {
        return undefined;
      }
      if (context.globals && context.globals.isChildContextFunction(fn)) {
        return fn.apply(caller, [context, (context: Context) => {
          return evaluateArray(node.arguments, context);
        }]);
      } else {
        return fn.apply(caller, evaluateArray(node.arguments, context));
      }

    case 'ConditionalExpression':
      return evaluate(node.test, context)
        ? evaluate(node.consequent, context)
        : evaluate(node.alternate, context);

    case 'Identifier':
      return (
        (context.globals && context.globals.get(node.name)) ||
        context.context.fields[node.name]
      );

    case 'Literal':
      return node.value;

    // jsep.LogicalExpression was in jsep@0.0.3. Not in jsep@1.3.7.
    // case 'LogicalExpression':
    //   if (node.operator === '||') {
    //     return evaluate(node.left, context) || evaluate(node.right, context);
    //   } else if (node.operator === '&&') {
    //     return evaluate(node.left, context) && evaluate(node.right, context);
    //   }
    //   return binops[node.operator](evaluate(node.left, context), evaluate(node.right, context));

    case 'MemberExpression':
      return evaluateMember(node, context)[1];

    case 'ThisExpression':
      return context;

    case 'UnaryExpression':
      return unops[node.operator](evaluate(node.argument, context));

    default:
      return undefined;
  }
}

function compile(
  expression: string | jsep.Expression
): (context: Context) => any {
  return evaluate.bind(null, jsep(expression));
}

export {jsep as parse, evaluate as eval, compile};
