import {
  alt,
  apply,
  buildLexer,
  expectEOF,
  expectSingleResult,
  opt,
  rule,
  seq,
  tok,
  Token,
} from 'typescript-parsec';

/**
 * This is an example regex for the string form of a business date. The parser
 * is more liberal, in that it also supports swapping the order of the year and
 * year part.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;

/**
 * Business date years can be expressed in calendar years or Microsoft fiscal
 * years, which start in July.
 *
 * The enum order must remain stable. It is used in lookup tables.
 */
export enum YearKind {
  /** Calendar Year */
  CY,

  /** Microsoft Fiscal Year */
  FY,

  /** To Be Determined - the responsible party is working on a date */
  TBD,

  /** the state is not known; it's not even TBD */
  Unknown,
}

/**
 * Business dates can be described with resolution from whole years to
 * specific months.
 *
 * The enum order must remain stable. It is used in lookup tables and
 * parsing. New enum values should be added to the end.
 */
export enum YearPart {
  Year,
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
  None,
}

/**
 * en-US display strings for YearPart
 *
 * The elements in partStr must remain aligned with the elements in YearPart.
 */
const partStr = [
  'Year',
  'H1',
  'H2',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'None',
];

/**
 * enum used to specify transformations in private methods
 */
enum Resolution {
  Half,
  Month,
  Quarter,
  Year,
}

/**
 * Lookup table for YearParts from month and YearKind
 *
 * PartsTable is indexable by
 * [month - 1: number][YearKind.CY|FY][Resolution]
 */
const PartsTable = [
  [
    [YearPart.H1, YearPart.Jan, YearPart.Q1, YearPart.Year],
    [YearPart.H2, YearPart.Jan, YearPart.Q3, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Feb, YearPart.Q1, YearPart.Year],
    [YearPart.H2, YearPart.Feb, YearPart.Q3, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Mar, YearPart.Q1, YearPart.Year],
    [YearPart.H2, YearPart.Mar, YearPart.Q3, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Apr, YearPart.Q2, YearPart.Year],
    [YearPart.H2, YearPart.Apr, YearPart.Q4, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.May, YearPart.Q2, YearPart.Year],
    [YearPart.H2, YearPart.May, YearPart.Q4, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Jun, YearPart.Q2, YearPart.Year],
    [YearPart.H2, YearPart.Jun, YearPart.Q4, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Jul, YearPart.Q3, YearPart.Year],
    [YearPart.H1, YearPart.Jul, YearPart.Q1, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Aug, YearPart.Q3, YearPart.Year],
    [YearPart.H1, YearPart.Aug, YearPart.Q1, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Sep, YearPart.Q3, YearPart.Year],
    [YearPart.H1, YearPart.Sep, YearPart.Q1, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Oct, YearPart.Q4, YearPart.Year],
    [YearPart.H1, YearPart.Oct, YearPart.Q2, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Nov, YearPart.Q4, YearPart.Year],
    [YearPart.H1, YearPart.Nov, YearPart.Q2, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Dec, YearPart.Q4, YearPart.Year],
    [YearPart.H1, YearPart.Dec, YearPart.Q2, YearPart.Year],
  ],
];

/**
 * Supports common 'FY22 H1'-style date formats
 *
 * Deliverables and other business concepts in Microsoft are frequently
 * associated with business dates, like 'FY2023 Q1' or 'CY2022 Nov'. BizDate
 * provides forgiving parsing of common string representations, creates
 * canonical string representations, and uses a common internal representation
 * to allow comparison of any two BizDates.
 *
 * For purposes of comparing BizDates, each year part is mapped to the final
 * month in that year part.
 */
export class BizDate {
  private year: YearKind;
  private part: YearPart;

  // BizDate uses calendar year values internally to support efficient
  // comparison.
  private calendarYear: number;
  private calendarMonth: number;
  private comp: number;

