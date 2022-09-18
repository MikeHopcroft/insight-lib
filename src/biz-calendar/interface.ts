/**
 * Supports common 'FY22 H1'-style date formats
 *
 * Deliverables and other business concepts in Microsoft are frequently
 * associated with business periods, like 'FY2023 Q2' or 'CY22 Nov'.
 * This module provides forgiving parsing of common string representations,
 * creates canonical string representations, and uses a common internal
 * representation to allow comparison of any two IPeriods.
 */
export interface IPeriod {
  /**
   * compare is designed to support sorting of Periods for display
   * so that longer Periods sort before Periods they contain.
   *
   * @param period the period to compare against
   * @return < 0  if this should sort before period
   *         == 0 if this and period should sort together
   *         > 0  if this should sort after period
   */
  compare(period: IPeriod): number;

  /**
   * @returns true if this period includes all of the months in period
   */
  contains(period: IPeriod): boolean;

  /**
   * The Periods may overlap
   *
   * @returns true if this period ends after period ends
   */
  endsAfter(period: IPeriod): boolean;

  /**
   * The Periods map overlap
   *
   * @returns true if this period ends before period ends
   */
  endsBefore(period: IPeriod): boolean;

  /**
   * @returns true if this period ends the same calendar year and month
   *          as period
   */
  endsSameMonth(period: IPeriod): boolean;

  /**
   * @returns true if this period and period have the same internal
   *          representation and would produce the same canonical string
   */
  equals(period: IPeriod): boolean;

  /**
   * @returns the calendar month ordinal, in [1..12], associated with the end
   *          of this period
   */
  getEndCalendarMonth(): number;

  /**
   * @returns the calendar year associated with the end of this period
   */
  getEndCalendarYear(): number;

  /**
   * @returns the fiscal month ordinal, in [1..12], associated with the end of
   *          this period
   */
  getEndFiscalMonth(): number;

  /**
   * @returns the fiscal year associated with the end of this period
   */
  getEndFiscalYear(): number;

  /**
   * The end month maintains the CY/FY kind of this period
   *
   * @returns the month associated with the end of this period
   */
  getEndMonth(): IPeriod;

  /**
   * @returns the calendar month ordinal, in [1..12], associated with the start
   *          of this period
   */
  getStartCalendarMonth(): number;

  /**
   * @returns the calendar year associated with the start of this period
   */
  getStartCalendarYear(): number;

  /**
   * @returns the fiscal month ordinal, in [1..12], associated with the start of
   *          this period
   */
  getStartFiscalMonth(): number;

  /**
   * @returns the fiscal year associated with the start of this period
   */
  getStartFiscalYear(): number;

  /**
   * The start month maintains the CY/FY kind of this period
   *
   * @returns the month associated with the start of this period
   */
  getStartMonth(): IPeriod;

  /**
   * The periods do not overlap
   *
   * @returns true if this period starts after period ends
   */
  isAfter(period: IPeriod): boolean;

  /**
   * The periods do not overlap
   *
   * @returns true if this period ends before period starts
   */
  isBefore(period: IPeriod): boolean;

  /**
   * @returns true if this is a calendar year period
   */
  isCalendarPeriod(): boolean;

  /**
   * @returns true if this is a fiscal year period
   */
  isFiscalPeriod(): boolean;

  /**
   * Creates a new period spanning the two periods
   * 
   * The periods do not need to overlap or be calendar adjacent.
   * 
   * Some implementations of newPeriodCombinedWith may attempt intelligent
   * combinations, like joining consecutive quarters into a half.
   * 
   * @param period the period to combine with
   * @returns a new period with the kind of this, starting in the earlier start
   *          month and ending in the later end month
   */
  newPeriodCombinedWith(period: IPeriod): IPeriod;

  /**
   * Creates a new period spanning from the beginning of `from` to the end of
   * this period
   * 
   * The periods do not need to overlap or be calendar adjacent.
   * 
   * Some implementations of newPeriodCombinedWith may attempt intelligent
   * combinations, like joining consecutive quarters into a half.
   * 
   * @param from the period to combine with
   * @returns the new period
   * 
   * @throws Error if from starts after this starts or ends after this ends
   */
  newPeriodFrom(from: IPeriod): IPeriod;

  /**
   * Creates a new period spanning from the beginning of this period to the
   * end of `to`
   * 
   * The periods do not need to overlap or be calendar adjacent.
   * 
   * Some implementations of newPeriodCombinedWith may attempt intelligent
   * combinations, like joining consecutive quarters into a half.
   * 
   * @param to the period to combine with
   * @returns the new priod
   * 
   * @throws Error if this starts after to starts or ends after to ends
   */
  newPeriodTo(to: IPeriod): IPeriod;

  /**
   * The periods may overlap
   *
   * @returns true if this Period starts after period starts
   */
  startsAfter(period: IPeriod): boolean;

  /**
   * The periods may overlap
   *
   * @returns true if this Period starts before period starts
   */
  startsBefore(period: IPeriod): boolean;

  /**
   * @returns true if this Period starts the same calendar year and month
   *          as period
   */
  startsSameMonth(period: IPeriod): boolean;

  /**
   * Transforms the period to a calendar period representing the same period
   * range. If the period is already a calendar period, toCalendar returns this.
   *
   * Depending on the fiscal start year alignment with calendar years, the
   * period returned may be a month range, instead of a named range like 'H1'.
   *
   * @returns this period transformed into a calendar year period
   */
  toCalendar(): IPeriod;

  /**
   * Transforms the period to a fiscal period representing the same period
   * range. If the period is already a fiscal period, toFiscal returns this.
   *
   * Depending on the fiscal start year alignment with calendar years, the
   * period returned may be a month range, instead of a named range like 'H1'.
   *
   * @returns this period transformed into a fiscal year period
   */
  toFiscal(): IPeriod;

  /**
   * @returns this an array of the Months coverd by this Period
   */
  toMonths(): IPeriod[];

  /**
   * @returns the canonical string format for this Period
   */
  toString(): string;

  getEndYearMonth(): number;
  getStartYearMonth(): number;
}

/**
 * Used to configure the fiscal start month relative to a calendar year--7 is
 * July--and toString options.
 * 
 * As long as the pad options consist of only spaces, tabs, and/or new lines,
 * the parser will be able to parse strings generated by toString.
 */
export class PeriodConfig {

  /**
   * The ordinal for the calendar month in which the fiscal year starts,
   * in [1..12]. The default is 7 for July.
   */
  static fiscalYearStartMonth = 7;

  /**
   * The space used between years and Halves/Quarters when toString
   * is called on a Period. The default is a single space.
   */
  static stringHalfAndQuarterPad = ' ';

  /**
   * The space used between years and Months when toString is called on a
   * Period. The default is a single space.
   */
  static stringMonthPad = ' ';

  /**
   * The space used on either side of the dash in a range when toString is
   * called on a Period. The default is a single space.
   */
  static stringRangePad = ' ';

  /**
   * If true, toString produces strings with two-digit years (FY24), instead of
   * four-digit years.
   */
  static stringShortYear = false;

  /**
   * Leading whitespace to use at the beiginning of TBD strings.
   * The default is now whitespace.
   */
  static stringTBDPad = '';
}
