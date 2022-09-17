import {
  IPeriod
} from './interface';
import {
  calendarToFiscal,
  checkMonth,
  checkYear,
  fiscalToCalendar,
  yearAndMonth,
  yearMonth,
} from './math';

export enum YearKind {
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

/**
 * Supports common 'FY22 H1'-style date formats
 *
 * Deliverables and other business concepts in Microsoft are frequently
 * associated with business periods, like 'FY2023 Q2' or 'CY22 Nov'.
 * Period provides forgiving parsing of common string representations,
 * creates canonical string representations, and uses a common internal
 * representation to allow comparison of any twovPeriods.
 */
export class Period implements IPeriod {
  protected kind: YearKind;

  // Period uses compact calendar year values internally to support efficient
  // comparison between Periods.
  protected startYearMonth: number;
  protected endYearMonth: number;
  protected fiscalYearStartMonth: number;
  protected cachedString: string | undefined;

  /**
   * Creates a new Period
   *
   * The expectation is that the parser will be used much more frequently
   * than this constructor. The constructor is designed to be through the
   * year and period helper functions. They provide more literate construction.
   *
   * Examples:
   *    CY(2023, Sep)
   *    FY(2023, H1)
   *    CY(28, Q3, 7)
   *
   * Parser examples:
   *    parsePeriod('CY2023 Sep')
   *    parsePeriod('FY2023 H1')
   *    parsePeriod('CY28 Q3')
   *
   * Periods
   *
   * @param kind calendar (CY) or fiscal (FY)
   * @param year the calendar or fiscal year
   * @param startMonthOrdinal the start month ordinal relative to the year
   * @param endMonthOrdinal the end month ordinal relative to the year
   * @param fiscalYearStartMonth the month a fiscal year starts, defaults to
   *        7, July
   */
  constructor(
    kind: YearKind = YearKind.CY,
    year: number = new Date().getUTCFullYear(),
    startMonthOrdinal = 1,
    endMonthOrdinal = 12,
    fiscalYearStartMonth = 7
  ) {
    this.kind = kind;
    this.fiscalYearStartMonth = checkMonth(fiscalYearStartMonth);
    const startYear = checkYear(year);
    const startMonth = checkMonth(startMonthOrdinal);
    const endMonth = checkMonth(endMonthOrdinal);
    const endYear = startMonth > endMonth ? startYear + 1 : startYear;

    if (kind === YearKind.FY) {
      this.startYearMonth = fiscalToCalendar(
        yearMonth(startYear, startMonth),
        this.fiscalYearStartMonth
      );
      this.endYearMonth = fiscalToCalendar(
        yearMonth(endYear, endMonth),
        this.fiscalYearStartMonth
      );
    } else {
      this.startYearMonth = yearMonth(startYear, startMonth);
      this.endYearMonth = yearMonth(endYear, endMonth);
    }
  }

  /**
   * Compare is designed to support sorting of Periods for display
   * so that longer Periods sort before Periods they contain.
   *
   * @param date the date to compare against
   * @return < 0  if this should sort before date
   *         == 0 if this and date should sort together
   *         > 0  if this should sort after date
   */
  compare(date: IPeriod): number {
    if (this.startsSameMonth(date) && this.endsSameMonth(date)) {
      return 0;
    }
    if (this.startsBefore(date)) {
      return -1;
    }
    if (this.endsBefore(date)) {
      return -1;
    }
    return 1;
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
      this.fiscalYearStartMonth === date.getFiscalYearStartMonth()
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
      ...yearAndMonth(this.endYearMonth),
      this.fiscalYearStartMonth
    )[1];
  }

