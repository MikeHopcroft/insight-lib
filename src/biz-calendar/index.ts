/**
 * This is an example regex for the string form of a business period. The parser
 * is more liberal, in that it also supports swapping the order of the year and
 * specific period and ignores extraneous spaces.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;

export {
  TBD,
  Unknown,
} from './core';
export * from './construction'
export * from './interface'
export * from './parser'