  /**
   * Creates a new BizDate
   *
   * If `year` is less than 100, the constructor adds 2000 to `year`.
   *
   * @param kind fiscal year, calendar year, tbd, or unknown
   * @param year the year in the context of the kind
   * @param part the part of the year
   *
   * @throws Error, if `year` < 1 or `year` > 9999
   */
  constructor(
    kind: YearKind,
    year: number = new Date().getUTCFullYear(),
    part: YearPart = YearPart.Year
  ) {
    this.year = kind;
    const vYear = validateYear(year);
    if (kind === YearKind.CY || kind === YearKind.FY) {
      this.part = part;
      this.calendarMonth = calendarMonthFor(kind, part);
      if (kind === YearKind.CY) {
        this.calendarYear = vYear;
      } else {
        this.calendarYear = fiscalToCalendarYear(vYear, this.calendarMonth);
      }
    } else {
      // TBD || Unknown
      this.part = YearPart.None;
      this.calendarYear = 9999;
      this.calendarMonth = 12;
    }
    this.comp = this.calendarYear * 100 + this.calendarMonth;
  }

  /**
   * @returns a semi-opaque number that can be used for simple comparison
   */
  comparable(): number {
    return this.comp;
  }

  /**
   * @returns -1, 0, or 1, depending on if `this` is before, the same month as,
   *          or after `to`
   */
  compare(to: BizDate): number {
    const c = this.comp - to.comp;
    if (c === 0) {
      return 0;
    } else if (c < 0) {
      return -1;
    } else {
      return 1;
    }
  }

  /**
   * @returns true if this BizDate and date have the same representation and
   *          would produce the same canonical string
   */
  equals(date: BizDate): boolean {
    if (
      this.year === date.year &&
      this.part === date.part &&
      this.calendarYear === date.calendarYear &&
      this.calendarMonth === date.calendarMonth
    ) {
      return true;
    }
    return false;
  }

  /**
   * @returns true if this BizDate is after date
   */
  isAfter(date: BizDate): boolean {
    return this.compare(date) > 0;
  }

  /**
   * @returns true if this BizDate is before date
   */
  isBefore(date: BizDate): boolean {
    return this.compare(date) < 0;
  }

  /**
   * @returns true if this BizDate is the same calendar year and month as date
   */
  isSameMonth(date: BizDate): boolean {
    return this.comp === date.comp;
  }

  /**
   * @returns this BizDate transformed into a calendar year BizDate
   */
  toCalendarYear(): BizDate {
    if (this.year === YearKind.FY) {
      return new BizDate(
        YearKind.CY,
        this.calendarYear,
        reverseYearPart(this.part)
      );
    } else {
      return this;
    }
  }

  /**
   * @returns this BizDate transformed into a fiscal year BizDate
   */
  toFiscalYear(): BizDate {
    if (this.year === YearKind.CY) {
      return new BizDate(
        YearKind.FY,
        calenderToFiscalYear(this.calendarYear, this.calendarMonth),
        reverseYearPart(this.part)
      );
    } else {
      return this;
    }
  }

  /**
   * @returns this BizDate mapped into H1 or H2
   */
  toHalf(): BizDate {
    return this.toResolution(Resolution.Half);
  }

  /**
   * @returns this BizDate mapped to a specific month
   */
  toMonth(): BizDate {
    return this.toResolution(Resolution.Month);
  }

  /**
   * Maps this BizDate to a specific YearPart resolution
   *
   * `toResolution` and the methods that depend on it are lossy in that the
   * resulting BizDates have calendar months mapped to the new resolution,
   * always in the final month of the specified year part.
   *
   * @param resolution year, half, quarter, or month
   * @returns this BizDate mapped to a specific year part
   */
  private toResolution(resolution: Resolution): BizDate {
    if (this.year === YearKind.CY || this.year === YearKind.FY) {
      return new BizDate(
        this.year,
        calendarTo(this.year, this.calendarYear, this.calendarMonth),
        yearPartFor(this.year, this.calendarMonth, resolution)
      );
    } else {
      return this;
    }
  }