  /**
   * @returns the fiscal year associated with the end of this Period
   */
  getEndFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.endYearMonth),
      this.fiscalYearStartMonth
    )[0];
  }

  /**
   * @returns the month associated with the end of this Period
   */
  getEndMonth(): Month {
    if (this.isFiscalPeriod()) {
      const [year, month] = calendarToFiscal(
        ...yearAndMonth(this.endYearMonth),
        this.fiscalYearStartMonth
      );
      return new Month(YearKind.FY, year, month, this.fiscalYearStartMonth);
    } else {
      const [year, month] = yearAndMonth(this.endYearMonth);
      return new Month(this.kind, year, month, this.fiscalYearStartMonth);
    }
  }

  /**
   * @returns the calendar month on which this Period's fiscal year starts,
   *          in [1..12]
   */
  getFiscalYearStartMonth(): number {
    return this.fiscalYearStartMonth;
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
      ...yearAndMonth(this.startYearMonth),
      this.fiscalYearStartMonth
    )[1];
  }

  /**
   * @returns the fiscal year associated with the start of this Period
   */
  getStartFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.startYearMonth),
      this.fiscalYearStartMonth
    )[0];
  }

  /**
   * @returns the month associated with the start of this Period
   */
  getStartMonth(): Month {
    if (this.isFiscalPeriod()) {
      const [year, month] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        this.fiscalYearStartMonth
      );
      return new Month(YearKind.FY, year, month, this.fiscalYearStartMonth);
    } else {
      const [year, month] = yearAndMonth(this.startYearMonth);
      return new Month(this.kind, year, month, this.fiscalYearStartMonth);
    }
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
        startYear,
        startMonth,
        endMonth,
        this.fiscalYearStartMonth
      );
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
        this.fiscalYearStartMonth
      );
      const [, endMonth] = calendarToFiscal(
        ...yearAndMonth(this.endYearMonth),
        this.fiscalYearStartMonth
      );

      return new Period(
        YearKind.FY,
        startYear,
        startMonth,
        endMonth,
        this.fiscalYearStartMonth
      );
    } else {
      return this;
    }
  }

  /**
   * @returns this an array of the Months coverd by this Period
   */
  toMonths(): Period[] {
    return [new Period()];
  }

  /**
   * @returns canonical string format for this Period
   */
  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }
    let pre = 'CY';
    // eslint-disable-next-line prefer-const
    let [startYear, startMonth] = yearAndMonth(this.startYearMonth);
    // eslint-disable-next-line prefer-const
    let [endYear, endMonth] = yearAndMonth(this.endYearMonth);
    if (this.isFiscalPeriod()) {
      pre = 'FY';
      [startYear] = calendarToFiscal(
        startYear,
        startMonth,
        this.fiscalYearStartMonth
      );
      [endYear] = calendarToFiscal(
        endYear,
        endMonth,
        this.fiscalYearStartMonth
      );
    }
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        this.cachedString = `${pre}${startYear} ${months[startMonth]}`;
      } else {
        this.cachedString = `${pre}${startYear} ${months[startMonth]}-${months[endMonth]}`;
      }
    } else {
      this.cachedString =
        this.cachedString = `${pre}${startYear} ${months[startMonth]} - ${pre}${endYear} ${months[endMonth]}`;
    }

    return this.cachedString;
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

/**
 * A calendar or fiscal Month Period
 */
 export class Month extends Period implements IPeriod {
  constructor(
    kind = YearKind.CY,
    year: number,
    ordinal: number,
    fiscalYearStartMonth = 7
  ) {
    let month = checkMonth(ordinal);
    if (kind === YearKind.FY) {
      month = (month + fiscalYearStartMonth - 1) % 12;
      month = month === 0 ? 12 : month;
    }
    super(kind, year, month, month, fiscalYearStartMonth);
  }

  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      const [year, month] = yearAndMonth(this.startYearMonth);
      return new Month(YearKind.CY, year, month, this.fiscalYearStartMonth);
    }
    return this;
  }

  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      const [year, month] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        this.fiscalYearStartMonth
      );
      return new Month(YearKind.FY, year, month, this.fiscalYearStartMonth);
    }
    return this;
  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }

    let pre = 'CY';
    let [year, month] = yearAndMonth(this.endYearMonth);
    if (this.isFiscalPeriod()) {
      pre = 'FY';
      [year, month] = calendarToFiscal(year, month, this.fiscalYearStartMonth);
    }
    this.cachedString = `${pre}${year} ${months[month]}`;
    return this.cachedString;
  }
}

/**
 * A calendar or fiscal Quarter Period
 */
export class Quarter extends Period implements IPeriod {
  constructor(
    kind = YearKind.CY,
    year: number,
    quarter: number,
    fiscalYearStartMonth = 7
  ) {
    if (quarter < 1 || quarter > 4) {
      throw new Error(`There are four quarters in a year: ${quarter}`);
    }
    const endMonth = quarter * 3;
    const startMonth = endMonth - 2;
    super(kind, year, startMonth, endMonth, fiscalYearStartMonth);
  }

