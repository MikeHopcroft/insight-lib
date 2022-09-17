import {Half, Month, Quarter, Year, _TBD, _Unknown, YearKind} from './core';
import {IPeriod, PeriodConfig} from './interface';
import {calendarToFiscal} from './math';

type periodFunc = (year: number, kind: YearKind) => IPeriod;

/**
 * Part of a literate interface for constructing new calendar years
 *
 * Helper function examples:
 *    CY(2023, Sep)
 *    CY(23, H2)
 *    CY(2023, Q3)
 *    CY(23)
 *
 * @param year the calendar year
 * @param part the period function corresponding to the desired period
 * @returns the new period described by the combination of the calendar year
 *          and the period function
 */
export function CY(year: number, part: periodFunc = Y): IPeriod {
  return part(year, YearKind.CY);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * Helper function examples:
 *    FY(23, Sep)
 *    FY(2023, H1)
 *    FY(23, Q1)
 *    FY(2023)
 *
 * @param year the fiscal year
 * @param func the period function corresponding to the desired period
 * @returns the new period described by the combination of the fiscal year
 *          and the period function
 */
export function FY(year: number, func: periodFunc = Y): IPeriod {
  return func(year, YearKind.FY);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Jan(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 1);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Feb(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 2);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Mar(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 3);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Apr(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 4);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function May(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 5);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Jun(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 6);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Jul(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 7);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Aug(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 8);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Sep(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 9);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Oct(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 10);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Nov(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 11);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Dec(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Month(kind, year, 12);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Q1(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 1);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Q2(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 2);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Q3(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 3);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Q4(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Quarter(kind, year, 4);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function H1(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Half(kind, year, 1);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function H2(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Half(kind, year, 2);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Y(year: number, kind: YearKind = YearKind.CY): IPeriod {
  return new Year(kind, year);
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function TBD(): IPeriod {
  return new _TBD();
}

/**
 * Part of a literate interface for constructing new fiscal years
 *
 * See CY() and FY() for examples.
 */
export function Unknown(): IPeriod {
  return new _Unknown();
}

/**
 * Creates a Period for the current half, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current half
 */
export function currentHalf(
  kind = YearKind.CY
): Half {
  const date = new Date();
  let year = date.getUTCFullYear();
  let monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year, monthOrdinal] = calendarToFiscal(
      year,
      monthOrdinal,
      PeriodConfig.fiscalYearStartMonth
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
  kind = YearKind.CY
): Month {
  const date = new Date();
  let year = date.getUTCFullYear();
  const monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year] = calendarToFiscal(
      year, monthOrdinal,
      PeriodConfig.fiscalYearStartMonth
    );
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
  kind = YearKind.CY
): Quarter {
  const date = new Date();
  let year = date.getUTCFullYear();
  let monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year, monthOrdinal] = calendarToFiscal(
      year,
      monthOrdinal,
      PeriodConfig.fiscalYearStartMonth
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
  kind = YearKind.CY
): Year {
  const date = new Date();
  let year = date.getUTCFullYear();
  if (kind === YearKind.FY) {
    [year] = calendarToFiscal(
      year,
      date.getUTCMonth() + 1,
      PeriodConfig.fiscalYearStartMonth
    );
  }
  return new Year(kind, year);
}
