///////////////////////////////////////////////////////////////////////////////
// This is a fork of test.ts from the expression-eval npm package.
// https://github.com/donmccurdy/expression-eval/commit/698342fabcee7a1a0f6f031ec3a014a28e1613b5
// After the fork, the code was modified to run with the jest testing framework.
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

import {compile, Context} from '../../src/expression-eval/index';

// Context in which test case expressions will be evaluated.
const context: Context = {
  locals: {
    fields: {
      string: 'string',
      number: 123,
      bool: true,
      one: 1,
      two: 2,
      three: 3,
      foo: {
        bar: 'baz',
        baz: 'wow',
        func: function (x: any) {
          return (this as any)[x];
        },
      },
      numMap: {10: 'ten', 3: 'three'},
      list: [1, 2, 3, 4, 5],
      func: function (x: any) {
        return x + 1;
      },
      isArray: Array.isArray,
      throw: () => {
        throw new Error('Should not be called.');
      },
    },
  },
};

type Fixture = {expr: string; expected: any};

interface Group {
  description: string;
  fixtures: Fixture[];
}

const fixtures: Group[] = [
  {
    description: 'array expression',
    fixtures: [
      {expr: '([1,2,3])[0]', expected: 1},
      {expr: '(["one","two","three"])[1]', expected: 'two'},
      {expr: '([true,false,true])[2]', expected: true},
      {expr: '([1,true,"three"]).length', expected: 3},
      {expr: 'isArray([1,2,3])', expected: true},
      {expr: 'list[3]', expected: 4},
      {expr: 'numMap[1 + two]', expected: 'three'},
    ],
  },
  {
    description: 'binary expression',
    fixtures: [
      {expr: '1+2', expected: 3},
      {expr: '2-1', expected: 1},
      {expr: '2*2', expected: 4},
      {expr: '6/3', expected: 2},
      {expr: '5|3', expected: 7},
      {expr: '5&3', expected: 1},
      {expr: '5^3', expected: 6},
      {expr: '4<<2', expected: 16},
      {expr: '256>>4', expected: 16},
      {expr: '-14>>>2', expected: 1073741820},
      {expr: '10%6', expected: 4},
      {expr: '"a"+"b"', expected: 'ab'},
      {expr: 'one + three', expected: 4},
    ],
  },
  {
    description: 'call expression',
    fixtures: [
      {expr: 'func(5)', expected: 6},
      {expr: 'func(1+2)', expected: 4},
    ],
  },
  {
    description: 'conditional expression',
    fixtures: [
      {expr: '(true ? "true" : "false")', expected: 'true'},
      {expr: '( ( bool || false ) ? "true" : "false")', expected: 'true'},
      {expr: '( true ? ( 123*456 ) : "false")', expected: 123 * 456},
      {expr: '( false ? "true" : one + two )', expected: 3},
    ],
  },
  {
    description: 'identifier',
    fixtures: [
      {expr: 'string', expected: 'string'},
      {expr: 'number', expected: 123},
      {expr: 'bool', expected: true},
    ],
  },
  {
    description: 'literal',
    fixtures: [
      {expr: '"foo"', expected: 'foo'}, // string literal
      {expr: "'foo'", expected: 'foo'}, // string literal
      {expr: '123', expected: 123}, // numeric literal
      {expr: 'true', expected: true}, // boolean literal
    ],
  },
  {
    description: 'logical expression',
    fixtures: [
      {expr: 'true || false', expected: true},
      {expr: 'true && false', expected: false},
      {expr: '1 == "1"', expected: true},
      {expr: '2 != "2"', expected: false},
      {expr: '1.234 === 1.234', expected: true},
      {expr: '123 !== "123"', expected: true},
      {expr: '1 < 2', expected: true},
      {expr: '1 > 2', expected: false},
      {expr: '2 <= 2', expected: true},
      {expr: '1 >= 2', expected: false},
    ],
  },
  {
    description: 'logical expression lazy evaluation',
    fixtures: [
      {expr: 'true || throw()', expected: true},
      {expr: 'false || true', expected: true},
      {expr: 'false && throw()', expected: false},
      {expr: 'true && false', expected: false},
    ],
  },
  {
    description: 'member expression',
    fixtures: [
      {expr: 'foo.bar', expected: 'baz'},
      {expr: 'foo["bar"]', expected: 'baz'},
      {expr: 'foo[foo.bar]', expected: 'wow'},
    ],
  },
  {
    description: ' call expression with member',
    fixtures: [{expr: 'foo.func("bar")', expected: 'baz'}],
  },
  {
    description: 'unary expression',
    fixtures: [
      {expr: '-one', expected: -1},
      {expr: '+two', expected: 2},
      {expr: '!false', expected: true},
      {expr: '!!true', expected: true},
      {expr: '~15', expected: -16},
      {expr: '+[]', expected: 0},
    ],
  },
  {
    description: "'this' context",
    fixtures: [{expr: 'this.three', expected: 3}],
  },
  {
    description: 'object literals',
    fixtures: [{expr: '{color: "red"}', expected: {color: 'red'}}],
  },
];

fixtures.forEach(({description, fixtures}) => {
  describe(description, () => {
    fixtures.forEach(({expr, expected}) => {
      test(`${expr} === ${expected}`, () => {
        expect(compile(expr)(context)).toEqual(expected);
      });
    });
  });
});

const fixtures2 = [
  {expr: 'o.__proto__', context: {o: {}}, error: '.__proto__'},
  {expr: 'o.prototype', context: {o: {}}, error: 'prototype'},
  {expr: 'o.constructor', context: {o: {}}, error: '.constructor'},
  {expr: "o['__proto__']", context: {o: {}}, error: '["__proto__"]'},
  {expr: "o['prototype']", context: {o: {}}, error: '["prototype"]'},
  {expr: "o['constructor']", context: {o: {}}, error: '["constructor"]'},
  {expr: 'o[p]', context: {o: {}, p: '__proto__'}, error: '[~__proto__]'},
  {expr: 'o[p]', context: {o: {}, p: 'prototype'}, error: '[~prototype]'},
  {expr: 'o[p]', context: {o: {}, p: 'constructor'}, error: '[~constructor]'},
];

describe('parse errors', () => {
  fixtures2.forEach(({expr, context}) => {
    test(`${expr} throws`, () => {
      expect(() => compile(expr)({locals: {fields: context}})).toThrow();
      // TODO: verify error message.
    });
  });
});
