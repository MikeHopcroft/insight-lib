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
   *
   * The enum order must remain stable. New enum values should be added to the end.
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
   * Business periods can be described with resolution from whole years to
   * specific months.
   *
   * The enum order must remain stable. It is used in math, lookup tables
   * and parsing. New enum values should be added to the end.
   */
  export enum Period {
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
  const HALVES_START = 1; // inclusive
  const HALVES_END = 3; // exlusive
  const QUARTERS_START = 3; // inclusive
  const QUARTERS_END = 7; // exclusive
  const MONTHS_START = 7; // inclusive
  const MONTHS_END = 19; // exclusive
  
  /**
   * en-US display strings for Period
   *
   * The elements in periodStr must remain aligned with the elements in
   * Period.
   */
  const periodData = [
    { str: 'Year', len: 12, end: 12},
    { str: 'H1', len: 4, end: 6},
    { str: 'H2', len: 4, end: 12},
    { str: 'Q1', len: 2, end: 3},
    { str: 'Q2', len: 2, end: 6},
    { str: 'Q3', len: 2, end: 9},
    { str: 'Q4', len: 2, end: 12},
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
    { str: 'None', len: 0, end: 12},
  ];
  
  /**
   * enum used to specify transformations in private methods
   *
   * The enum order must remain stable. New enum values should
   * be added to the end.
   */
  enum Resolution {
    Year,
    Half,
    Quarter,
    Month,
  }
  
  /**
   * Supports common 'FY22 H1'-style date formats
   *
   * Deliverables and other business concepts in Microsoft are frequently
   * associated with business periods, like 'FY2023 Q1' or 'CY2022 Nov'.
   * BizPeriod provides forgiving parsing of common string representations,
   * creates canonical string representations, and uses a common internal
   * representation to allow comparison of any two BizPeriods.
   * 
   * BizPeriod uses calendar year values internally to support efficient
   * comparison.
   */
  export class BizPeriod {
    private kind: YearKind;
    private period: Period;
    private endCalendarYear: number;
    private endCalendarMonth: number;
    private fiscalYearStartMonth: Period;
  
    /**
     * Creates a new BizPeriod
     *
     * If `year` is less than 100, the constructor adds 2000 to `year`.
     *
     * @param kind fiscal year, calendar year, tbd, or unknown
     * @param year the year in the context of the kind
     * @param period the part of the year
     * @param fiscalYearStartMonth using a consistent `FYFactory` is a safer
     *        than using this param directly
     *
     * @throws Error, if `year` < 1 or `year` > 9999 or either of the
     *         enums are out of range
     */
    constructor(
      kind: YearKind = YearKind.CY,
      year: number = new Date().getUTCFullYear(),
      period: Period = Period.Year,
      fiscalYearStartMonth: Period = Period.Jul
    ) {
      if (!Object.values(YearKind).includes(kind)) {
        throw new Error(`${kind} is not a recognized YearKind`);
      }
      if (!Object.values(Period).includes(period)) {
        throw new Error(`${period} is not a recognized Period`);
      }
      if (
        MONTHS_START > fiscalYearStartMonth &&
        fiscalYearStartMonth >= MONTHS_END
      ) {
        throw new Error(`${fiscalYearStartMonth} is not in months range`);
      }

      this.kind = kind;
      if (kind === YearKind.TBD || kind == YearKind.Unknown) {
        this.period = Period.None
        this.endCalendarYear = 9999;
        this.fiscalYearStartMonth = fiscalYearStartMonth;
        if (kind === YearKind.TBD) {
          this.endCalendarMonth = 11;
        } else {
          this.endCalendarMonth = 12;
        }
        return;
      }

      this.period = period;
      this.endCalendarMonth = calendarMonthFor(kind, period, fiscalYearStartMonth);
      this.fiscalYearStartMonth = fiscalYearStartMonth;

      let y = Math.floor(year);
      if (y < 1 || y > 9999) {
        throw new Error(`${y} is not a valid year in [1..9999]`);
      }
      y = y < 100 ? 2000 + y : y;
      if (kind === YearKind.FY) {
        this.endCalendarYear = fiscalTo(
          YearKind.CY,
          y,
          this.endCalendarMonth,
          fiscalYearStartMonth
        );
      } else {
        this.endCalendarYear = y;
      }
    }

    /**
     * @returns true if this BizPeriod contains all of the months in date
     */
     contains(date: BizPeriod): boolean {
      if (
        !this.getStartMonth().isAfter(date.getStartMonth()) &&
        !this.getEndMonth().isBefore(date.getEndMonth())
      ) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this BizPeriod ends after date
     */
    endsAfter(date: BizPeriod): boolean {
      if (this.getEndMonth().isAfter(date.getEndMonth())) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this BizPeriod ends before date starts
     */
    endsBefore(date: BizPeriod): boolean {
      if (this.getEndMonth().isBefore(date.getStartMonth())) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this BizPeriod ends the same calendar year and month
     *          as date
     */
     endsSameMonth(date: BizPeriod): boolean {
      return (
        this.endCalendarYear === date.endCalendarYear &&
        this.endCalendarMonth === date.endCalendarMonth
      );
    }
  
    /**
     * @returns true if this BizDate and date have the same representation and
     *          would produce the same canonical string
     */
    equals(date: BizPeriod): boolean {
      if (
        this.kind === date.kind &&
        this.period === date.period &&
        this.endCalendarYear === date.endCalendarYear &&
        this.endCalendarMonth === date.endCalendarMonth &&
        this.fiscalYearStartMonth === date.fiscalYearStartMonth
      ) {
        return true;
      }
      return false;
    }

    /**
     * @returns the calendar month associated with the enf of this BizPeriod
     */
    getEndCalendarMonth(): number {
      return this.endCalendarMonth;
    }
  
    /**
     * @returns the calendar year associated with the end of this BizPeriod
     */
    getEndCalendarYear(): number {
      return this.endCalendarYear;
    }
  
    /**
     * @returns the fiscal year associated with the end of this BizPeriod
     */
    getEndFiscalYear(): number {
      return calendarTo(
        YearKind.FY,
        this.endCalendarYear,
        this.endCalendarMonth
      );
    }
  
    /**
     * @returns the `YearKind` associated with this BizPeriod
     */
    getKind(): YearKind {
      return this.kind;
    }
    
    /**
     * @returns the month associated with the end of this BizPeriod,
     *          in [1..12]
     */
    getEndMonth(): BizPeriod {
      let year = this.endCalendarYear;
      let month = calendarMonthFor(this.kind, this.period, this.fiscalYearStartMonth)
      if (this.kind == YearKind.FY) {
        year = calendarTo(
          YearKind.FY,
          this.endCalendarYear,
          this.endCalendarMonth
        );
      }
      return new BizPeriod(
        this.kind,
        year,
        month + 6
      );
    }

    getFiscalYearStartMonth(): Period {
      return this.fiscalYearStartMonth;
    }
        
    /**
     * @returns the calendar year associated with the start of this BizPeriod
     */
     getStartCalendarYear(): number {
      return 0;
    }

    /**
     * @returns the fiscal year associated with the start of this BizPeriod
     */
     getStartFiscalYear(): number {
      return calendarTo(
        YearKind.FY,
        this.endCalendarYear,
        this.endCalendarMonth
      );
    }
 
    /**
     * @reeturns the month associated with the start of this BizPeriod,
     *          in [1..12]
     */
    getStartMonth(): BizPeriod {
      return new BizPeriod(
        this.kind
      );
    }
  
    /**
     * @returns the specific Period associated with this BizDate
     */
    getPeriod(): Period {
      return this.period;
    }
  
    /**
     * @returns true if this BizPeriod stars after date ends
     */
    isAfter(date: BizPeriod): boolean {
      return this.compare(date) > 0;
    }
  
    /**
     * @returns true if this BizPeriod ends before date starts
     */
    isBefore(date: BizPeriod): boolean {
      return this.compare(date) < 0;
    }

    /**
     * @returns true if this BizPeriod is the same calendar year and month as date
     */
     startsSameMonth(date: BizPeriod): boolean {
      return false;
    }

    /**
     * @returns true if this BizPeriod starts after date
     */
     startsAfter(date: BizPeriod): boolean {
      return false;
    }

    /**
     * @returns true if this BizPeriod ends after date
     */
     startsBefore(date: BizPeriod): boolean {
      return false;
    }
  
    /**
     * @returns this BizDate transformed into a calendar year BizDate
     */
    toCalendarYear(): BizPeriod {
      if (this.kind === YearKind.FY) {
        return new BizPeriod(
          YearKind.CY,
          this.endCalendarYear,
          fiscalPeriodToCalendarPeriod(this.period, this.fiscalYearStartMonth)
        );
      } else {
        return this;
      }
    }
  
    /**
     * @returns this BizDate mapped to a specific month
     */
     toEndMonth(): BizPeriod {
      return this.toResolution(Resolution.Month);
    }
  
    /**
     * @returns this BizDate transformed into a fiscal year BizDate
     */
    toFiscalYear(): BizPeriod {
      if (this.kind === YearKind.CY) {
        return new BizPeriod(
          YearKind.FY,
          calendarTo(YearKind.FY, this.endCalendarYear, this.endCalendarMonth),
          calendarPeriodToFiscalPeriod(this.period, this.fiscalYearStartMonth)
        );
      } else {
        return this;
      }
    }

    /**
     * @returns this BizDate transformed into a fiscal year BizDate
     */
     toFiscalYearThatStartsIn(month: Period): BizPeriod {
      return new BizPeriod();
    }

    /**
     * @returns this BizDate mapped to a specific month
     */
     toMonths(): BizPeriod[] {
      return [this.toResolution(Resolution.Month)];
    }

    /**
     * Maps this BizPeriod to a specific Period resolution
     *
     * `toResolution` and the methods that depend on it are lossy in that the
     * resulting BizPeriodss have calendar months mapped to the new resolution,
     * always in the final month of the specified year part.
     *
     * @param resolution year, half, quarter, or month
     * @returns this BizDate mapped to a specific year part
     */
     private toResolution(resolution: Resolution): BizPeriod {
      if (this.kind === YearKind.CY || this.kind === YearKind.FY) {
        return new BizPeriod(
          this.kind,
          calendarTo(this.kind, this.endCalendarYear, this.endCalendarMonth),
          periodFor(this.kind, this.endCalendarMonth, resolution)
        );
      } else {
        return this;
      }
    }

    /**
     * @returns this BizDate mapped to a specific month
     */
    toStartMonth(): BizPeriod {
      return this.toResolution(Resolution.Month);
    }
  
    /**
     * @returns canonical string format for this BizDate
     */
    toString(): string {
      const year = this.kind === YearKind.FY
        ? calendarTo(YearKind.FY, this.endCalendarYear, this.endCalendarMonth)
        : this.endCalendarYear;
      switch (this.kind) {
        case YearKind.TBD:
          return 'TBD';
        case YearKind.CY:
        case YearKind.FY:
          if (this.period === Period.Year || this.period === Period.None) {
            return `${Object.keys(YearKind)[this.kind]}${year}`;
          } else {
            return `${Object.keys(YearKind)[this.kind]}${year} ${periodData[this.period].str}`;
          }
        default:
          return 'Unknown';
      }
    }
  }

  export class FYPeriodFactory {
    private fiscalYearStartMonth: Period;

    constructor(fiscalYearStartMonth: Period = Period.Jul) {
      if (
        MONTHS_START > fiscalYearStartMonth &&
        fiscalYearStartMonth >= MONTHS_END
      ) {
        throw new Error(`${fiscalYearStartMonth} is not in months range`);
      }
      this.fiscalYearStartMonth = fiscalYearStartMonth;
    }

    new(year: number, period: Period): BizPeriod {
      return new BizPeriod(
        YearKind.FY,
        year,
        period,
        this.fiscalYearStartMonth);
    }
  }

  export class Parser {
    private fiscalYearStartMonth: Period;

    constructor(fiscalYearStartMonth: Period = Period.Jul) {
      if (
        MONTHS_START > fiscalYearStartMonth &&
        fiscalYearStartMonth >= MONTHS_END
      ) {
        throw new Error(`${fiscalYearStartMonth} is not in months range`);
      }
      this.fiscalYearStartMonth = fiscalYearStartMonth;
    }

    parse(str: string): BizPeriod {
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
  
  export function CY(year: number, period: Period): BizPeriod {
    return new BizPeriod(YearKind.CY, year, period);
  }
  
  export function FY(year: number, period: Period): BizPeriod {
    return new BizPeriod(YearKind.FY, year, period);
  }
  
  export function TBD(): BizPeriod {
    return new BizPeriod(YearKind.TBD);
  }
  
  export function Unknown(): BizPeriod {
    return new BizPeriod(YearKind.Unknown);
  }
  
  /**
   * @returns a CY BizDate corresponding to `date`
   */
  export function fromDate(
    date: Date,
    kind: YearKind,
    resolution: Resolution = Resolution.Month
  ): BizPeriod {
    switch (kind) {
      case YearKind.CY:
        return new BizPeriod(
          YearKind.CY,
          date.getUTCFullYear(),
          periodFor(YearKind.CY, date.getUTCMonth() + 1, Resolution.Month)
        );
      case YearKind.FY:
        return new BizPeriod(
          YearKind.CY,
          date.getUTCFullYear(),
          periodFor(YearKind.CY, date.getUTCMonth() + 1, Resolution.Month)
        ).toFiscalYear();
      case YearKind.TBD:
        return tbd();
      default:
        return unknown();
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
  export function parseBizPeriod(str: string): BizPeriod {
    return parse(str);
  }
  
  /**
   * @returns a TBD BizPeriod
   */
  export function tbd(): BizPeriod {
    return new BizPeriod(YearKind.TBD);
  }
  
  /**
   * Creates a BizPeriod for the current half, UTC
   *
   * @param kind calendar year or fiscal year
   * @returns a BizDate representing the current half
   */
  export function thisHalf(kind = YearKind.CY): BizPeriod {
    return fromDate(new Date(), kind, Resolution.Half)
  }
  
  /**
   * Creates a BizPeriod for the current quarter, UTC
   *
   * @param kind calendar year or fiscal year
   * @returns a BizDate representing the current quarter
   */
  export function thisQuarter(kind = YearKind.CY): BizPeriod {
    return fromDate(new Date(), kind, Resolution.Quarter);
  }
  
  /**
   * Creates a BizPeriod for the current month, UTC
   *
   * @param kind calendar year or fiscal year
   * @returns a BizDate representing the current month
   */
  export function thisMonth(kind = YearKind.CY): BizPeriod {
    return fromDate(new Date(), kind, Resolution.Month);
  }

  /**
   * Creates a BizPeriod for the current year, UTC
   * 
   * @param kind calendar year or fiscal year
   * @returns a BizPeriod representing the current year
   */
  export function thisYear(kind = YearKind.CY): BizPeriod {
    return fromDate(new Date(), kind, Resolution.Year);
  }
  
  /**
   * @returns an Unknown BizDate
   */
  export function unknown(): BizPeriod {
    return new BizPeriod(YearKind.Unknown);
  }
  
  /**
   * Maps the pair of year kind and year part to the end month of the part
   *
   * @param kind CY,FY, TBD, or Unknown
   * @param period the specific part of the year
   * @param fiscalStartMonth the start of the fiscal year
   * @returns the ordinal of the month in [1..12]
   */
  function calendarMonthFor(
    kind: YearKind,
    period: Period,
    fiscalStartMonth: Period
  ): number {
    const yearStart = kind === YearKind.FY ? fiscalStartMonth : Period.Jan;
    let month = (yearStart - MONTHS_START + periodData[period].end) % 12;
    if (month === 0) {
      month = 12;
    }
    return month;
  }
  
  function calendarPeriodToFiscalPeriod(period: Period, fiscalStart: Period): Period {
    return 0;
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
      if (month > 6) {
        return year + 1;
      } else {
        return year;
      }
    } else {
      return year;
    }
  }

  function fiscalPeriodToCalendarPeriod(period: Period, fiscalStart: Period): Period {
    return 0;
  }
  
  /**
   * Converts the year from fiscal to calendar or fiscal
   *
   * @param kind the year kind to convert to
   * @param year the calendar year to convert
   * @param month the month of the year
   * @param fiscalYearStartMonth the first month in the fiscal year
   * @returns the calendar year
   */
  function fiscalTo(
    kind: YearKind,
    year: number,
    month: number,
    fiscalYearStartMonth: Period
  ): number {
    if (kind === YearKind.CY) {
      if (month > fiscalYearStartMonth - MONTHS_START) {
        return year - 1;
      } else {
        return year;
      }
    } else {
      return year;
    }
  }
  
  /**
   * Maps a month to a specific year part
   *
   * @param year CY, FY, TBD, or Unknown
   * @param month the month ordinal in [1..12]
   * @param res the YearPart resolution
   * @returns the specified YearPart
   */
  function periodFor(year: YearKind, month: number, res: Resolution): Period {
    if (year === YearKind.TBD || year === YearKind.Unknown) {
      return Period.None;
    }
    return 0;
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
  
  const DATE = rule<TokenKind, BizPeriod>();
  const YEAR = rule<TokenKind, [YearKind, number]>();
  const PART = rule<TokenKind, Period>();
  
  function applyCY(
    value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
  ): [YearKind, number] {
    return [YearKind.CY, +value[1].text];
  }
  
  function applyDate(value: [[YearKind, number], Period | undefined]): BizPeriod {
    const part = value[1] === undefined ? Period.Year : value[1];
    return new BizPeriod(value[0][0], value[0][1], part);
  }
  
  function applyFY(
    value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
  ): [YearKind, number] {
    return [YearKind.FY, +value[1].text];
  }
  
  function applyHalf(
    value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
  ): Period {
    const n = +value[1].text;
    if (n < 1 || n > 2) {
      throw new Error(`There are two halves in a year: ${n}`);
    }
    return n; // YearPart[1..2]
  }
  
  function applyMonth(value: Token<any>): Period {
    return value.kind; // YearPart[7..18]
  }
  
  function applyQuarter(
    value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
  ): Period {
    const n = +value[1].text;
    if (n < 1 || n > 4) {
      throw new Error(`There are four quarters in a year: ${n}`);
    }
    return n + 2; // YearPart[3..6]
  }
  
  function applyReverse(value: [Period, [YearKind, number]]): BizPeriod {
    return applyDate([value[1], value[0]]);
  }
  
  function applyTBD(): BizPeriod {
    return new BizPeriod(YearKind.TBD, 9999, Period.None);
  }
  
  function applyUnknown(): BizPeriod {
    return new BizPeriod(YearKind.Unknown, 9999, Period.None);
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
  
  function parse(expr: string): BizPeriod {
    return expectSingleResult(expectEOF(DATE.parse(lexer.parse(expr))));
  }
  