  /**
   * @returns this BizDate mapped into Q1, Q2, Q3, or Q4
   */
  toQuarter(): BizDate {
    return this.toResolution(Resolution.Quarter);
  }

  /**
   * @returns canonical string format for this BizDate
   */
  toString(): string {
    switch (this.year) {
      case YearKind.TBD:
        return 'TBD';
      case YearKind.CY:
        if (this.part === YearPart.Year || this.part === YearPart.None) {
          return `CY${this.calendarYear}`;
        } else {
          return `CY${this.calendarYear} ${partStr[this.part]}`;
        }
      case YearKind.FY:
        if (this.part === YearPart.Year || this.part === YearPart.None) {
          return `FY${calenderToFiscalYear(
            this.calendarYear,
            this.calendarMonth
          )}`;
        } else {
          return `FY${calenderToFiscalYear(
            this.calendarYear,
            this.calendarMonth
          )} ${partStr[this.part]}`;
        }
      default:
        return 'Unknown';
    }
  }

  /**
   * @returns this BizDate mapped only to a year
   */
  toYear(): BizDate {
    return this.toResolution(Resolution.Year);
  }
}

/**
 * Parses a string in the form 'FY2023 Q1' or 'CY22 Sep'
 *
 * @param str the string to parse
 * @returns a BizDate that matches the string description
 *
 * @throws Error, if the parse fails
 */
export function parseBizDate(str: string): BizDate {
  return parse(str);
}

/**
 * @returns a TBD BizDate
 */
export function tbd(): BizDate {
  return new BizDate(YearKind.TBD);
}

/**
 * Creates a BizDate for the current half, UTC
 *
 * @param yearKind calendar year or fiscal year
 * @returns a BizDate representing the current half
 */
export function thisHalf(yearKind = YearKind.CY): BizDate {
  return thisMonth(yearKind).toHalf();
}

/**
 * Creates a BizDate for the current quarter, UTC
 *
 * @param yearKind calendar year or fiscal year
 * @returns a BizDate representing the current quarter
 */
export function thisQuarter(yearKind = YearKind.CY): BizDate {
  return thisMonth(yearKind).toQuarter();
}

/**
 * Creates a BizDate for the current month, UTC
 *
 * @param yearKind calendar year or fiscal year
 * @returns a BizDate representing the current month
 */
export function thisMonth(yearKind = YearKind.CY): BizDate {
  if (yearKind === YearKind.TBD) {
    return tbd();
  }
  if (yearKind === YearKind.Unknown) {
    return unknown();
  }

  const dateNow = new Date();
  const yearNow = dateNow.getUTCFullYear();
  const monthNow = dateNow.getUTCMonth() + 1;
  return new BizDate(
    yearKind,
    calendarTo(yearKind, yearNow, monthNow),
    yearPartFor(yearKind, monthNow, Resolution.Month)
  );
}

/**
 * @returns an Unknown BizDate
 */
export function unknown(): BizDate {
  return new BizDate(YearKind.Unknown);
}

/**
 * Maps the pair of year kind and year part to the end month of the part
 *
 * @param kind CY,FY, TBD, or Unknown
 * @param part the specific part of the year
 * @returns the ordinal of the month in [1..12]
 */
function calendarMonthFor(kind: YearKind, part: YearPart): number {
  switch (part) {
    case YearPart.H1:
    case YearPart.Q2:
      return kind === YearKind.FY ? 12 : 6;
    case YearPart.Year:
    case YearPart.H2:
    case YearPart.Q4:
    case YearPart.None:
      return kind === YearKind.FY ? 6 : 12;
    case YearPart.Q1:
      return kind === YearKind.FY ? 9 : 3;
    case YearPart.Q3:
      return kind === YearKind.FY ? 3 : 9;
    default: // Month
      return part - 6;
  }
}

