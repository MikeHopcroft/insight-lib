/**
 * Supports common 'FY22 H1'-style date formats
 *
 * Deliverables and other business concepts in Microsoft are frequently
 * associated with business periods, like 'FY2023 Q2' or 'CY22 Nov'.
 * Period provides forgiving parsing of common string representations,
 * creates canonical string representations, and uses a common internal
 * representation to allow comparison of any twovPeriods.
 */
export interface IPeriod {

  /**
   * compare is designed to support sorting of Periods for display
   * so that longer Periods sort before Periods they contain.
   *
   * @param date the date to compare against
   * @return < 0  if this should sort before date
   *         == 0 if this and date should sort together
   *         > 0  if this should sort after date
   */
  compare(date: IPeriod): number;

  /**
   * @returns true if this period includes all of the months in date
   */
  contains(date: IPeriod): boolean;

  /**
   * The Periods may overlap
   * 
   * @returns true if this period ends after date ends
   */
  endsAfter(date: IPeriod): boolean;

  /**
   * The Periods map overlap
   * 
   * @returns true if this period ends before date ends
   */
  endsBefore(date: IPeriod): boolean;
  
  /**
   * @returns true if this period ends the same calendar year and month
   *          as date
   */
  endsSameMonth(date: IPeriod): boolean;

  /**
   * @returns true if this period and date have the same internal
   *          representation and would produce the same canonical string
   */
  equals(date: IPeriod): boolean;

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
   * @returns true if this period starts after date ends
   */
  isAfter(date: IPeriod): boolean;

  /**
   * The periods do not overlap
   * 
   * @returns true if this period ends before date starts
   */
  isBefore(date: IPeriod): boolean;

  /**
   * @returns true if this is a calendar year period
   */
  isCalendarPeriod(): boolean;

  /**
   * @returns true if this is a fiscal year period
   */
  isFiscalPeriod(): boolean;

  /**
   * The periods may overlap
   * 
   * @returns true if this Period starts after date starts
   */
  startsAfter(date: IPeriod): boolean;

  /**
   * The periods may overlap
   * 
   * @returns true if this Period starts before date starts
   */
  startsBefore(date: IPeriod): boolean;
  
  /**
   * @returns true if this Period starts the same calendar year and month
   *          as date
   */
  startsSameMonth(date: IPeriod): boolean;

  /**
   * Transforms the period to a calendar period representing the same date
   * range. If the period is already a calendar date, toCalendar returns this.
   *
   * Depending on the fiscal start year alignment with calendar years, the
   * period returned may be a month range, instead of a named range like 'H1'.
   * 
   * @returns this period transformed into a calendar year period
   */
  toCalendar(): IPeriod;

/**
   * Transforms the period to a fiscal period representing the same date
   * range. If the period is already a fiscal date, toFiscal returns this.
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
 * Used to configure the fiscal start month relative to a calendar year,
 * 7 is July
 */
export class PeriodConfig {
  static fiscalYearStartMonth = 7;
}
