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
  enum YearKind {
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
    'None',
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
    'Q1',
    'Q2',
    'Q3',
    'Q4',
    'H1',
    'H2',
    'Year',
  ];
  const FIRST_MONTH = 1;
  const FIRST_QUARTER = 13;
  const FIRST_HALF = 17;
  const FIRST_YEAR = 18;
  
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
  export class Period {
    private kind: YearKind;
    private startYearMonth: number;
    private endYearMonth: number;
    private fiscalStartMonth: number;
    private cachedString = '';
  
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
      this.fiscalStartMonth = safeMonth(fiscalYearStartMonth);
      const startYear = year[1] > 0 ? year[1] % 10000 : 1982;
      const startMonth = safeMonth(months[0]);
      const endMonth = safeMonth(months[1]);
      const endYear = startMonth <= endMonth ? startYear : startYear + 1;

      switch (this.kind) {
        case YearKind.TBD:
          this.startYearMonth = 999911;
          this.endYearMonth = 999911;
          break;
        case YearKind.CY:
            this.startYearMonth = yearMonth(startYear, startMonth);
            this.endYearMonth = yearMonth(endYear, endMonth);
          break;
        case YearKind.FY:
          this.startYearMonth = fiscalToCalendar(
            yearMonth(startYear, startMonth),
            this.fiscalStartMonth
          );
          this.endYearMonth = fiscalToCalendar(
            yearMonth(endYear, endMonth),
            this.fiscalStartMonth
          ); 
          break;
        default:
          this.startYearMonth = 999912;
          this.endYearMonth = 999912;
      }
    }

    /**
     * @returns true if this Period includes all of the months in date
     */
     contains(date: Period): boolean {
      if (
        this.startYearMonth <= date.startYearMonth &&
        date.endYearMonth <= this.endYearMonth
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
      if (this.endYearMonth > date.endYearMonth) {
        return true;
      } else {
        return false;
      }
    }

    /**
     * @returns true if this Period ends before date starts
     */
    endsBefore(date: Period): boolean {
      if (this.endYearMonth < date.startYearMonth) {
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
      return this.endYearMonth === date.endYearMonth;
    }
  
    /**
     * @returns true if this Period and date have the same internal
     *          representation and would produce the same canonical string
     */
    equals(date: Period): boolean {
      if (
        this.kind === date.kind &&
        this.startYearMonth === date.startYearMonth &&
        this.endYearMonth === date.endYearMonth &&
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
      return yearAndMonth(this.endYearMonth)[1];
    }
  
    /**
     * @returns the calendar year associated with the end of this Period
     */
    getEndCalendarYear(): number {
      return yearAndMonth(this.endYearMonth)[0];
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
    getEndMonth(): Period {
      const [calYear, calMonth] = yearAndMonth(this.endYearMonth);
      const endCalMonth = new Period(
        CY(calYear),
        Month(calMonth),
        this.fiscalStartMonth
      );
      switch (this.kind) {
        case YearKind.CY:
          return endCalMonth;
        case YearKind.FY:
          return endCalMonth.toFiscal();
        case YearKind.TBD:
          return tbdPeriod();
        default:
          return unknownPeriod();
      }
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
      return yearAndMonth(this.startYearMonth)[0];
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
    getStartMonth(): Period {
      const [calYear, calMonth] = yearAndMonth(this.startYearMonth);
      const startCalMonth = new Period(
        CY(calYear),
        [calMonth, calMonth],
        this.fiscalStartMonth
      );
      if (this.isFiscalPeriod()) {
        return startCalMonth.toFiscal();
      } else {
        return startCalMonth;
      }
    }
  
    /**
     * @returns true if this Period starts after date ends
     */
    isAfter(date: Period): boolean {
      return this.startYearMonth > date.endYearMonth;
    }
  
    /**
     * @returns true if this Period ends before date starts
     */
    isBefore(date: Period): boolean {
      return this.endYearMonth < date.startYearMonth;
    }

    isCalendarPeriod(): boolean {
      return this.kind === YearKind.CY;
    }

    isFiscalPeriod(): boolean {
      return this.kind === YearKind.FY;
    }

    isTBD(): boolean {
      return this.kind === YearKind.TBD;
    }

    isUnknown(): boolean {
      return (
        this.kind !== YearKind.CY &&
        this.kind !== YearKind.FY &&
        this.kind !== YearKind.TBD
      );
    }

    /**
     * @returns true if this Period starts the same calendar year and month
     * as date
     */
     startsSameMonth(date: Period): boolean {
      return this.startYearMonth === date.startYearMonth;
    }

    /**
     * @returns true if this Period starts after date
     */
     startsAfter(date: Period): boolean {
      return this.startYearMonth > date.startYearMonth;
    }

    /**
     * @returns true if this Period ends after date
     */
     startsBefore(date: Period): boolean {
      return this.startYearMonth < date.startYearMonth;
    }
  
    /**
     * @returns this Period transformed into a calendar year Period
     */
    toCalendar(): Period {
      if (this.isFiscalPeriod()) {
        const [startYear, startMonth] = yearAndMonth(this.startYearMonth);
        const [, endMonth] = yearAndMonth(this.endYearMonth);
        return new Period(CY(startYear), [startMonth, endMonth]);
      } else {
        return this;
      }
    }

    /**
     * @returns this Period transformed into a fiscal year Period
     */
     toFiscal(): Period {
      if (this.isCalendarPeriod()) {
        return this.toFiscalYearThatStartsIn(this.fiscalStartMonth);
      } else {
        return this;
      }
    }

    toFiscalYearThatStartsIn(fiscalStart: number): Period {
      if (this.isTBD() || this.isUnknown()) {
        return this;
      }

      const [startYear, startMonth] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        fiscalStart
      );
      const [, endMonth] = calendarToFiscal(
        ...yearAndMonth(this.endYearMonth),
        fiscalStart
      );

      return new Period(FY(startYear), [startMonth, endMonth], fiscalStart);
    }

    /**
     * @returns this BizDate mapped to a specific month
     */
    toMonths(): Period[] {
      return [new Period()];
    }

    /**
     * @returns canonical short string format for this Period
     */
     toShortString(): string {
      if (this.cachedString !== undefined && this.cachedString !== '') {
        return this.cachedString;
      }
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
  
    /**
     * @returns canonical string format for this Period
     */
    toString(): string {
      if (this.cachedString !== undefined && this.cachedString !== '') {
        return this.cachedString;
      }
      if (this.isTBD()) {
        return 'TBD';
      }
      if (this.isUnknown()) {
        return 'Unknown';
      }
      const kindStr = this.isFiscalPeriod() ? 'FY': 'CY';
      const [fiscalYear, fiscalMonth] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        this.fiscalStartMonth
      );

      
      return '';
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
        bp.isFiscalPeriod() &&
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
    return [YearKind.FY, y];
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

  export function Month(ordinal: number): [number, number] {
    return [ordinal, ordinal];
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
      ? calendarYear - 1 
      : calendarYear;
    const fiscalMonth = (fiscalStart + calendarMonth - 2) % 12 + 1;
    return [fiscalYear, fiscalMonth];
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
  
  function safeMonth(month: number): number {
    if (month < 0) {
      return 1;
    } else if (month > 12) {
      return 12;
    } else {
      return month;
    }
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
    if (value[0][0] === YearKind.CY) {
      return new Period(CY(value[0][1]), value[1])
    } else {
      return new Period(FY(value[0][1]), value[1]);
    }
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
  