/**
 * Converts the year from calendar to fiscal or calendar
 *
 * @param kind the year kind to convert to
 * @param year the calendar year to convert
 * @param month the month of the year
 * @returns fiscal year, if kind is FY, otherwise year
 */
function calendarTo(kind: YearKind, year: number, month: number): number {
  if (kind === YearKind.FY) {
    return calenderToFiscalYear(year, month);
  } else {
    return year;
  }
}

/**
 * Converts the year from calendar to fiscal
 *
 * @param year the calendar year to convert
 * @param month the month of the year
 * @returns the fiscal year
 */
function calenderToFiscalYear(year: number, month: number): number {
  if (month > 6) {
    return year + 1;
  } else {
    return year;
  }
}

/**
 * Converts the year from fiscal to calendar
 *
 * @param year the calendar year to convert
 * @param month the month of the year
 * @returns the calendar year
 */
function fiscalToCalendarYear(year: number, month: number): number {
  if (month > 6) {
    return year - 1;
  } else {
    return year;
  }
}

/**
 * Maps year parts from calendar to fiscal and from fiscal to calendar
 *
 * Specific months, Year, and None are not converted.
 *
 * @param part the YearPart to map
 * @returns the mapped YearPart
 */
function reverseYearPart(part: YearPart): number {
  switch (part) {
    case YearPart.H1:
      return YearPart.H2;
    case YearPart.H2:
      return YearPart.H1;
    case YearPart.Q1:
      return YearPart.Q3;
    case YearPart.Q2:
      return YearPart.Q4;
    case YearPart.Q3:
      return YearPart.Q1;
    case YearPart.Q4:
      return YearPart.Q2;
    default:
      return part;
  }
}

/**
 * Validates that the year falls within a wide, but valid range
 *
 * `validateYear` also adds 2000 to values that are >0 and <100.
 *
 * @param year the year value to validate
 * @returns a number in the range [1..9999]
 *
 * @throws Error, if year < 1 or year > 9999s
 */
function validateYear(year: number): number {
  let y = Math.floor(year);
  if (y < 1) {
    throw new Error(`Years must be whole numbers: ${y}`);
  }
  if (y > 9999) {
    throw new Error(`Years must be less than 10,000: ${y}`);
  }
  y = y < 100 ? 2000 + y : y;
  return y;
}

/**
 * Maps a month to a specific year part
 *
 * @param year CY, FY, TBD, or Unknown
 * @param month the month ordinal in [1..12]
 * @param res the YearPart resolution
 * @returns the specified YearPart
 */
function yearPartFor(year: YearKind, month: number, res: Resolution): YearPart {
  if (year === YearKind.TBD || year === YearKind.Unknown) {
    return YearPart.None;
  }
  return PartsTable[month - 1][year][res];
}

// ================================== Parser ==================================

// BizDate uses typescript-parsec for parsing.

// The order of tokens is arranged to align with the order of YearPart. This
// is convenient for dealing with month tokens. Any new tokens should be added
// to the end.
enum TokenKind {
  CY,
  FY,
  Half,
  Number,
  Quarter,
  TBD,
  Unknown,
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
  Space,
}

const DATE = rule<TokenKind, BizDate>();
const YEAR = rule<TokenKind, [YearKind, number]>();
const PART = rule<TokenKind, YearPart>();

function applyCY(
  value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
): [YearKind, number] {
  return [YearKind.CY, validateYear(+value[1].text)];
}

function applyDate(value: [[YearKind, number], YearPart | undefined]): BizDate {
  const part = value[1] === undefined ? YearPart.Year : value[1];
  return new BizDate(value[0][0], value[0][1], part);
}

function applyFY(
  value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
): [YearKind, number] {
  return [YearKind.FY, validateYear(+value[1].text)];
}

function applyHalf(
  value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
): YearPart {
  const n = +value[1].text;
  if (n < 1 || n > 2) {
    throw new Error(`There are two halves in a year: ${n}`);
  }
  return n; // YearPart[1..2]
}

