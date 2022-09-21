import {
  DivisionGranularity,
  Halves,
  IPeriod,
  Months,
  PeriodConfig,
  Quarters,
  Years,
} from './interface';
import {
  calendarToFiscal,
  checkKind,
  checkMonth,
  checkYear,
  fiscalToCalendar,
  ifShortYear,
  subtractMonths,
  tickMonth,
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
 * Core implementation of IPeriod
 */
export class Period implements IPeriod {
  protected kind: YearKind;

  // Period uses compact calendar year values internally to support efficient
  // comparison between Periods.
  protected startYearMonth: number;
  protected endYearMonth: number;
  protected cachedString: string | undefined;

  /**
   * Creates a new Period for the range described
   *
   * The expectation is that the parser will be used much more frequently
   * than this constructor. The constructor is designed to be used through the
   * year and period helper functions. They provide more literate construction.
   *
   * Calendar years and month ordinals are passed into the Period constructor,
   * even if the Period represents a fiscal year period.
   *
   * @param kind calendar (CY) or fiscal (FY)
   * @param startYearShortOrLong the calendar year in which the Period starts
   * @param startMonthOrdinal the calendar start month ordinal
   * @param endYearShortOrLong the calendar year in which the Period ends or -1
   *        if end year should be determined based on start year and months
   * @param endMonthOrdinal the calendar end month ordinal
   *
   * @throws Error if any of the values are out of range
   */
  constructor(
    kind: YearKind = YearKind.CY,
    startYearShortOrLong: number = new Date().getUTCFullYear(),
    startMonthOrdinal = 1,
    endYearShortOrLong = -1,
    endMonthOrdinal = 12
  ) {
    this.kind = checkKind(kind);
    const startYear = checkYear(startYearShortOrLong);
    const startMonth = checkMonth(startMonthOrdinal);
    const endMonth = checkMonth(endMonthOrdinal);
    let endYear = startYear;
    if (endYearShortOrLong === -1) {
      if (startMonth > endMonth) {
        endYear = startYear + 1;
      }
    } else {
      endYear = checkYear(endYearShortOrLong);
    }

    this.startYearMonth = yearMonth(startYear, startMonth);
    this.endYearMonth = yearMonth(endYear, endMonth);
    if (this.startYearMonth > this.endYearMonth) {
      throw new Error(
        `The period cannot end (${this.endYearMonth}) before it starts (${this.startYearMonth})`
      );
    }
  }

  compare(date: IPeriod): number {
    // No overlap
    if (this.isBefore(date)) {
      return -1;
    }
    if (this.isAfter(date)) {
      return 1;
    }

    // Overlap at beginning
    if (this.startsBefore(date)) {
      return -1;
    }

    // Complete overlap
    if (this.startsSameMonth(date) && this.endsSameMonth(date)) {
      return 0;
    }

    // Overlapping cases for Gantt-like containment order
    if (this.contains(date)) {
      return -1;
    }
    // Ends After
    return 1;
  }

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

  divide(): IPeriod[] {
    return this.toMonths();
  }

  divideInto(
    granularity: DivisionGranularity,
    includeIntermediateLevels: boolean,
    fillInRange: boolean
  ): IPeriod[] {
    return this.toMonths();
  }

  endsAfter(date: IPeriod): boolean {
    return this.endYearMonth > date.getEndYearMonth();
  }

  endsBefore(date: IPeriod): boolean {
    return this.endYearMonth < date.getEndYearMonth();
  }

  endsSameMonth(date: IPeriod): boolean {
    return this.endYearMonth === date.getEndYearMonth();
  }

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

  getEndCalendarMonth(): number {
    return yearAndMonth(this.endYearMonth)[1];
  }

  getEndCalendarYear(): number {
    return yearAndMonth(this.endYearMonth)[0];
  }

  getEndFiscalMonth(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.endYearMonth),
      PeriodConfig.fiscalYearStartMonth
    )[1];
  }

  getEndFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.endYearMonth),
      PeriodConfig.fiscalYearStartMonth
    )[0];
  }

  getEndMonth(): Month {
    let year = this.getEndCalendarYear();
    const month = this.getEndCalendarMonth();
    if (this.isFiscalPeriod()) {
      year = this.getEndFiscalYear();
    }
    return new Month(this.kind, year, month);
  }

  getStartCalendarMonth(): number {
    return yearAndMonth(this.startYearMonth)[1];
  }

  getStartCalendarYear(): number {
    return yearAndMonth(this.startYearMonth)[0];
  }

  getStartFiscalMonth(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.startYearMonth),
      PeriodConfig.fiscalYearStartMonth
    )[1];
  }

  getStartFiscalYear(): number {
    return calendarToFiscal(
      ...yearAndMonth(this.startYearMonth),
      PeriodConfig.fiscalYearStartMonth
    )[0];
  }

  getStartMonth(): Month {
    let year = this.getStartCalendarYear();
    const month = this.getStartCalendarMonth();
    if (this.isFiscalPeriod()) {
      year = this.getStartFiscalYear();
    }
    return new Month(this.kind, year, month);
  }

  isAfter(date: IPeriod): boolean {
    return this.startYearMonth > date.getEndYearMonth();
  }

  isBefore(date: IPeriod): boolean {
    return this.endYearMonth < date.getStartYearMonth();
  }

  isCalendarPeriod(): boolean {
    return this.kind === YearKind.CY;
  }

  isFiscalPeriod(): boolean {
    return this.kind === YearKind.FY;
  }

  lengthInMonths(): number {
    return 1;
  }

  newPeriodCombinedWith(period: IPeriod): IPeriod {
    let startYear = 0;
    let startMonth = 0;
    let endYear = 0;
    let endMonth = 0;
    if (this.startsBefore(period)) {
      [startYear, startMonth] = yearAndMonth(this.getStartYearMonth());
    } else {
      [startYear, startMonth] = yearAndMonth(period.getStartYearMonth());
    }
    if (this.endsAfter(period)) {
      [endYear, endMonth] = yearAndMonth(this.getEndYearMonth());
    } else {
      [endYear, endMonth] = yearAndMonth(period.getEndYearMonth());
    }
    return new Period(this.kind, startYear, startMonth, endYear, endMonth);
  }

  newPeriodFrom(from: IPeriod): IPeriod {
    if (this.startsBefore(from) || from.endsAfter(this)) {
      throw new Error(
        '`from` must start before `this` and `this` must end after `from`'
      );
    } else {
      return new Period(
        this.kind,
        ...yearAndMonth(from.getStartYearMonth()),
        ...yearAndMonth(this.getEndYearMonth())
      );
    }
  }

  newPeriodTo(to: IPeriod): IPeriod {
    if (to.startsBefore(this) || this.endsAfter(to)) {
      throw new Error(
        '`this` must start before `to` and `to` must end after `this`'
      );
    } else {
      return new Period(
        this.kind,
        ...yearAndMonth(this.getStartYearMonth()),
        ...yearAndMonth(to.getEndYearMonth())
      );
    }
  }

  startsAfter(date: IPeriod): boolean {
    return this.startYearMonth > date.getStartYearMonth();
  }

  startsBefore(date: IPeriod): boolean {
    return this.startYearMonth < date.getStartYearMonth();
  }

  startsSameMonth(date: IPeriod): boolean {
    return this.startYearMonth === date.getStartYearMonth();
  }

  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      return new Period(
        YearKind.CY,
        ...yearAndMonth(this.startYearMonth),
        ...yearAndMonth(this.endYearMonth)
      );
    } else {
      return this;
    }
  }

  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      return new Period(
        YearKind.FY,
        ...yearAndMonth(this.startYearMonth),
        ...yearAndMonth(this.endYearMonth)
      );
    } else {
      return this;
    }
  }

  toMonths(): Month[] {
    const months: Month[] = [];
    for (
      let month = this.startYearMonth;
      month <= this.endYearMonth;
      month = tickMonth(month)
    ) {
      months.push(new Month(this.kind, ...yearAndMonth(month)));
    }
    return months;
  }

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
      startYear = this.getStartFiscalYear();
      endYear = this.getEndFiscalYear();
    }
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        // FY2023 Jul
        this.cachedString = `${pre}${ifShortYear(startYear)}${
          PeriodConfig.stringMonthPad
        }${months[startMonth]}`;
      } else {
        // CY2023 Jul-OCt
        this.cachedString = `${pre}${ifShortYear(startYear)}${
          PeriodConfig.stringMonthPad
        }${months[startMonth]}${PeriodConfig.stringMonthRangePad}-${
          PeriodConfig.stringMonthRangePad
        }${months[endMonth]}`;
      }
    } else {
      // CY2022 Mar - CY2024 Sep
      this.cachedString = `${pre}${ifShortYear(startYear)}${
        PeriodConfig.stringMonthPad
      }${months[startMonth]}${PeriodConfig.stringDateRangePad}-${
        PeriodConfig.stringDateRangePad
      }${pre}${ifShortYear(endYear)}${PeriodConfig.stringMonthPad}${
        months[endMonth]
      }`;
    }

    return this.cachedString;
  }

  getEndYearMonth(): number {
    return this.endYearMonth;
  }

  getStartYearMonth(): number {
    return this.startYearMonth;
  }
}

