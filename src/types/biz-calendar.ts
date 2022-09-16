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
 * This is an example regex for the string form of a business period. The parser
 * is more liberal, in that it also supports swapping the order of the year and
 * specific period and ignores extraneous spaces.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;
  
/**
 * Business period years can be expressed in calendar years or fiscal
 * years. They can also represent dates that are to be determined or
 * unknown.
 */
enum YearKind {
  /** Calendar Year */
  CY,

  /** Microsoft Fiscal Year */
  FY,
}
  
/**
 * en-US display strings for calendar months
 */
const months = [
  'Month',
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
];

export interface IPeriod {
  contains(date: IPeriod): boolean;
  endsAfter(date: IPeriod): boolean;
  endsBefore(date: IPeriod): boolean;
  endsSameMonth(date: IPeriod): boolean;
  equals(date: IPeriod): boolean;
  getEndCalendarMonth(): number;
  getEndCalendarYear(): number;
  getEndFiscalMonth(): number;
  getEndFiscalYear(): number;
  getEndMonth(): Month;
  getFiscalYearStartMonth(): number;
  getStartCalendarMonth(): number;
  getStartCalendarYear(): number;
  getStartFiscalMonth(): number;
  getStartFiscalYear(): number;
  getStartMonth(): Month;
  isAfter(date: IPeriod): boolean;
  isBefore(date: IPeriod): boolean;
  isCalendarPeriod(): boolean;
  isFiscalPeriod(): boolean;
  startsAfter(date: IPeriod): boolean;
  startsBefore(date: IPeriod): boolean;
  startsSameMonth(date: IPeriod): boolean;
  toCalendar(): IPeriod;
  toFiscal(): IPeriod;
  toMonths(): Month[];
  toString(): string;
  getEndYearMonth(): number;
  getKind(): YearKind;
  getStartYearMonth(): number;
}
  
/**
 * Supports common 'FY22 H1'-style date formats
 *
 * Deliverables and other business concepts in Microsoft are frequently
 * associated with business periods, like 'FY2023 Q2' or 'CY22 Nov'.
 * Period provides forgiving parsing of common string representations,
 * creates canonical string representations, and uses a common internal
 * representation to allow comparison of any two BizPeriods.
 * 
 * Period uses compact calendar year values internally to support efficient
 * comparison between Periods.
 */
export class Period implements IPeriod {protected kind: YearKind;
  protected startYearMonth: number;
  protected endYearMonth: number;
  protected fiscalStartMonth: number;
  protected cachedString: string | undefined;

  /**
   * Creates a new Period
   * 
   * The expectation is that the parser will be used much more frequently
   * than this constructor. The constructor is designed to be used with the
   * year and period helper functions. They provide input validation and more
   * literate construction. The constructor will silently adjust inputs into
   * expected ranges where the helpers will throw Errors.
   * 
   * Examples:
   *    new Period(CY(2023), Sep())
   *    new Period(FY(2023), H(1))
   *    new Period(CY(28), Q(3), Apr())
   * 
   * Parser examples:
   *    parsePeriod('CY2023 Sep')
   *    parsePeriod('FY2023 H1')
   *    parsePeriod('CY28 Q3')
   *
   * Periods 
   * 
   * @param year the kind and year, use `CY()` and `FY()`
   * @param months start and end month ordinals, relative to the
   *        calendar or fiscal start, use `H()`, `Q()`, or the
   *        month-specifid functions 
   * @param fiscalYearStartMonth using a consistent `FYPeriodFactory`
   *        is safer than using this param directly
   */
  constructor(
    kind: YearKind = YearKind.CY,
    year: number = new Date().getUTCFullYear(),
    startMonthOrdinal: number = 1,
    endMonthOrdinal: number = 12,
    fiscalYearStartMonth: number = 7
  ) {
    this.kind = kind;
    this.fiscalStartMonth = checkMonth(fiscalYearStartMonth);
    const startYear = checkYear(year);
    const startMonth = checkMonth(startMonthOrdinal);
    const endMonth = checkMonth(endMonthOrdinal);
    const endYear = startMonth <= endMonth ? startYear : startYear + 1;

    if (kind === YearKind.FY) {
      this.startYearMonth = fiscalToCalendar(
        yearMonth(startYear, startMonth),
        this.fiscalStartMonth
      );
      this.endYearMonth = fiscalToCalendar(
        yearMonth(endYear, endMonth),
        this.fiscalStartMonth
      );
    } else {
      this.startYearMonth = yearMonth(startYear, startMonth);
      this.endYearMonth = yearMonth(endYear, endMonth);
    }
  }

