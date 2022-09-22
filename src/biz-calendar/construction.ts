import {Half, Month, Period, Quarter, Year, _TBD, _Unknown} from './core';
import {IPeriod, PeriodConfig, YearKind} from './interface';
import {addMonths, calendarToFiscal, tickMonth, yearAndMonth} from './math';

export type periodFunction = (year: number, kind: YearKind) => IPeriod;
type yearFunction = (year: number, part: periodFunction) => IPeriod;

/*
   See buildCalendarForPeriod() for documentation on how these Symbols and
   DivisionGranularity are used and interpreted.
 */
export const Years = Symbol('12');
export const Halves = Symbol('6');
export const Quarters = Symbol('3');
export const Months = Symbol('1');
export type CalendarGranularity =
  | typeof Years
  | typeof Halves
  | typeof Quarters
  | typeof Months;

const months: {[key: string]: number} = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

/**
 * Part of a literate interface for constructing new calendar years
 *
 * Helper function examples:
 *    CY(2023, Sep)
 *    CY(23, H2)
 *    CY(2023, Q3)
 *    CY(23)
 *    CY(2022, Range(Jan, Mar))
 *
 * @param year the calendar year
 * @param part the period function corresponding to the desired period
 * @returns the new period described by the combination of the calendar year
 *          and the period function
 */
