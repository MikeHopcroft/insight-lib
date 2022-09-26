///////////////////////////////////////////////////////////////////////////////
// This is a fork of the @jsep-plugin/object npm package.
// After the fork, the code was modified to support aggregate functions where
// parameters are evaluated in a child context.
//
// Code is from https://github.com/EricSmekens/jsep/commit/1a75d97754a6bca579cab1be6980890884604b0e
// Files:
//   https://github.com/EricSmekens/jsep/blob/master/packages/object/src/index.js
//   https://github.com/EricSmekens/jsep/blob/master/packages/object/types/tsd.d.ts
//
// After the fork, code was modified to be a Typescript module.
//
// Rationale for for was a work-around to import problems in packages using
// insight-lib.
//
///////////////////////////////////////////////////////////////////////////////

// Copyright (c) 2013 Stephen Oney, https://ericsmekens.github.io/jsep/
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

const OCURLY_CODE = 123; // {
const CCURLY_CODE = 125; // }
const OBJECT_EXP = 'ObjectExpression';
const PROPERTY = 'Property';

export const jsepObject = {
  name: 'object',

  init(jsep: any) {
    // Object literal support
    function gobbleObjectExpression(this:any, env:any) {
      if (this.code === OCURLY_CODE) {
        this.index++;
        const properties = [];

        while (!isNaN(this.code)) {
          this.gobbleSpaces();
          if (this.code === CCURLY_CODE) {
            this.index++;
            env.node = this.gobbleTokenProperty({
              type: OBJECT_EXP,
              properties,
            });
            return;
          }

          // Note: using gobbleExpression instead of gobbleToken to support object destructuring
          const key = this.gobbleExpression();
          if (!key) {
            break; // missing }
          }

          this.gobbleSpaces();
          if (
            key.type === jsep.IDENTIFIER &&
            (this.code === jsep.COMMA_CODE || this.code === CCURLY_CODE)
          ) {
            // property value shorthand
            properties.push({
              type: PROPERTY,
              computed: false,
              key,
              value: key,
              shorthand: true,
            });
          } else if (this.code === jsep.COLON_CODE) {
            this.index++;
            const value = this.gobbleExpression();

            if (!value) {
              this.throwError('unexpected object property');
            }
            const computed = key.type === jsep.ARRAY_EXP;
            properties.push({
              type: PROPERTY,
              computed,
              key: computed ? key.elements[0] : key,
              value: value,
              shorthand: false,
            });
            this.gobbleSpaces();
          } else if (key) {
            // spread, assignment (object destructuring with defaults), etc.
            properties.push(key);
          }

          if (this.code === jsep.COMMA_CODE) {
            this.index++;
          }
        }
        this.throwError('missing }');
      }
    }

    jsep.hooks.add('gobble-token', gobbleObjectExpression);
  },
} as any;

// import * as jsep from 'jsep';
import { Expression, IPlugin } from 'jsep';
// export const name: string;
// export function init(this: typeof jsep): void;

export interface ObjectExpression extends Expression {
	type: 'ObjectExpression';
	properties: Property[];
}

export interface Property extends Expression {
	type: 'Property';
	computed: boolean;
	key: Expression;
	shorthand: boolean;
	value?: Expression;
}

// declare const _export: IPlugin;
// export default _export;