  /**
   * @returns true if this Period includes all of the months in date
   */
  contains(date: IPeriod): boolean {
    if (
      this.startYearMonth <= date.getStartYearMonth() &&
      date.getEndYearMonth() <= this.endYearMonth
    ) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @returns true if this Period ends after date ends
   */
  endsAfter(date: IPeriod): boolean {
    if (this.endYearMonth > date.getEndYearMonth()) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @returns true if this Period ends before date starts
   */
  endsBefore(date: IPeriod): boolean {
    if (this.endYearMonth < date.getStartYearMonth()) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * @returns true if this Period ends the same calendar year and month
   *          as date
   */
  endsSameMonth(date: IPeriod): boolean {
    return this.endYearMonth === date.getEndYearMonth();
  }

  /**
   * @returns true if this Period and date have the same internal
   *          representation and would produce the same canonical string
   */
  equals(date: IPeriod): boolean {
    if (
      this.kind === date.getKind() &&
      this.startYearMonth === date.getStartYearMonth() &&
      this.endYearMonth === date.getEndYearMonth() &&
      this.fiscalStartMonth === date.getFiscalYearStartMonth()
    ) {
      return true;
    }
    return false;
  }

  /**
   * @returns the calendar month ordinal, in [1..12], associated with the end
   *          of this Period
   */
  getEndCalendarMonth(): number {
    return yearAndMonth(this.endYearMonth)[1];
  }

  /**
   * @returns the calendar year associated with the end of this Period
   */
  getEndCalendarYear(): number {
    return yearAndMonth(this.endYearMonth)[0];
  }

  /**
   * @returns the fiscal month ordinal, in [1..12], associated with the end of
   *          this Period
   */
  getEndFiscalMonth(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.endYearMonth), this.fiscalStartMonth
    )[1];
  }

  /**
   * @returns the fiscal year associated with the end of this Period
   */
  getEndFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.endYearMonth), this.fiscalStartMonth
    )[0];
  }
  
  /**
   * @returns the month associated with the end of this Period
   */
  getEndMonth(): Month {
    const [calYear, calMonth] = yearAndMonth(this.endYearMonth);
    return new Month(this.kind, calYear, calMonth, this.fiscalStartMonth);
  }

  /**
   * @returns the calendar month on which this Period's fiscal year starts,
   *          in [1..12]
   */
  getFiscalYearStartMonth(): number {
    return this.fiscalStartMonth;
  }

  /**
   * @returns the calendar month ordinal, in [1..12], associated with the start
   *          of this Period
   */
  getStartCalendarMonth(): number {
    return yearAndMonth(this.startYearMonth)[1];
  }
      
  /**
   * @returns the calendar year associated with the start of this BizPeriod
   */
  getStartCalendarYear(): number {
    return yearAndMonth(this.startYearMonth)[0];
  }

  /**
   * @returns the fiscal month ordinal, in [1..12], associated with the start of
   *          this Period
   */
   getStartFiscalMonth(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.startYearMonth), this.fiscalStartMonth
    )[1];
  }

  /**
   * @returns the fiscal year associated with the start of this Period
   */
  getStartFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.startYearMonth), this.fiscalStartMonth
    )[0];
  }

  /**
   * @returns the month associated with the start of this Period
   */
  getStartMonth(): Month {
    const [calYear, calMonth] = yearAndMonth(this.endYearMonth);
    return new Month(this.kind, calYear, calMonth, this.fiscalStartMonth);
  }

  /**
   * @returns true if this Period starts after date ends
   */
  isAfter(date: IPeriod): boolean {
    return this.startYearMonth > date.getEndYearMonth();
  }

  /**
   * @returns true if this Period ends before date starts
   */
  isBefore(date: IPeriod): boolean {
    return this.endYearMonth < date.getStartYearMonth();
  }

  /**
   * @returns true if this period is relative to a calendar year
   */
  isCalendarPeriod(): boolean {
    return this.kind === YearKind.CY;
  }

  /**
   * @returns true if this period is relative to a fiscal year
   */
  isFiscalPeriod(): boolean {
    return this.kind === YearKind.FY;
  }

  /**
   * @returns true if this Period starts after date ends
   */
  startsAfter(date: IPeriod): boolean {
    return this.startYearMonth > date.getStartYearMonth();
  }

  /**
   * @returns true if this Period starts before date starts
   */
  startsBefore(date: IPeriod): boolean {
    return this.startYearMonth < date.getStartYearMonth();
  }

  /**
   * @returns true if this Period starts the same calendar year and month
   *          as date
   */
  startsSameMonth(date: IPeriod): boolean {
    return this.startYearMonth === date.getStartYearMonth();
  }

  /**
   * @returns this Period transformed into a calendar year Period
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      const [startYear, startMonth] = yearAndMonth(this.startYearMonth);
      const [, endMonth] = yearAndMonth(this.endYearMonth);
      return new Period(
        YearKind.CY,
        startMonth,
        endMonth,
        this.fiscalStartMonth);
    } else {
      return this;
    }
  }

  /**
   * @returns this Period transformed into a fiscal year Period
   */
  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      const [startYear, startMonth] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        this.fiscalStartMonth
      );
      const [, endMonth] = calendarToFiscal(
        ...yearAndMonth(this.endYearMonth),
        this.fiscalStartMonth
      );
  
      return new Period(
        YearKind.FY,
        startYear,
        startMonth,
        endMonth,
        this.fiscalStartMonth);
    } else {
      return this;
    }
  }

  /**
   * @returns this BizDate mapped to a specific month
   */
  toMonths(): Period[] {
    return [new Period()];
  }

  /**
   * @returns canonical string format for this Period
   */
  toString(): string {
    const kindStr = this.isFiscalPeriod() ? 'FY': 'CY';
    const [fiscalYear, fiscalMonth] = calendarToFiscal(
      ...yearAndMonth(this.startYearMonth),
      this.fiscalStartMonth
    );

    
    return '';
  }

  getEndYearMonth(): number {
    return this.endYearMonth;
  }

  getKind(): YearKind {
    return this.kind;
  }

  getStartYearMonth(): number {
    return this.startYearMonth;
  }
}

