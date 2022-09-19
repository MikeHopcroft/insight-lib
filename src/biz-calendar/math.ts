import {YearKind} from './core';
import {PeriodConfig} from './interface';

/**
 * Computes the fiscal year and fiscal month from calendar year and month
 *
 * @param calendarYear the calendar year
 * @param calendarMonth the month ordinal, in [1..12]
 * @param fiscalStart the month ordinal, in [1..12], for the first month of the
 *        fiscal year relative to the calendar year
 * @returns the fiscal year and month
 */
export function calendarToFiscal(
  calendarYear: number,
  calendarMonth: number,
  fiscalStart: number
): [number, number] {
  if (fiscalStart === 1) {
    return [calendarYear, calendarMonth];
  }
  let fiscalMonth = calendarMonth - (fiscalStart - 1);
  if (fiscalMonth < 1) {
    fiscalMonth = 12 + fiscalMonth;
  }
  const fiscalYear =
    calendarMonth >= fiscalStart ? calendarYear + 1 : calendarYear;
  return [fiscalYear, fiscalMonth];
}

/**
 * @param kind a YearKind
 * @returns kind if it is valid
 *
 * @throws Error if not CY or FY
 */
export function checkKind(kind: YearKind): YearKind {
  if (kind !== YearKind.CY && kind !== YearKind.FY) {
    throw new Error(`${kind} is not a valid YearKind`);
  }
  return kind;
}

/**
 * @param month month ordinal to validate
 * @returns month if it is valid
 *
 * @throws Error if month is not valid
 */
export function checkMonth(month: number): number {
  if (1 > month || month > 12) {
    throw new Error(`${month} is not a month`);
  }
  return month;
}

/**
 * @param year year to validate
 * @returns year if it is valid
 *
 * @throws Error if year is not valid, year + 2000 if year is < 100
 */
export function checkYear(year: number): number {
  if (-1 > year || year > 9999) {
    throw new Error(`${year} is not a valid year`);
  }
  if (year < 100) {
    return 2000 + year;
  } else {
    return year;
  }
}

/**
 * Computes the calendar year and calendar month from fiscal year and month
 *
 * @param fiscalYear the fiscal year
 * @param fiscalMonth the month ordinal, in [1..12], where 1 is the fiscal
 *        start month
 * @param fiscalStart the month ordinal, in [1..12], for the first month of the
 *        fiscal year relative to the calendar year
 * @returns the fiscal year and month
 */
export function fiscalToCalendar(
  fiscalYear: number,
  fiscalMonth: number,
  fiscalStart: number
): [number, number] {
  if (fiscalStart === 1) {
    return [fiscalYear, fiscalMonth];
  }
  const calendarYear =
    fiscalStart + fiscalMonth <= 13 ? fiscalYear - 1 : fiscalYear;
  let calendarMonth = fiscalStart - 1 + fiscalMonth;
  if (calendarMonth > 12) {
    calendarMonth = calendarMonth % 12;
    if (calendarMonth === 0) {
      calendarMonth = 1;
    }
  }
  return [calendarYear, calendarMonth];
}

/**
 * @returns the short form of year, if PeriodConfig.stringShortYear is true
 */
export function ifShortYear(year: number): number {
  if (PeriodConfig.stringShortYear) {
    return year % 100;
  } else {
    return year;
  }
}

/**
 * Inverse of yearMonth
 */
export function yearAndMonth(yearMonth: number): [number, number] {
  return [Math.floor(yearMonth / 100), yearMonth % 100];
}

/**
 * Inverse of yearAndMonth
 */
export function yearMonth(year: number, month: number): number {
  return year * 100 + month;
}

/**
 * Incrementer for YearMonths
 */
export function tickMonth(yearMonth: number): number {
  let nextMonth = yearMonth + 1;
  if (nextMonth % 100 === 13) {
    nextMonth += 88;
  }
  return nextMonth;
}
