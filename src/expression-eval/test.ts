///////////////////////////////////////////////////////////////////////////////
// This is a fork of test.ts from the expression-eval npm package.
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

import * as expr from './expression-eval';

type Fixture = {expr: string; expected: any};

const fixtures2: Fixture[] = [
  {expr: '{color: "red"}', expected: {color: 'red'}},
];
const fixtures: Fixture[] = [
  // array expression
  {expr: '([1,2,3])[0]', expected: 1},
  {expr: '(["one","two","three"])[1]', expected: 'two'},
  {expr: '([true,false,true])[2]', expected: true},
  {expr: '([1,true,"three"]).length', expected: 3},
  {expr: 'isArray([1,2,3])', expected: true},
  {expr: 'list[3]', expected: 4},
  {expr: 'numMap[1 + two]', expected: 'three'},

  // binary expression
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

  // call expression
  {expr: 'func(5)', expected: 6},
  {expr: 'func(1+2)', expected: 4},

  // conditional expression
  {expr: '(true ? "true" : "false")', expected: 'true'},
  {expr: '( ( bool || false ) ? "true" : "false")', expected: 'true'},
  {expr: '( true ? ( 123*456 ) : "false")', expected: 123 * 456},
  {expr: '( false ? "true" : one + two )', expected: 3},

  // identifier
  {expr: 'string', expected: 'string'},
  {expr: 'number', expected: 123},
  {expr: 'bool', expected: true},

  // literal
  {expr: '"foo"', expected: 'foo'}, // string literal
  {expr: "'foo'", expected: 'foo'}, // string literal
  {expr: '123', expected: 123}, // numeric literal
  {expr: 'true', expected: true}, // boolean literal

  // logical expression
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

  // logical expression lazy evaluation
  {expr: 'true || throw()', expected: true},
  {expr: 'false || true', expected: true},
  {expr: 'false && throw()', expected: false},
  {expr: 'true && false', expected: false},

  // member expression
  {expr: 'foo.bar', expected: 'baz'},
  {expr: 'foo["bar"]', expected: 'baz'},
  {expr: 'foo[foo.bar]', expected: 'wow'},

  // call expression with member
  {expr: 'foo.func("bar")', expected: 'baz'},

  // unary expression
  {expr: '-one', expected: -1},
  {expr: '+two', expected: 2},
  {expr: '!false', expected: true},
  {expr: '!!true', expected: true},
  {expr: '~15', expected: -16},
  {expr: '+[]', expected: 0},

  // 'this' context
  {expr: 'this.three', expected: 3},

  // Reenable this test once integrated with Jest
  // // Object literals
  // {expr: '{color: "red"}', expected: {color: 'red'}},
];

const context: expr.Context = {
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

for (const fixture of fixtures) {
  const val = expr.compile(fixture.expr)(context);
  if (val !== fixture.expected) {
    console.log(`Error: ${fixture.expr} (${val}) === ${fixture.expected}`);
  } else {
    console.log(`OK: ${fixture.expr} (${val}) === ${fixture.expected}`);
  }
}

function expectThrows(expression: string, context: any, error: string): void {
  try {
    const val = expr.compile(expression)({locals: {fields: context}});
    console.log(`Error: expected throw evaluating "${expression}"`);
  } catch (e: any) {
    const re = /Access to member "(\w+)" disallowed/;
    const matches = String(e.message).match(re);
    if (!matches) {
      console.log(matches);
      console.log(
        `Error: incorrect error evaluating "${expression}". Found "${e.message}".`
      );
    } else {
      console.log(
        `OK: expected throw evaluating "${expression}", message="${e.message}"`
      );
    }
  }
}

expectThrows(`o.__proto__`, {o: {}}, '.__proto__');
expectThrows(`o.prototype`, {o: {}}, 'prototype');
expectThrows(`o.constructor`, {o: {}}, '.constructor');
expectThrows(`o['__proto__']`, {o: {}}, '["__proto__"]');
expectThrows(`o['prototype']`, {o: {}}, '["prototype"]');
expectThrows(`o['constructor']`, {o: {}}, '["constructor"]');
expectThrows(`o[p]`, {o: {}, p: '__proto__'}, '[~__proto__]');
expectThrows(`o[p]`, {o: {}, p: 'prototype'}, '[~prototype]');
expectThrows(`o[p]`, {o: {}, p: 'constructor'}, '[~constructor]');