export class Month extends Period implements IPeriod  {

}

export class Quarter extends Period implements IPeriod  {
  constructor(kind = YearKind.CY, year: number, quarter: number) {
    if (quarter < 1 || quarter > 4) {
      throw new Error(`There are four quarters in a year: ${quarter}`);
    }
    const endMonth = quarter * 3;
    const startMonth = endMonth - 2;
    super(kind, year, startMonth, endMonth);
  }

  toCalendar(): IPeriod {

  }

  toFiscal(): IPeriod {

  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }

    let pre = 'CY';
    let [year, month] = yearAndMonth(this.endYearMonth);
    if (this.isFiscalPeriod()) {
      pre = 'FY';
      [year, month] = calendarToFiscal(year, month, this.fiscalStartMonth);
    }
    this.cachedString = `${pre}${year} Q${month / 3}`
    return this.cachedString;
  }
}

export class Half extends Period implements IPeriod  {
  constructor(kind = YearKind.CY, year: number, half: number) {
    if (half < 1 || half > 2) {
      throw new Error(`There are two halves in a year: ${half}`);
    }
    const endMonth = half * 6;
    const startMonth = endMonth - 5;
    super(kind, year, startMonth, endMonth);
  }

  toCalendar(): IPeriod {

  }

  toFiscal(): IPeriod {

  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }

    let pre = 'CY';
    let [year, month] = yearAndMonth(this.endYearMonth);
    if (this.isFiscalPeriod()) {
      pre = 'FY';
      [year, month] = calendarToFiscal(year, month, this.fiscalStartMonth);
    }
    this.cachedString = `${pre}${year} H${month / 6}`
    return this.cachedString;
  }
}

export class Year extends Period implements IPeriod  {
  constructor(kind = YearKind.CY, year: number) {
    super(kind, year, 1, 12);
  }

