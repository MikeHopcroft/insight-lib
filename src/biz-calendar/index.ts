/*
 * Supports common 'FY23 H1'-style date formats
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
 * specific period, ignores extraneous spaces, and handles ranges.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;

// Exported explicitly and in rough order of conceptual importance
export {parsePeriod} from './parser';
export {
  IPeriod,
  PeriodConfig,
  DivisionGranularity,
  Halves,
  Months,
  Quarters,
  Years,
} from './interface';
export {
  CY,
  FY,
  Y,
  H1,
  H2,
  Q1,
  Q2,
  Q3,
  Q4,
  Jan,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec,
  Range,
  TBD,
  Unknown,
  currentHalf,
  currentMonth,
  currentQuarter,
  currentYear,
} from './construction';
