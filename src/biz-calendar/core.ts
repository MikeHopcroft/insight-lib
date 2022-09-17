import {IPeriod} from './interface';
import {
  calendarToFiscal,
  checkMonth,
  checkYear,
  fiscalToCalendar,
  yearAndMonth,
  yearMonth,
} from './math';

export class PeriodConfig {
  static fiscalYearStartMonth = 7;
}

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
   *    CY(28, Q3)
   *
   * Parser examples:
   *    parsePeriod('CY2023 Sep')
   *    parsePeriod('FY2023 H1')
   *    parsePeriod('CY28 Q3')
   *
   *
   * @param kind calendar (CY) or fiscal (FY)
   * @param year the calendar
   * @param startMonthOrdinal the calendar start month ordinal
   * @param endMonthOrdinal the calendar end month ordinal
   */
  constructor(
    kind: YearKind = YearKind.CY,
    year: number = new Date().getUTCFullYear(),
    startMonthOrdinal = 1,
    endMonthOrdinal = 12
  ) {
    this.kind = kind;
    const startYear = checkYear(year);
    const startMonth = checkMonth(startMonthOrdinal);
    const endMonth = checkMonth(endMonthOrdinal);
    const endYear = startMonth > endMonth ? startYear + 1 : startYear;

    this.startYearMonth = yearMonth(startYear, startMonth);
    this.endYearMonth = yearMonth(endYear, endMonth);
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
      (this.isFiscalPeriod() === date.isFiscalPeriod() ||
        this.isCalendarPeriod() === date.isCalendarPeriod()) &&
      this.startYearMonth === date.getStartYearMonth() &&
      this.endYearMonth === date.getEndYearMonth()
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
      PeriodConfig.fiscalYearStartMonth
    )[1];
  }

  /**
   * @returns the fiscal year associated with the end of this Period
   */
  getEndFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.endYearMonth),
      PeriodConfig.fiscalYearStartMonth
    )[0];
  }

  /**
   * @returns the month associated with the end of this Period
   */
  getEndMonth(): Month {
    const [year, month] = yearAndMonth(this.endYearMonth);
    return new Month(this.kind, year, month);
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
      PeriodConfig.fiscalYearStartMonth
    )[1];
  }

  /**
   * @returns the fiscal year associated with the start of this Period
   */
  getStartFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.startYearMonth),
      PeriodConfig.fiscalYearStartMonth
    )[0];
  }

  /**
   * @returns the month associated with the start of this Period
   */
  getStartMonth(): Month {
    const [year, month] = yearAndMonth(this.startYearMonth);
    return new Month(this.kind, year, month);
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

      return new Period(YearKind.CY, startYear, startMonth, endMonth);
    } else {
      return this;
    }
  }

  /**
   * @returns this Period transformed into a fiscal year Period
   */
  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      const [startYear, startMonth] = yearAndMonth(this.startYearMonth);
      const [, endMonth] = yearAndMonth(this.endYearMonth);

      return new Period(YearKind.FY, startYear, startMonth, endMonth);
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
        PeriodConfig.fiscalYearStartMonth
      );
      [endYear] = calendarToFiscal(
        endYear,
        endMonth,
        PeriodConfig.fiscalYearStartMonth
      );
    }
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        this.cachedString = `${pre}${startYear} ${months[startMonth]}`;
      } else {
        this.cachedString = `${pre}${startYear} ${months[startMonth]}-${months[endMonth]}`;
      }
    } else {
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
  constructor(kind = YearKind.CY, year: number, ordinal: number) {
    const month = checkMonth(ordinal);
    super(kind, year, month, month);
  }

  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      return new Month(YearKind.CY, ...yearAndMonth(this.startYearMonth));
    }
    return this;
  }

  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      const [year, month] = calendarToFiscal(
        ...yearAndMonth(this.startYearMonth),
        PeriodConfig.fiscalYearStartMonth
      );
      return new Month(YearKind.FY, year, month);
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
      [year, month] = calendarToFiscal(
        year,
        month,
        PeriodConfig.fiscalYearStartMonth
      );
    }
    this.cachedString = `${pre}${year} ${months[month]}`;
    return this.cachedString;
  }
}

/**
 * A calendar or fiscal Quarter Period
 */
