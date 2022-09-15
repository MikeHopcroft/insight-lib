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
   * years.
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
   * en-US display strings for Period along with period lengths and
   * end months relative to the start month
   */
  const periodInfo = [
    { str: 'None', len: 0, end: 0},
    { str: 'Jan', len: 1, end: 1},
    { str: 'Feb', len: 1, end: 2},
    { str: 'Mar', len: 1, end: 3},
    { str: 'Apr', len: 1, end: 4},
    { str: 'May', len: 1, end: 5},
    { str: 'Jun', len: 1, end: 6},
    { str: 'Jul', len: 1, end: 7},
    { str: 'Aug', len: 1, end: 8},
    { str: 'Sep', len: 1, end: 9},
    { str: 'Oct', len: 1, end: 10},
    { str: 'Nov', len: 1, end: 11},
    { str: 'Dec', len: 1, end: 12},
    { str: 'Q1', len: 2, end: 3},
    { str: 'Q2', len: 2, end: 6},
    { str: 'Q3', len: 2, end: 9},
    { str: 'Q4', len: 2, end: 12},
    { str: 'H1', len: 4, end: 6},
    { str: 'H2', len: 4, end: 12},
    { str: 'Year', len: 12, end: 12},
  ];
  const FIRST_MONTH = 1;
  const FIRST_QUARTER = 13;
  const FIRST_HALF = 17;
  
  /**
   * Supports common 'FY22 H1'-style date formats
   *
   * Deliverables and other business concepts in Microsoft are frequently
   * associated with business periods, like 'FY2023 Q1' or 'CY2022 Nov'.
   * Period provides forgiving parsing of common string representations,
   * creates canonical string representations, and uses a common internal
   * representation to allow comparison of any two BizPeriods.
   * 
   * Period uses calendar year values internally to support efficient
   * comparison between Periods.
   */
  export class Period {
    private kind: YearKind;
    private startMonth: number;
    private endMonth: number;
    private fiscalStartMonth: number;
  
    /**
     * Creates a new Period
     * 
     * This constructor is designed to be used with the year and
     * period helper functions. They provide input validation and
     * more literate construction. The expectation is that most
     * use cases will prefer the parser.
     * 
     * Examples:
     *    new Period(CY(2023), Sep())
     *    new Period(FY(2023), H(1))
     *    new Period(CY(2028), Q(3), Apr())
     *
     * @param year the kind and year, use `CY()` and `FY()`
     * @param months start and end month ordinals, relative to the
     *               calendar or fiscal start, use `H()`, `Q()`, or the
     *               month-specifid functions 
     * @param fiscalYearStartMonth using a consistent `FYFactory` is safer
     *        than using this param directly
     */
    constructor(
      year: [YearKind, number] = [YearKind.CY, new Date().getUTCFullYear()],
      months: [number, number] = [1, 12],
      fiscalYearStartMonth: number = Jul()[0]
    ) {
      this.kind = year[0];
      this.fiscalStartMonth = fiscalYearStartMonth;

      switch (this.kind) {
        case YearKind.TBD:
          this.startMonth = 999911;
          this.endMonth = 999911;
          break;
        case YearKind.CY:
            this.startMonth = yearMonth(year[1], months[0]);
            this.endMonth = yearMonth(year[1], months[1]);
          break;
        case YearKind.FY:
          this.startMonth = fiscalToCalendar(
            yearMonth(year[1], months[0]),
            this.fiscalStartMonth
          );
          this.endMonth = fiscalToCalendar(
            yearMonth(year[1], months[1]),
            this.fiscalStartMonth
          ); 
          break;
        default:
          this.startMonth = 999912;
          this.endMonth = 999912;
      }
    }

    /**
     * @returns true if this Period includes all of the months in date
     */
     contains(date: Period): boolean {
      if (
        this.startMonth <= date.startMonth &&
        date.endMonth <= this.endMonth
      ) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this Period ends after date
     */
    endsAfter(date: Period): boolean {
      if (this.endMonth > date.endMonth) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this Period ends before date starts
     */
    endsBefore(date: Period): boolean {
      if (this.endMonth < date.startMonth) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this Period ends the same calendar year and month
     *          as date
     */
     endsSameMonth(date: Period): boolean {
      return this.endMonth === date.endMonth;
    }
  
    /**
     * @returns true if this Period and date have the same internal
     *          representation and would produce the same canonical string
     */
    equals(date: Period): boolean {
      if (
        this.kind === date.kind &&
        this.startMonth === date.startMonth &&
        this.endMonth === date.endMonth &&
        this.fiscalStartMonth === date.fiscalStartMonth
      ) {
        return true;
      }
      return false;
    }

    /**
     * @returns the calendar month associated with the end of this Period
     */
    getEndCalendarMonth(): number {
      return yearAndMonth(this.endMonth)[1];
    }
  
    /**
     * @returns the calendar year associated with the end of this Period
     */
    getEndCalendarYear(): number {
      return yearAndMonth(this.endMonth)[0];
    }
  
    /**
     * @returns the fiscal year associated with the end of this Period
     */
    getEndFiscalYear(): number {
      return yearAndMonth(calendarToFiscal(
        this.endMonth, this.fiscalStartMonth
      ))[0];
    }
  
    /**
     * @returns the `YearKind` associated with this Period
     */
    getKind(): YearKind {
      return this.kind;
    }
    
    /**
     * @returns the month associated with the end of this Period
     */
    getEndMonth(): Period {
      const [calYear, calMonth] = yearAndMonth(this.endMonth);
      return new Period();
    }

    /**
     * @returns the month on which this Period's fiscal year starts, in [1..12]
     */
    getFiscalYearStartMonth(): number {
      return this.fiscalStartMonth;
    }
        
    /**
     * @returns the calendar year associated with the start of this BizPeriod
     */
     getStartCalendarYear(): number {
      return yearAndMonth(this.startMonth)[0];
    }

    /**
     * @returns the fiscal year associated with the start of this Period
     */
     getStartFiscalYear(): number {
      return yearAndMonth(calendarToFiscal(
        this.startMonth, this.fiscalStartMonth
      ))[0];
    }
 
    /**
     * @returns the month associated with the start of this Period
     */
    getStartMonth(): Period {
      const [calYear, calMonth] = yearAndMonth(this.endMonth);
      return new Period();
    }
  
    /**
     * @returns true if this Period starts after date ends
     */
    isAfter(date: Period): boolean {
      return this.startMonth > date.endMonth;
    }
  
    /**
     * @returns true if this Period ends before date starts
     */
    isBefore(date: Period): boolean {
      return this.endMonth < date.startMonth;
    }

    /**
     * @returns true if this Period starts the same calendar year and month
     * as date
     */
     startsSameMonth(date: Period): boolean {
      return this.startMonth === date.startMonth;
    }

    /**
     * @returns true if this Period starts after date
     */
     startsAfter(date: Period): boolean {
      return this.startMonth > date.startMonth;
    }

    /**
     * @returns true if this Period ends after date
     */
     startsBefore(date: Period): boolean {
      return this.startMonth < date.startMonth;
    }
  
    /**
     * @returns this Period transformed into a calendar year Period
     */
    toCalendar(): Period {
      if (this.kind === YearKind.FY) {
        return new Period();
      } else {
        return this;
      }
    }
    
    /**
     * @returns this BizDate mapped to a specific month
     */
    toEndMonth(): Period {
      return new Period();
    }

    /**
     * @returns this Period transformed into a fiscal year Period
     */
     toFiscal(): Period {
      if (this.kind === YearKind.CY) {
        return new Period();
      } else {
        return this;
      }
    }

    toFiscalYearThatStartsIn(fiscalStart: number) {
      return new Period();
    }

    /**
     * @returns this BizDate mapped to a specific month
     */
     toMonths(): Period[] {
      return [new Period()];
    }

    /**
     * @returns this BizDate mapped to a specific month
     */
    toStartMonth(): Period {
      return new Period();
    }
  
    /**
     * @returns canonical string format for this BizDate
     */
    toString(): string {
      switch (this.kind) {
        case YearKind.TBD:
          return 'TBD';
        case YearKind.CY:
        case YearKind.FY:
          return '';
        default:
          return 'Unknown';
      }
    }
  }

  export class FYPeriodFactory {
    private fiscalYearStartMonth: number;

    constructor(fiscalYearStartMonth: number = Jul()[0]) {
      if (1 > fiscalYearStartMonth && fiscalYearStartMonth > 12) {
        throw new Error(`${fiscalYearStartMonth} is not a month`);
      }
      this.fiscalYearStartMonth = fiscalYearStartMonth;
    }

    new(year: number, months: [number, number]): Period {
      return new Period(
        [YearKind.FY, year],
        months,
        this.fiscalYearStartMonth);
    }
  }

  export class PeriodParser {
    private fiscalYearStartMonth: number;

    constructor(fiscalYearStartMonth: number = Jul()[0]) {
      if (1 > fiscalYearStartMonth && fiscalYearStartMonth > 12) {
        throw new Error(`${fiscalYearStartMonth} is not a month`);
      }
      this.fiscalYearStartMonth = fiscalYearStartMonth;
    }

    parse(str: string): Period {
      let bp = parse(str);
      if (
        bp.getKind() == YearKind.FY &&
        bp.getFiscalYearStartMonth() != this.fiscalYearStartMonth
      ) {
        return bp.toFiscalYearThatStartsIn(this.fiscalYearStartMonth);
      } else {
        return bp;
      }
    }
  }
  
  export function CY(year: number): [YearKind, number] {
    let y = Math.floor(year);
    if (y < 1 || y > 9999) {
      throw new Error(`${y} is not a valid year in [1..9999]`);
    }
    y = y < 100 ? 2000 + y : y;
    return [YearKind.CY, y];
  }
  
  export function FY(year: number): [YearKind, number] {
    let y = Math.floor(year);
    if (y < 1 || y > 9999) {
      throw new Error(`${y} is not a valid year in [1..9999]`);
    }
    y = y < 100 ? 2000 + y : y;
    return [YearKind.CY, y];
  }

  export function TBD(): [YearKind, number] {
    return [YearKind.TBD, 9999];
  }

  export function Unknown(): [YearKind, number] {
    return [YearKind.Unknown, 9999];
  }

  export function H(half: number): [number, number] {
    if (1 > half || half > 2) {
      throw new Error(`There are two havles in a year: ${half}`);
    }
    let end = half * 6;
    return [end - 5, end];
  }

  export function Q(quarter: number): [number, number] {
    if (1 > quarter || quarter > 4) {
      throw new Error(`There are four quarters in a year: ${quarter}`);
    }
    let end = quarter * 3; 
    return [end - 2, end];
  }

  export function Jan(): [number, number] {
    return [1, 1];
  }

  export function Feb(): [number, number] {
    return [2, 2];
  }

  export function Mar(): [number, number] {
    return [3, 3];
  }

  export function Apr(): [number, number] {
    return [4, 4];
  }

  export function May(): [number, number] {
    return [5, 5];
  }

  export function Jun(): [number, number] {
    return [6, 6];
  }

  export function Jul(): [number, number] {
    return [7, 7];
  }

  export function Aug(): [number, number] {
    return [8, 8];
  }

  export function Sep(): [number, number] {
    return [9, 9];
  }

  export function Oct(): [number, number] {
    return [10, 10];
  }

  export function Nov(): [number, number] {
    return [11, 11];
  }

  export function Dec(): [number, number] {
    return [12, 12];
  }
  
  /**
   * @returns a CY BizDate corresponding to `date`
   */
  export function fromDate(
    kind: YearKind,
    date: Date,
    periodLen: number,
    fiscalYearStartMonth: number = Jul()[0]
  ): Period {
    switch (kind) {
      case YearKind.CY:
        return new Period();
      case YearKind.FY:
        return new Period().toFiscal();
      case YearKind.TBD:
        return tbdPeriod();
      default:
        return unknownPeriod();
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
  export function parsePeriod(str: string): Period {
    return parse(str);
  }

  export function tbdPeriod(): Period {
    return new Period(TBD());
  }
  
  /**
   * Creates a BizPeriod for the current half, UTC
   *
   * @param kind calendar year or fiscal year
   * @returns a BizDate representing the current half
   */
  export function thisHalfPeriod(
      kind = YearKind.CY,
      fiscalYearStartMonth: number = Jul()[0]
    ): Period {
    return fromDate(kind, new Date(), 6, fiscalYearStartMonth)
  }
  
  /**
   * Creates a BizPeriod for the current quarter, UTC
   *
   * @param kind calendar year or fiscal year
   * @returns a BizDate representing the current quarter
   */
  export function thisQuarterPeriod(
    kind = YearKind.CY,
    fiscalYearStartMonth: number = Jul()[0]
  ): Period {
    return fromDate(kind, new Date(), 3, fiscalYearStartMonth);
  }
  
  /**
   * Creates a BizPeriod for the current month, UTC
   *
   * @param kind calendar year or fiscal year
   * @returns a BizDate representing the current month
   */
  export function thisMonthPeriod(
    kind = YearKind.CY,
    fiscalYearStartMonth: number = Jul()[0]
  ): Period {
    return fromDate(kind, new Date(), 1, fiscalYearStartMonth);
  }

  /**
   * Creates a BizPeriod for the current year, UTC
   * 
   * @param kind calendar year or fiscal year
   * @returns a BizPeriod representing the current year
   */
  export function thisYearPeriod(
    kind = YearKind.CY,
    fiscalYearStartMonth: number = Jul()[0]
  ): Period {
    return fromDate(kind, new Date(), 12, fiscalYearStartMonth);
  }

  export function unknownPeriod(): Period {
    return new Period(Unknown());
  }

  function calendarToFiscal(calendarYearMonth: number, fiscalStart: number): number {
    const [year, month] = yearAndMonth(calendarYearMonth);
    return yearMonth(0, 0);
  }

  function fiscalToCalendar(fiscalYearMonth: number, fiscalStart: number): number {
    const [year, month] = yearAndMonth(fiscalYearMonth);
    return yearMonth(0, 0);
  }

  function yearAndMonth(yearMonth: number): [number, number] {
    return [Math.floor(yearMonth / 100), yearMonth % 100];
  }
  
  function yearMonth(year: number, month: number): number {
    return year * 100 + month;
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
  
  const DATE = rule<TokenKind, Period>();
  const YEAR = rule<TokenKind, [YearKind, number]>();
  const PART = rule<TokenKind, [number, number]>();
  
  function applyCY(
    value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
  ): [YearKind, number] {
    return [YearKind.CY, +value[1].text];
  }
  
  function applyDate(value: [[YearKind, number], [number, number] | undefined]): Period {
    return new Period(value[0], value[1]);
  }
  
  function applyFY(
    value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
  ): [YearKind, number] {
    return [YearKind.FY, +value[1].text];
  }
  
  function applyHalf(
    value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
  ): [number, number] {
    const n = +value[1].text;
    if (n < 1 || n > 2) {
      throw new Error(`There are two halves in a year: ${n}`);
    }
    let end = n * 6;
    return [end - 5, end];
  }
  
  function applyMonth(value: Token<any>): [number, number] {
    return [value.kind - 6, value.kind - 6];
  }
  
  function applyQuarter(
    value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
  ): [number, number] {
    const n = +value[1].text;
    if (n < 1 || n > 4) {
      throw new Error(`There are four quarters in a year: ${n}`);
    }
    let end = n * 3;
    return [end - 2, end];
  }
  
  function applyReverse(value: [[number, number], [YearKind, number]]): Period {
    return applyDate([value[1], value[0]]);
  }
  
  function applyTBD(): Period {
    return new Period(TBD());
  }
  
  function applyUnknown(): Period {
    return new Period(Unknown());
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
  
  function parse(expr: string): Period {
    return expectSingleResult(expectEOF(DATE.parse(lexer.parse(expr))));
  }
  