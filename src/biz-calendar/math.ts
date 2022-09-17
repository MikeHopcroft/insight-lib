/**
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
  const fiscalYear =
    calendarMonth >= fiscalStart ? calendarYear + 1 : calendarYear;
  const fiscalMonth = ((fiscalStart + calendarMonth - 2) % 12) + 1;
  return [fiscalYear, fiscalMonth];
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
  if (1 > year || year > 9999) {
    throw new Error(`${year} is not a valid year`);
  }
  if (year < 100) {
    return 2000 + year;
  } else {
    return year;
  }
}

/**
 * @param fiscalYearMonth the fiscal year and month ordinal, in [1..12], where
 *        1 is aligned with fiscalStart
 * @param fiscalStart the month ordinal, in [1..12], for the first month of the
 *        fiscal year relative to the calendar year
 * @returns the calendar year and month
 */
export function fiscalToCalendar(
  fiscalYear: number,
  fiscalMonth: number,
  fiscalStart: number
): [number, number] {
  const calendarYear =
    fiscalStart + fiscalMonth <= 13 ? fiscalYear - 1 : fiscalYear;
  let calendarMonth = fiscalMonth - fiscalStart + 1;
  calendarMonth = calendarMonth < 1 ? 12 + calendarMonth : calendarMonth;
  return [calendarYear, calendarMonth];
}

export function yearAndMonth(yearMonth: number): [number, number] {
  return [Math.floor(yearMonth / 100), yearMonth % 100];
}

export function yearMonth(year: number, month: number): number {
  return year * 100 + month;
}