function applyMonth(value: Token<any>): YearPart {
  return value.kind; // YearPart[7..18]
}

function applyQuarter(
  value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
): YearPart {
  const n = +value[1].text;
  if (n < 1 || n > 4) {
    throw new Error(`There are four quarters in a year: ${n}`);
  }
  return n + 2; // YearPart[3..6]
}

function applyReverse(value: [YearPart, [YearKind, number]]): BizDate {
  return applyDate([value[1], value[0]]);
}

function applyTBD(): BizDate {
  return new BizDate(YearKind.TBD, 9999, YearPart.None);
}

function applyUnknown(): BizDate {
  return new BizDate(YearKind.Unknown, 9999, YearPart.None);
}

const lexer = buildLexer([
  [true, /^CY/g, TokenKind.CY],
  [true, /^FY/g, TokenKind.FY],
  [true, /^\d{1,4}/g, TokenKind.Number],
  [true, /^H/g, TokenKind.Half],
  [true, /^Q/g, TokenKind.Quarter],
  [true, /^TBD/g, TokenKind.TBD],
  [true, /^Unknown/g, TokenKind.Unknown],
  [true, /^Jan/g, TokenKind.Jan],
  [true, /^Feb/g, TokenKind.Feb],
  [true, /^Mar/g, TokenKind.Mar],
  [true, /^Apr/g, TokenKind.Apr],
  [true, /^May/g, TokenKind.May],
  [true, /^Jun/g, TokenKind.Jun],
  [true, /^Jul/g, TokenKind.Jul],
  [true, /^Aug/g, TokenKind.Aug],
  [true, /^Sep/g, TokenKind.Sep],
  [true, /^Oct/g, TokenKind.Oct],
  [true, /^Nov/g, TokenKind.Nov],
  [true, /^Dec/g, TokenKind.Dec],
  [false, /^\s/g, TokenKind.Space],
]);

/*
DATE
  = YEAR (PART)?
  = PART YEAR
  = 'TBD'
  = 'UNKOWN'
*/
DATE.setPattern(
  alt(
    apply(seq(YEAR, opt(PART)), applyDate),
    apply(seq(PART, YEAR), applyReverse),
    apply(tok(TokenKind.TBD), applyTBD),
    apply(tok(TokenKind.Unknown), applyUnknown)
  )
);

/*
YEAR
  = CY(\d{4}|\d{2})
  = FY(\d{4}|\d{2})
*/
YEAR.setPattern(
  alt(
    apply(seq(tok(TokenKind.CY), tok(TokenKind.Number)), applyCY),
    apply(seq(tok(TokenKind.FY), tok(TokenKind.Number)), applyFY)
  )
);

/*
PART
  = [Month]
  = Half Number in [1..2]
  = Quarter Number in [1..4]
*/
PART.setPattern(
  alt(
    apply(tok(TokenKind.Jan), applyMonth),
    apply(tok(TokenKind.Feb), applyMonth),
    apply(tok(TokenKind.Mar), applyMonth),
    apply(tok(TokenKind.Apr), applyMonth),
    apply(tok(TokenKind.May), applyMonth),
    apply(tok(TokenKind.Jun), applyMonth),
    apply(tok(TokenKind.Jul), applyMonth),
    apply(tok(TokenKind.Aug), applyMonth),
    apply(tok(TokenKind.Sep), applyMonth),
    apply(tok(TokenKind.Oct), applyMonth),
    apply(tok(TokenKind.Nov), applyMonth),
    apply(tok(TokenKind.Dec), applyMonth),
    apply(seq(tok(TokenKind.Half), tok(TokenKind.Number)), applyHalf),
    apply(seq(tok(TokenKind.Quarter), tok(TokenKind.Number)), applyQuarter)
  )
);

function parse(expr: string): BizDate {
  return expectSingleResult(expectEOF(DATE.parse(lexer.parse(expr))));
}