export class Quarter extends Period implements IPeriod {
  constructor(kind = YearKind.CY, year: number, quarter: number) {
    if (quarter < 1 || quarter > 4) {
      throw new Error(`There are four quarters in a year: ${quarter}`);
    }
    const month = quarter * 3;
    const [calendarYear, endMonth] =
      kind === YearKind.FY
        ? fiscalToCalendar(year, month, PeriodConfig.fiscalYearStartMonth)
        : [year, month];
    const startMonth = endMonth - 2;
    super(kind, calendarYear, startMonth, endMonth);
  }

  /**
   * @returns a Period instead of a Quarter if the fiscal year is not quarter-
   *          aligned with the calendar year
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      if (PeriodConfig.fiscalYearStartMonth % 3 === 1) {
        const [year, month] = yearAndMonth(this.startYearMonth);
        return new Quarter(YearKind.CY, year, Math.ceil(month / 3));
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
      if (PeriodConfig.fiscalYearStartMonth % 3 === 1) {
        const [year, month] = calendarToFiscal(
          ...yearAndMonth(this.startYearMonth),
          PeriodConfig.fiscalYearStartMonth
        );
        return new Quarter(YearKind.FY, year, Math.ceil(month / 3));
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
      [year, month] = calendarToFiscal(
        year,
        month,
        PeriodConfig.fiscalYearStartMonth
      );
    }
    this.cachedString = `${pre}${year} Q${Math.ceil(month / 3)}`;
    return this.cachedString;
  }
}

/**
 * A calendar or fiscal Half Period
 */
export class Half extends Period implements IPeriod {
  constructor(kind = YearKind.CY, year: number, half: number) {
    if (half < 1 || half > 2) {
      throw new Error(`There are two halves in a year: ${half}`);
    }
    const month = half * 6;
    const [calendarYear, endMonth] =
      kind === YearKind.FY
        ? fiscalToCalendar(year, month, PeriodConfig.fiscalYearStartMonth)
        : [year, month];
    const startMonth = endMonth - 5;
    super(kind, calendarYear, startMonth, endMonth);
  }

  /**
   * @returns a Period instead of a Half if the fiscal year is not half-
   *          aligned with the calendar year
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      if (PeriodConfig.fiscalYearStartMonth === 7) {
        const [year, month] = yearAndMonth(this.startYearMonth);
        return new Half(YearKind.CY, year, Math.ceil(month / 6));
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
      if (PeriodConfig.fiscalYearStartMonth === 7) {
        const [year, month] = calendarToFiscal(
          ...yearAndMonth(this.startYearMonth),
          PeriodConfig.fiscalYearStartMonth
        );
        return new Half(YearKind.FY, year, Math.ceil(month / 6));
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
      [year, month] = calendarToFiscal(
        year,
        month,
        PeriodConfig.fiscalYearStartMonth
      );
    }
    this.cachedString = `${pre}${year} H${Math.ceil(month / 6)}`;
    return this.cachedString;
  }
}

/**
 * A calendar or fiscal Year Period
 */
export class Year extends Period implements IPeriod {
  constructor(kind = YearKind.CY, year: number) {
    const [calendarYear, startMonth] =
      kind === YearKind.FY
        ? fiscalToCalendar(year, 1, PeriodConfig.fiscalYearStartMonth)
        : [year, 1];
    let endMonth = (startMonth + 11) % 12;
    endMonth = endMonth === 0 ? 12 : endMonth;
    super(kind, calendarYear, startMonth, endMonth);
  }

  /**
   * @returns a Period instead of a Year if the fiscal year does not start
   *          in January
   */
  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      const [year, startMonth] = yearAndMonth(this.startYearMonth);
      const [, endMonth] = yearAndMonth(this.endYearMonth);
      if (PeriodConfig.fiscalYearStartMonth === 1) {
        return new Year(YearKind.CY, year);
      } else {
        return new Period(YearKind.CY, year, startMonth, endMonth);
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
      const [startYear, startMonth] = yearAndMonth(this.startYearMonth);
      const [, endMonth] = yearAndMonth(this.endYearMonth);

      if (PeriodConfig.fiscalYearStartMonth === 1) {
        return new Year(YearKind.FY, startYear);
      } else {
        return new Period(YearKind.FY, startYear, startMonth, endMonth);
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
          PeriodConfig.fiscalYearStartMonth
        )[0]
      }`;
    }
    return this.cachedString;
  }
}

export class _TBD extends Period implements IPeriod {
  constructor() {
    super(YearKind.CY, 9999, 11, 11);
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

export class _Unknown extends Period implements IPeriod {
  constructor() {
    super(YearKind.CY, 9999, 12, 12);
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
