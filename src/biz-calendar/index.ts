/*
 * Supports common 'FY22 H1'-style date formats
 *
 * Deliverables and other business concepts in Microsoft are frequently
 * associated with business periods, like 'FY2023 Q2' or 'CY22 Nov'.
 * biz-calendar provides forgiving parsing of common string representations,
 * creates canonical string representations, and uses a common internal
 * representation to allow comparison of any twovPeriods.
 */

/**
 * This is an example regex for the string form of a business period. The parser
 * is more liberal, in that it also supports swapping the order of the year and
 * specific period and ignores extraneous spaces.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;

export * from './construction';
export * from './interface';
export * from './parser';