export function CY(year: number, part: periodFunction = Y): IPeriod {
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
 *    FY(2023, Range(Oct, Nov))
 *
 * @param year the fiscal year
 * @param func the period function corresponding to the desired period
 * @returns the new period described by the combination of the fiscal year
 *          and the period function
 */
export function FY(year: number, func: periodFunction = Y): IPeriod {
  return func(year, YearKind.FY);
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
export function Range(
  start: periodFunction,
  end: periodFunction
): periodFunction {
  const startMonth = months[start.name];
  const endMonth = months[end.name];
  return (year: number, kind: YearKind): IPeriod => {
    let calendarYear = year;
    if (
      kind === YearKind.FY &&
      startMonth >= PeriodConfig.fiscalYearStartMonth
    ) {
      calendarYear = year - 1;
    }
    return new Period(kind, calendarYear, startMonth, -1, endMonth);
  };
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
 * Creates periods that represent dividing this period into periods of the
 * specified granularity
 *
 * buildCalendarForPeriod will build the calendar required to at least cover
 * the months in Period along with any intermediate levels that would be needed
 * for consistent calendar levels.
 *
 * @param granularity buildCalendarForPeriod will divide the period to the
 *        specified granularity
 * @param includeIntermediateLevels buildCalendarForPeriod can return only the
 *        lowest level of granularity or the full tree of intermediate periods
 *        created under this period
 * @returns sub-periods of this period
 */
export function buildCalendarForPeriod(
  period: IPeriod,
  granularity: CalendarGranularity,
  includeIntermediateLevels = false
): IPeriod[] {
  if (granularity === Months && !includeIntermediateLevels) {
    return period.toMonths();
  }

  const calendar = new CalendarBuilder(
    period,
    granularity,
    includeIntermediateLevels
  ).build();
  return calendar.sort((p1, p2) => {
    return p1.compare(p2);
  });
}

/**
 * Creates a Period for the current half, UTC
 *
 * @param kind calendar year or fiscal year
 * @returns a Period representing the current half
 */
export function currentHalf(kind = YearKind.CY): Half {
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
export function currentMonth(kind = YearKind.CY): Month {
  const date = new Date();
  let year = date.getUTCFullYear();
  const monthOrdinal = date.getUTCMonth() + 1;
  if (kind === YearKind.FY) {
    [year] = calendarToFiscal(
      year,
      monthOrdinal,
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
export function currentQuarter(kind = YearKind.CY): Quarter {
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
export function currentYear(kind = YearKind.CY): Year {
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

/**
 * Builds a "calendar" of Periods that cover a specific period at the specified
 * granularity
 */
class CalendarBuilder {
  // CalendarBuilder configures a table of period functions to enable building
  // the calendar via a single pass over the dates in the range
  buildFunctions: periodFunction[][] = [
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
    [],
  ];
  currentYear: number;
  granularity: CalendarGranularity;
  period: IPeriod;
  yearFunction: yearFunction;

  /**
   * Configures this CalendarBuilder to create the calendar described by the
   * parameters
   *
   * @param period the period for which to construct a calendar
   * @param granularity the types of periods to include in the calendar
   * @param buildIntermediate if true, the calendar will include the longer
   *        periods above the specified granularity
   */
  constructor(
    period: IPeriod,
    granularity: CalendarGranularity,
    buildIntermediate = false
  ) {
    this.period = period;
    this.granularity = granularity;
    if (period.isFiscalPeriod()) {
      this.yearFunction = FY;
      this.currentYear = period.getStartFiscalYear();
    } else {
      this.yearFunction = CY;
      this.currentYear = period.getStartCalendarYear();
    }

    // Build functions map
    const yearStart = period.isCalendarPeriod()
      ? 0
      : PeriodConfig.fiscalYearStartMonth - 1;
    if (granularity === Months) {
      this.buildFunctions[1].push(Jan);
      this.buildFunctions[2].push(Feb);
      this.buildFunctions[3].push(Mar);
      this.buildFunctions[4].push(Apr);
      this.buildFunctions[5].push(May);
      this.buildFunctions[6].push(Jun);
      this.buildFunctions[7].push(Jul);
      this.buildFunctions[8].push(Aug);
      this.buildFunctions[9].push(Sep);
      this.buildFunctions[10].push(Oct);
      this.buildFunctions[11].push(Nov);
      this.buildFunctions[12].push(Dec);
    }
    if (
      granularity === Quarters ||
      (granularity === Months && buildIntermediate)
    ) {
      this.buildFunctions[addMonths(3, yearStart)[0]].push(Q1);
      this.buildFunctions[addMonths(6, yearStart)[0]].push(Q2);
      this.buildFunctions[addMonths(9, yearStart)[0]].push(Q3);
      this.buildFunctions[addMonths(12, yearStart)[0]].push(Q4);
    }
    if (
      granularity === Halves ||
      ([Quarters, Months].includes(granularity) && buildIntermediate)
    ) {
      this.buildFunctions[addMonths(6, yearStart)[0]].push(H1);
      this.buildFunctions[addMonths(12, yearStart)[0]].push(H2);
    }
    if (granularity === Years || buildIntermediate) {
      this.buildFunctions[addMonths(12, yearStart)[0]].push(Y);
    }

    // catch year transitions
    this.buildFunctions[addMonths(12, yearStart)[0]].push(nextYear);
  }

  /**
   * For each month in the period range, generates the periods required for
   * the calendar, if any
   *
   * build() also takes care of providing closing periods to fully cover
   * the range.  
   *
   * @returns the periods for the calendar described by this CalendarBuilder's
   *          properties
   */
  build(): IPeriod[] {
    const calendar: IPeriod[] = [];
    for (
      let yearMonth = this.period.getStartYearMonth();
      yearMonth <= this.period.getEndYearMonth();
      yearMonth = tickMonth(yearMonth)
    ) {
      calendar.push(...this.step(yearMonth));
    }

    const lastPushed = calendar[calendar.length - 1];
    if (lastPushed.getEndYearMonth() !== this.period.getEndYearMonth()) {
      calendar.push(...this.coverFrom(tickMonth(lastPushed.getEndYearMonth())));
    }
    return calendar;
  }

  step(yearMonth: number): IPeriod[] {
    const newPeriods: IPeriod[] = [];
    const [, month] = yearAndMonth(yearMonth);
    for (const buildFunction of this.buildFunctions[month]) {
      const period = this.yearFunction(this.currentYear, buildFunction);
      if (period instanceof NextYearMarker) {
        this.currentYear += 1;
      } else {
        newPeriods.push(period);
      }
    }
    return newPeriods;
  }

  /**
   * Adds any additional periods required to cover the range at
   * the specified granularity
   *
   * @param startYearMonth the month from which to start covering
   * @returns the final periods for the calendar, if required
   */
  coverFrom(startYearMonth: number): IPeriod[] {
    const cover: IPeriod[] = [];
    let quarter: IPeriod = new CoverMarker();
    let half: IPeriod = new CoverMarker();
    let year: IPeriod = new CoverMarker();
    let yearMonth = startYearMonth;
    for (let i = 0; i < 12; i++) {
      const candidates = this.step(yearMonth);
      for (const candidate of candidates) {
        if (candidate instanceof Quarter && quarter instanceof CoverMarker) {
          quarter = candidate;
        }
        if (candidate instanceof Half && half instanceof CoverMarker) {
          half = candidate;
        }
        if (candidate instanceof Year && year instanceof CoverMarker) {
          year = candidate;
        }
      }
      yearMonth = tickMonth(yearMonth);
    }
    if (quarter instanceof Quarter) {
      cover.push(quarter);
    }
    if (half instanceof Half) {
      cover.push(half);
    }
    if (year instanceof Year) {
      cover.push(year);
    }
    return cover;
  }
}

// The below types and function are used by CalendarBuilder

class CoverMarker extends Period implements IPeriod {}

class NextYearMarker extends Period implements IPeriod {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function nextYear(_year: number, _kind: YearKind): IPeriod {
  return new NextYearMarker();
}