  toCalendar(): IPeriod {

  }

  toFiscal(): IPeriod {

  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }
    if (this.isCalendarPeriod()) {
      this.cachedString = `CY${yearAndMonth(this.startYearMonth)[0]}`
    } else {
      this.cachedString = `FY${calendarToFiscal(...yearAndMonth(
        this.startYearMonth),
        this.fiscalStartMonth
      )[0]}`
    }
    return this.cachedString;
  }
}

export class TBD extends Period implements IPeriod {
 constructor(kind = YearKind.CY) {
    super(kind, 9999, 11, 11);
  }

  toCalendar(): IPeriod {
    return this;
  }

  toFiscal(): IPeriod {
    return this;
  }

  toString(): string {
    return 'TBD';
  }
}

export class Unknown extends Period implements IPeriod {
  constructor(kind = YearKind.CY) {
    super(kind, 9999, 12, 12);
  }

  toCalendar(): IPeriod {
    return this;
  }

  toFiscal(): IPeriod {
    return this;
  }

  toString(): string {
    return 'Unknown';
  }
}

export class PeriodParser {
  private fiscalYearStartMonth: number;

  constructor(fiscalYearStartMonth: number = 7) {
    if (1 > fiscalYearStartMonth && fiscalYearStartMonth > 12) {
      throw new Error(`${fiscalYearStartMonth} is not a month`);
    }
    this.fiscalYearStartMonth = fiscalYearStartMonth;
  }

  parse(str: string): IPeriod {
    let bp = parse(str);
    if (
      bp.isFiscalPeriod() &&
      bp.getFiscalYearStartMonth() != this.fiscalYearStartMonth
    ) {
      return bp.toFiscal();
    } else {
      return bp;
    }
  }
}

export function CY(year: number, func: (year: number, kind: YearKind) => IPeriod = Y): IPeriod {
  return func(YearKind.CY, year);
}

export function FY(year: number, func: (year: number, kind: YearKind) => IPeriod = Y): IPeriod {
  return func(YearKind.FY, year);
}

export function Jan(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 1);
}

export function Feb(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 2);
}

export function Mar(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 3);
}

export function Apr(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 4);
}

export function May(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 5);
}

export function Jun(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 6);
}

export function Jul(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 7);
}

export function Aug(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 8);
}

export function Sep(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 9);
}

export function Oct(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 10);
}

export function Nov(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 11);
}

export function Dec(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 12);
}

export function Q1(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 1);
}

export function Q2(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 2);
}

export function Q3(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 3);
}

export function Q4(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 4);
}

export function H1(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Half(kind, year, 1);
}

export function H2(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Half(kind, year, 2);
}

export function Y(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Year(kind, year);
}

export function NewMonth(ordinal: number): [number, number] {
  return [ordinal, ordinal];
}

/**
 * Parses a string in the form 'FY2023 Q1' or 'CY22 Sep'
 *
 * @param str the string to parse
 * @returns a BizDate that matches the string description
 *
 * @throws Error, if the parse fails
 */
export function parsePeriod(str: string): IPeriod {
  return parse(str);
}

/**
 * Creates a Period for the current half, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current half
 */
export function currentHalfPeriod(
    kind = YearKind.CY,
    fiscalYearStartMonth: number = 7
  ): IPeriod {
  return fromDate(kind, new Date(), 6, fiscalYearStartMonth)
}

/**
 * Creates a Period for the current month, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current month
 */
 export function currentMonthPeriod(
  kind = YearKind.CY,
  fiscalYearStartMonth: number = 7
): IPeriod {
  return fromDate(kind, new Date(), 1, fiscalYearStartMonth);
}

/**
 * Creates a Period for the current quarter, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current quarter
 */
export function thisQuarterPeriod(
  kind = YearKind.CY,
  fiscalYearStartMonth: number = 7
): IPeriod {
  return fromDate(kind, new Date(), 3, fiscalYearStartMonth);
}

/**
 * Creates a Period for the current year, UTC
 * 
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current year
 */