  /**
   * @returns a Period instead of a Quarter if the fiscal year is not quarter-
   *          aligned with the calendar year
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      if (this.fiscalYearStartMonth % 3 === 1) {
        const [year, month] = yearAndMonth(this.startYearMonth);
        return new Quarter(
          YearKind.CY,
          year,
          Math.ceil(month / 3),
          this.fiscalYearStartMonth
        );
      } else {
        return super.toCalendar();
      }
    }
    return this;
  }

  /**
   * @returns a Period instead of a Quarter if the fiscal year is not quarter-
   *          aligned with the calendar year
   */
  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      if (this.fiscalYearStartMonth % 3 === 1) {
        const [year, month] = calendarToFiscal(
          ...yearAndMonth(this.startYearMonth),
          this.fiscalYearStartMonth
        );
        return new Quarter(
          YearKind.FY,
          year,
          Math.ceil(month / 3),
          this.fiscalYearStartMonth
        );
      } else {
        return super.toCalendar();
      }
    }
    return this;
  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }

    let pre = 'CY';
    let [year, month] = yearAndMonth(this.endYearMonth);
    if (this.isFiscalPeriod()) {
      pre = 'FY';
      [year, month] = calendarToFiscal(year, month, this.fiscalYearStartMonth);
    }
    this.cachedString = `${pre}${year} Q${Math.ceil(month / 3)}`;
    return this.cachedString;
  }
}

/**
 * A calendar or fiscal Half Period
 */
export class Half extends Period implements IPeriod {
  constructor(
    kind = YearKind.CY,
    year: number,
    half: number,
    fiscalYearStartMonth = 7
  ) {
    if (half < 1 || half > 2) {
      throw new Error(`There are two halves in a year: ${half}`);
    }
    const endMonth = half * 6;
    const startMonth = endMonth - 5;
    super(kind, year, startMonth, endMonth, fiscalYearStartMonth);
  }

  /**
   * @returns a Period instead of a Half if the fiscal year is not half-
   *          aligned with the calendar year
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      if (this.fiscalYearStartMonth === 7) {
        const [year, month] = yearAndMonth(this.startYearMonth);
        return new Half(
          YearKind.CY,
          year,
          Math.ceil(month / 6),
          this.fiscalYearStartMonth
        );
      } else {
        return super.toCalendar();
      }
    }
    return this;
  }

  /**
   * @returns a Period instead of a Half if the fiscal year is not half-
   *          aligned with the calendar year
   */
  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      if (this.fiscalYearStartMonth === 7) {
        const [year, month] = calendarToFiscal(
          ...yearAndMonth(this.startYearMonth),
          this.fiscalYearStartMonth
        );
        return new Half(
          YearKind.FY,
          year,
          Math.ceil(month / 6),
          this.fiscalYearStartMonth
        );
      } else {
        return super.toCalendar();
      }
    }
    return this;
  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }

    let pre = 'CY';
    let [year, month] = yearAndMonth(this.endYearMonth);
    if (this.isFiscalPeriod()) {
      pre = 'FY';
      [year, month] = calendarToFiscal(year, month, this.fiscalYearStartMonth);
    }
    this.cachedString = `${pre}${year} H${Math.ceil(month / 6)}`;
    return this.cachedString;
  }
}

/**
 * A calendar or fiscal Year Period
 */
export class Year extends Period implements IPeriod {
  constructor(kind = YearKind.CY, year: number, fiscalYearStartMonth = 7) {
    super(kind, year, 1, 12, fiscalYearStartMonth);
  }

  /**
   * @returns a Period instead of a Year if the fiscal year does not start
   *          in January
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      const [year, startMonth] = yearAndMonth(this.startYearMonth);
      const [, endMonth] = yearAndMonth(this.endYearMonth);
      if (this.fiscalYearStartMonth === 1) {
        return new Year(YearKind.CY, year, 1);
      } else {
        return new Period(
          YearKind.CY,
          year,
          startMonth,
          endMonth,
          this.fiscalYearStartMonth
        );
      }
    }
    return this;
  }

  /**
   * @returns a Period instead of a Year if the fiscal year does not start
   *          in January
   */
  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      const [year, startMonth] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        this.fiscalYearStartMonth
      );
      const [, endMonth] = calendarToFiscal(
        ...yearAndMonth(this.endYearMonth),
        this.fiscalYearStartMonth
      );

      if (this.fiscalYearStartMonth === 1) {
        return new Year(YearKind.FY, year, 1);
      } else {
        return new Period(
          YearKind.FY,
          year,
          startMonth,
          endMonth,
          this.fiscalYearStartMonth
        );
      }
    }
    return this;
  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }
    if (this.isCalendarPeriod()) {
      this.cachedString = `CY${yearAndMonth(this.startYearMonth)[0]}`;
    } else {
      this.cachedString = `FY${
        calendarToFiscal(
          ...yearAndMonth(this.startYearMonth),
          this.fiscalYearStartMonth
        )[0]
      }`;
    }
    return this.cachedString;
  }
}

export class TBD extends Period implements IPeriod {
  constructor(fiscalYearStartMonth = 7) {
    super(YearKind.CY, 9999, 11, 11, fiscalYearStartMonth);
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
  constructor(fiscalYearStartMonth = 7) {
    super(YearKind.CY, 9999, 12, 12, fiscalYearStartMonth);
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
