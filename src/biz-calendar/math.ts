import {YearKind} from './core';
import {PeriodConfig} from './interface';

/**
 * @param month starting month ordinal
 * @param add number of months to add
 * @returns the new month ordinal and any year adjustment implied (e.g. -1)
 */
export function addMonths(month: number, add: number): [number, number] {
  if (month < 1 || month > 12) {
    throw new Error(`cannot add months to ${month}`);
  }
  if (add < 0) {
    return subtractMonths(month, -add);
  }
  let result = month + add;
  const yearDiff = Math.floor(result / 12);
  result = result % 12;
  if (result === 0) {
    result = 12;
  }
  return [result, yearDiff];
}

/**
 * Computes the fiscal year and fiscal month ordinal from calendar year and
 * month
 *
 * @param calendarYear the calendar year
 * @param calendarMonth the month ordinal in [1..12]
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
  if (calendarMonth >= fiscalStart) {
    return [calendarYear + 1, fiscalMonth];
  } else {
    return [calendarYear, fiscalMonth];
  }
}

/**
 * Required due to enum type erasure
 *
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
  // -1 is necessary to support FY0
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
 * Computes the length of a period range in months
 *
 * @param from the yearMonth starting the range
 * @param to the yearMonth ending the range
 * @returns the number of months included in the range [from..to]
 *
 * @throws Error if to is before from
 */
export function lengthInMonths(from: number, to: number): number {
  if (from > to) {
    throw new Error(`from ${from} cannot be before ${to}`);
  }
  if (from === to) {
    // single month
    return 1;
  }
  const [fromYear, fromMonth] = yearAndMonth(from);
  const [toYear, toMonth] = yearAndMonth(to);
  const years = toYear - fromYear;
  const months = toMonth - fromMonth; // could be negative
  return years * 12 + months + 1; // ranges are inclusive
}

/**
 * @param month starting month ordinal
 * @param subtract number of months to subtract
 * @returns the new month ordinal and any year adjustment implied (e.g. -1)
 */
export function subtractMonths(
  month: number,
  subtract: number
): [number, number] {
  if (month < 1 || month > 12) {
    throw new Error(`cannot subtract months from ${month}`);
  }
  let result = month - subtract;
  if (result > 0) {
    return [result, 0];
  }
  if (result === 0) {
    return [12, -1];
  }
  const yearDiff = Math.floor(result / 12);
  result = result % 12;
  return [12 + result, yearDiff];
}

/**
 * Incrementer for YearMonths
 */
export function tickMonth(yearMonth: number): number {
  let nextMonth = yearMonth + 1;
  if (nextMonth % 100 === 13) {
    nextMonth += 88; // equivelant to + 100 - 12
  }
  return nextMonth;
}

/**
 * Converts the internal year + month ordinal representation into its separate
 * comoponents
 *
 * yearAndMonth is the inverse of yearMonth.
 */
export function yearAndMonth(yearMonth: number): [number, number] {
  return [Math.floor(yearMonth / 100), yearMonth % 100];
}

/**
 * Converts a separate year and month ordinal into the internal year + month
 * ordinal representation
 *
 * yearMonth is the inverse of yearAndMonth.
 */
export function yearMonth(year: number, month: number): number {
  return year * 100 + month;
}
