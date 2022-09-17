import {
  Half,
  Month,
  Quarter,
  Year,
  YearKind,
} from './core';
import {
  IPeriod,
} from './interface';
import {
  calendarToFiscal,
} from './math';

export function CY(
  year: number,
  func: (
    year: number,
    kind: YearKind,
    fiscalYearStartMonth: number
  ) => IPeriod = Y,
  fiscalYearStartMonth = 7
): IPeriod {
  return func(year, YearKind.CY, fiscalYearStartMonth);
}

export function FY(
  year: number,
  func: (
    year: number,
    kind: YearKind,
    fiscalYearStartMonth: number
  ) => IPeriod = Y,
  fiscalYearStartMonth = 7
): IPeriod {
  return func(year, YearKind.FY, fiscalYearStartMonth);
}

export function Jan(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 1, fiscalYearStartMonth);
}

export function Feb(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 2, fiscalYearStartMonth);
}

export function Mar(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 3, fiscalYearStartMonth);
}

export function Apr(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 4, fiscalYearStartMonth);
}

export function May(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 5, fiscalYearStartMonth);
}

export function Jun(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 6, fiscalYearStartMonth);
}

export function Jul(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 7, fiscalYearStartMonth);
}

export function Aug(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 8, fiscalYearStartMonth);
}

export function Sep(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 9, fiscalYearStartMonth);
}

export function Oct(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 10, fiscalYearStartMonth);
}

export function Nov(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 11, fiscalYearStartMonth);
}

export function Dec(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Month(kind, year, 12, fiscalYearStartMonth);
}

export function Q1(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Quarter(kind, year, 1, fiscalYearStartMonth);
}

export function Q2(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Quarter(kind, year, 2, fiscalYearStartMonth);
}

export function Q3(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Quarter(kind, year, 3, fiscalYearStartMonth);
}

export function Q4(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Quarter(kind, year, 4, fiscalYearStartMonth);
}

export function H1(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Half(kind, year, 1, fiscalYearStartMonth);
}

export function H2(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Half(kind, year, 2, fiscalYearStartMonth);
}

export function Y(
  year: number,
  kind: YearKind = YearKind.CY,
  fiscalYearStartMonth = 7
): IPeriod {
  return new Year(kind, year, fiscalYearStartMonth);
}

/**
 * Creates a Period for the current half, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current half
 */
export function currentHalf(
  kind = YearKind.CY,
  fiscalYearStartMonth = 7
): Half {
  const date = new Date();
  let year = date.getUTCFullYear();
  let monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year, monthOrdinal] = calendarToFiscal(
      year,
      monthOrdinal,
      fiscalYearStartMonth
    );
  }
  return new Half(kind, year, Math.ceil(monthOrdinal / 6));
}

/**
 * Creates a Period for the current month, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current month
 */
export function currentMonth(
  kind = YearKind.CY,
  fiscalYearStartMonth = 7
): Month {
  const date = new Date();
  let year = date.getUTCFullYear();
  const monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year] = calendarToFiscal(year, monthOrdinal, fiscalYearStartMonth);
  }
  return new Month(kind, year, monthOrdinal);
}

/**
 * Creates a Period for the current quarter, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current quarter
 */
export function currentQuarter(
  kind = YearKind.CY,
  fiscalYearStartMonth = 7
): Quarter {
  const date = new Date();
  let year = date.getUTCFullYear();
  let monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year, monthOrdinal] = calendarToFiscal(
      year,
      monthOrdinal,
      fiscalYearStartMonth
    );
  }
  return new Quarter(kind, year, Math.ceil(monthOrdinal / 3));
}

/**
 * Creates a Period for the current year, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current year
 */
export function currentYear(
  kind = YearKind.CY,
  fiscalYearStartMonth = 7
): Year {
  const date = new Date();
  let year = date.getUTCFullYear();
  if (kind === YearKind.FY) {
    [year] = calendarToFiscal(
      year,
      date.getUTCMonth() + 1,
      fiscalYearStartMonth
    );
  }
  return new Year(kind, year);
}