export function thisYearPeriod(
  kind = YearKind.CY,
  fiscalYearStartMonth: number = 7
): Period {
  const date = new Date();
  if (kind === YearKind.CY) {
    return new Year(kind, date.getUTCFullYear());
  } else {
    return new Year(kind, calendarToFiscal(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      fiscalYearStartMonth
    )[0]);
  }
}

/**
 * @param calendarYear the calendar year
 * @param calendarMonth the month ordinal, in [1..12]
 * @param fiscalStart the month ordinal, in [1..12], for the first month of the
 *        fiscal year relative to the calendar year
 * @returns the fiscal year and month
 */
function calendarToFiscal(
  calendarYear: number,
  calendarMonth: number,
  fiscalStart: number
): [number, number] {
  const fiscalYear = calendarMonth >= fiscalStart
    ? calendarYear + 1 
    : calendarYear;
  const fiscalMonth = (fiscalStart + calendarMonth - 2) % 12 + 1;
  return [fiscalYear, fiscalMonth];
}

function checkMonth(month: number): number {
  if (1 > month || month > 12) {
    throw new Error(`${month} is not a month`);
  }
  return month;
}

function checkYear(year: number): number {
  if (1 > year || year > 9999) {
    throw new Error(`${year} is not a valid year`)
  }
  if (year < 100) {
    return 2000 + year;
  } else {
    return year;
  }
}

/**
 * @param fiscalYearMonth the fiscal year and month ordinal, in [1..12], where
 *        1 is aligned with fiscalStart
 * @param fiscalStart the month ordinal, in [1..12], for the first month of the
 *        fiscal year relative to the calendar year 
 * @returns the calendar year and month
 */
 function fiscalToCalendar(fiscalYearMonth: number, fiscalStart: number): number {
  const [year, month] = yearAndMonth(fiscalYearMonth);
  const calendarYear = fiscalStart + month <= 13 ? year - 1 : year;
  const calendarMonth = (fiscalStart - 2 + month) % 12 + 1;
  return yearMonth(calendarYear, calendarMonth);
}

function yearAndMonth(yearMonth: number): [number, number] {
  return [Math.floor(yearMonth / 100), yearMonth % 100];
}

function yearMonth(year: number, month: number): number {
  return year * 100 + month;
}

// ================================== Parser ==================================

// Period uses typescript-parsec for parsing.

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

const MONTHS = [
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
]
const QUARTERS = [Q1, Q2, Q3, Q4];
 
const DATE = rule<TokenKind, IPeriod>();
const YEAR = rule<TokenKind, [
  (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
  number
]>();
const PART = rule<TokenKind, (year: number, kind: YearKind) => IPeriod>();

function applyCY(
  value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
):
  [
    (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
    number
  ]
{
  return [CY, +value[1].text];
}

function applyDate(value:
  [
    [
      (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
      number
    ],
    ((year: number, kind: YearKind) => IPeriod) | undefined
  ]
): IPeriod {
  let func = value[1] === undefined ? Y : value[1];
  return value[0][0](value[0][1], func);
}

function applyFY(
  value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
):
  [
    (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
    number
  ]
{
  return [FY, +value[1].text];
}

function applyHalf(
  value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
): (year: number, kind: YearKind) => IPeriod {
  const n = +value[1].text;
  if (n < 1 || n > 2) {
    throw new Error(`There are two halves in a year: ${n}`);
  }
  if (n == 1) {
    return H1;
  } else {
    return H2;
  }
}

function applyMonth(value: Token<any>)
  : (year: number, kind: YearKind) => IPeriod
{
  return MONTHS[value.kind - 7];
}

function applyQuarter(
  value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
): (year: number, kind: YearKind) => IPeriod {
  const n = +value[1].text;
  if (n < 1 || n > 4) {
    throw new Error(`There are four quarters in a year: ${n}`);
  }
  return QUARTERS[n - 1];
}

function applyReverse(value:
  [
    (year: number, kind: YearKind) => IPeriod,
    [
      (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
      number
    ]
  ]
): IPeriod {
  return applyDate([value[1], value[0]]);
}

function applyTBD(): Period {
  return new TBD();
}

function applyUnknown(): Period {
  return new Unknown();
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

function parse(expr: string): IPeriod {
  return expectSingleResult(expectEOF(DATE.parse(lexer.parse(expr))));
}