/**
 * A calendar or fiscal Month period
 */
export class Month extends Period implements IPeriod {
  constructor(kind = YearKind.CY, year: number, ordinal: number) {
    const month = checkMonth(ordinal);
    let calendarYear = year;
    if (kind === YearKind.FY && month >= PeriodConfig.fiscalYearStartMonth) {
      calendarYear = year - 1;
    }
    super(kind, calendarYear, month, -1, month);
  }

  toCalendar(): IPeriod {
    if (this.isFiscalPeriod()) {
      return new Month(YearKind.CY, ...yearAndMonth(this.startYearMonth));
    }
    return this;
  }

  toFiscal(): IPeriod {
    if (this.isCalendarPeriod()) {
      return new Month(
        YearKind.FY,
        this.getStartFiscalYear(),
        this.getStartCalendarMonth()
      );
    }
    return this;
  }
}

/**
 * A calendar or fiscal Quarter period
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
    const [startMonth, yearAdjustment] = subtractMonths(endMonth, 2);
    super(
      kind,
      calendarYear + yearAdjustment,
      startMonth,
      calendarYear,
      endMonth
    );
  }

  /**
   * @returns the half ordinal, in [1..2], that this quarter is in relative to
   *          its calendar or fiscal year
   */
  inHalf(): number {
    const monthOrdinal = this.isCalendarPeriod()
      ? this.getStartCalendarMonth()
      : this.getStartFiscalMonth();
    if (monthOrdinal === 1 || monthOrdinal === 4) {
      return 1;
    } else {
      return 2;
    }
  }

  /**
   * Determine if this and quarter can be combined into a half
   *
   * @param quarter another Quarter
   * @returns true if the quarters are adjacent and in the same half of their
   *          calendar or fiscal year
   */
  inSameHalfAs(quarter: Quarter): boolean {
    return (
      this.kind === quarter.kind &&
      this.inHalf() === quarter.inHalf() &&
      (tickMonth(this.endYearMonth) === quarter.startYearMonth ||
        tickMonth(quarter.endYearMonth) === this.startYearMonth)
    );
  }

  /**
   * When combining Quarters, they will be combined into a new Half, if possible
   *
   * @returns a new Half or Period
   */
  newPeriodCombinedWith(period: IPeriod): IPeriod {
    if (!(period instanceof Quarter)) {
      return super.newPeriodCombinedWith(period);
    }
    if (this.inSameHalfAs(period as Quarter)) {
      const startYear = this.isCalendarPeriod()
        ? period.getStartCalendarYear()
        : period.getStartFiscalYear();
      return new Half(this.kind, startYear, this.inHalf());
    } else {
      return super.newPeriodCombinedWith(period);
    }
  }

  /**
   * When combining Quarters, they will be combined into a new Half, if possible
   *
   * @returns a new Half or Period
   */
  newPeriodFrom(from: IPeriod): IPeriod {
    if (!(from instanceof Quarter)) {
      return super.newPeriodFrom(from);
    }
    if (this.startsBefore(from)) {
      throw new Error(
        '`from` must start before `this` and `this` must end after `from`'
      );
    } else {
      return this.newPeriodCombinedWith(from);
    }
  }

  /**
   * When combining Quarters, they will be combined into a new Half, if possible
   *
   * @returns a new Half or Period
   */
  newPeriodTo(to: IPeriod): IPeriod {
    if (!(to instanceof Quarter)) {
      return super.newPeriodTo(to);
    }
    if (to.startsBefore(this)) {
      throw new Error(
        '`this` must start before `to` and `to` must end after `this`'
      );
    } else {
      return this.newPeriodCombinedWith(to);
    }
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
        return new Quarter(
          YearKind.FY,
          this.getStartFiscalYear(),
          Math.ceil(this.getStartFiscalMonth() / 3)
        );
      } else {
        return super.toFiscal();
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
    this.cachedString = `${pre}${ifShortYear(year)}${
      PeriodConfig.stringHalfAndQuarterPad
    }Q${Math.ceil(month / 3)}`;
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
    const [startMonth, yearAdjustment] = subtractMonths(endMonth, 5);
    super(
      kind,
      calendarYear + yearAdjustment,
      startMonth,
      calendarYear,
      endMonth
    );
  }

  /**
   * Halves always divide into quarters
   */
  divide(): Quarter[] {
    const quarters: Quarter[] = [];
    const year = this.isCalendarPeriod()
      ? this.getStartCalendarYear()
      : this.getStartFiscalYear();
    const quarter = this.isCalendarPeriod()
      ? Math.ceil(this.getStartCalendarMonth() / 3)
      : Math.ceil(this.getStartFiscalMonth() / 3);
    quarters.push(new Quarter(this.kind, year, quarter));
    quarters.push(new Quarter(this.kind, year, quarter + 1));
    return quarters;
  }

  /**
   * Determine if this and half can be combined into a year
   *
   * @param half another Half
   * @returns true if the halves are adjacent and in the same calendar or
   *          fiscal year of their
   */
  isPartOfSameYearAs(half: Half): boolean {
    if (
      this.kind !== half.kind ||
      this.getStartCalendarMonth() === half.getStartCalendarMonth()
    ) {
      return false;
    }
    if (this.isCalendarPeriod()) {
      return this.getStartCalendarYear() === half.getStartCalendarYear();
    } else {
      return this.getStartFiscalYear() === half.getStartFiscalYear();
    }
  }

  /**
   * When combining Quarters, they will be combined into a new Half, if possible
   *
   * @returns a new Half or Period
   */
  newPeriodCombinedWith(period: IPeriod): IPeriod {
    if (!(period instanceof Half)) {
      return super.newPeriodCombinedWith(period);
    }
    if (this.isPartOfSameYearAs(period as Half)) {
      const startYear = this.isCalendarPeriod()
        ? period.getStartCalendarYear()
        : period.getStartFiscalYear();
      return new Year(this.kind, startYear);
    } else {
      return super.newPeriodCombinedWith(period);
    }
  }

  /**
   * When combining Halves, they will be combined into a new Year, if possible
   *
   * @returns a new Year or Period
   */
  newPeriodFrom(from: IPeriod): IPeriod {
    if (!(from instanceof Half)) {
      return super.newPeriodFrom(from);
    }
    if (this.startsBefore(from) || from.endsAfter(this)) {
      throw new Error(
        '`from` must start before `this` and `this` must end after `from`'
      );
    } else {
      return this.newPeriodCombinedWith(from);
    }
  }

  /**
   * When combining Halves, they will be combined into a new Year, if possible
   *
   * @returns a new Year or Period
   */
  newPeriodTo(to: IPeriod): IPeriod {
    if (!(to instanceof Half)) {
      return super.newPeriodTo(to);
    }
    if (to.startsBefore(this) || this.endsAfter(to)) {
      throw new Error(
        '`this` must start before `to` and `to` must end after `this`'
      );
    } else {
      return this.newPeriodCombinedWith(to);
    }
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
        return super.toFiscal();
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
    this.cachedString = `${pre}${ifShortYear(year)}${
      PeriodConfig.stringHalfAndQuarterPad
    }H${Math.ceil(month / 6)}`;
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
    super(kind, calendarYear, startMonth, -1, endMonth);
  }

  /**
   * Years always divides into halves
   */
  divide(): Half[] {
    const halves: Half[] = [];
    const year = this.isCalendarPeriod()
      ? this.getStartCalendarYear()
      : this.getStartFiscalYear();
    halves.push(new Half(this.kind, year, 1));
    halves.push(new Half(this.kind, year, 2));
    return halves;
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
        return new Period(YearKind.CY, year, startMonth, -1, endMonth);
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
        return new Period(YearKind.FY, startYear, startMonth, -1, endMonth);
      }
    }
    return this;
  }

  toString(): string {
    if (this.cachedString !== undefined) {
      return this.cachedString;
    }
    if (this.isCalendarPeriod()) {
      this.cachedString = `CY${ifShortYear(
        yearAndMonth(this.startYearMonth)[0]
      )}`;
    } else {
      this.cachedString = `FY${ifShortYear(
        calendarToFiscal(
          ...yearAndMonth(this.startYearMonth),
          PeriodConfig.fiscalYearStartMonth
        )[0]
      )}`;
    }
    return this.cachedString;
  }
}

export class _TBD extends Period implements IPeriod {
  constructor() {
    super(YearKind.CY, 9999, 11, -1, 11);
  }

  toCalendar(): IPeriod {
    return this;
  }

  toFiscal(): IPeriod {
    return this;
  }

  toString(): string {
    return `${PeriodConfig.stringTBDPad}TBD`;
  }
}

export class _Unknown extends Period implements IPeriod {
  constructor() {
    super(YearKind.CY, 9999, 12, -1, 12);
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
