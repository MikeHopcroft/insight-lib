import {
  TBD,
  Unknown,
  CY,
  FY,
  Jan,
  Feb,
  Mar,
  Apr,
  May,
  Jun,
  Jul,
  Aug,
  Sep,
  Oct,
  Nov,
  Dec,
  Q1,
  Q2,
  Q3,
  Q4,
  H1,
  H2,
  Y,
  Range,
  currentHalf,
  currentMonth,
  currentQuarter,
  currentYear,
  Years,
  Halves,
  Quarters,
  Months,
  buildCalendarForPeriod,
} from '../../src/biz-calendar';
import {Half, Month, Quarter, Year} from '../../src/biz-calendar/core';
import {YearKind as K} from '../../src/biz-calendar/interface';
import {pObj} from './test-support';

describe('constructing business periods', () => {
  test('fiscal year', () => {
    expect(FY(2024)).toMatchObject(pObj(K.FY, 202307, 202406));
  });

  test('fiscal year half', () => {
    expect(FY(2023, H1)).toMatchObject(pObj(K.FY, 202207, 202212));
  });

  test('fiscal year quarter', () => {
    expect(FY(1988, Q1)).toMatchObject(pObj(K.FY, 198707, 198709));
  });

  test('fiscal year quarter with big year', () => {
    expect(FY(9997, Q2)).toMatchObject(pObj(K.FY, 999610, 999612));
  });

  test('fiscal year month', () => {
    expect(FY(3089, Apr)).toMatchObject(pObj(K.FY, 308904, 308904));
  });

  test('fiscal year month with short year', () => {
    expect(FY(24, Mar)).toMatchObject(pObj(K.FY, 202403, 202403));
  });

  test('calendar year', () => {
    expect(CY(19)).toMatchObject(pObj(K.CY, 201901, 201912));
  });

  test('calendar year with explicit year', () => {
    expect(CY(2023, Y)).toMatchObject(pObj(K.CY, 202301, 202312));
  });

  test('calendar year half', () => {
    expect(CY(2047, H2)).toMatchObject(pObj(K.CY, 204707, 204712));
  });

  test('calendar year quarter', () => {
    expect(CY(2022, Q4)).toMatchObject(pObj(K.CY, 202210, 202212));
  });

  test('calendar year quarter with short year', () => {
    expect(CY(7, Q3)).toMatchObject(pObj(K.CY, 200707, 200709));
  });

  test('calendar year month', () => {
    expect(CY(2022, Sep)).toMatchObject(pObj(K.CY, 202209, 202209));
  });

  test('calendar year month with odd year', () => {
    expect(CY(101, Jan)).toMatchObject(pObj(K.CY, 10101, 10101));
  });

  test('TBD', () => {
    expect(TBD()).toMatchObject(pObj(K.CY, 999911, 999911));
  });

  test('Unknown', () => {
    expect(Unknown()).toMatchObject(pObj(K.CY, 999912, 999912));
  });
});

describe('constructing periods with month ranges', () => {
  test('basic month range', () => {
    expect(CY(22, Range(Jun, Dec))).toMatchObject(pObj(K.CY, 202206, 202212));
  });

  test('basic fiscal month range', () => {
    expect(FY(22, Range(Jul, Nov))).toMatchObject(pObj(K.FY, 202107, 202111));
  });

  test('fiscal month range across calendar year end', () => {
    expect(FY(2022, Range(Aug, Feb))).toMatchObject(pObj(K.FY, 202108, 202202));
  });

  test('calendar month range across calendar year end', () => {
    expect(CY(22, Range(Oct, May))).toMatchObject(pObj(K.CY, 202210, 202305));
  });
});

describe('constructing current business periods', () => {
  test('current calendar Month', () => {
    const month = currentMonth();
    expect(month).toBeInstanceOf(Month);
    expect(month.isCalendarPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current fiscal Month', () => {
    const month = currentMonth(K.FY);
    expect(month).toBeInstanceOf(Month);
    expect(month.isFiscalPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current calendar Quarter', () => {
    const month = currentQuarter();
    expect(month).toBeInstanceOf(Quarter);
    expect(month.isCalendarPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current fiscal Quarter', () => {
    const month = currentQuarter(K.FY);
    expect(month).toBeInstanceOf(Quarter);
    expect(month.isFiscalPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current calendar Half', () => {
    const month = currentHalf();
    expect(month).toBeInstanceOf(Half);
    expect(month.isCalendarPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current fiscal Half', () => {
    const month = currentHalf(K.FY);
    expect(month).toBeInstanceOf(Half);
    expect(month.isFiscalPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current calendar Year', () => {
    const month = currentYear();
    expect(month).toBeInstanceOf(Year);
    expect(month.isCalendarPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });

  test('current fiscal Year', () => {
    const month = currentYear(K.FY);
    expect(month).toBeInstanceOf(Year);
    expect(month.isFiscalPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });
});

describe('building calendars from periods', () => {
  test('build calendar year calendar', () => {
    expect(
      buildCalendarForPeriod(CY(2020).newPeriodTo(CY(2024)), Years)
    ).toStrictEqual([CY(2020), CY(2021), CY(2022), CY(2023), CY(2024)]);
  });

  test('build fiscal year calendar', () => {
    expect(
      buildCalendarForPeriod(FY(2020).newPeriodTo(FY(2024)), Years)
    ).toStrictEqual([FY(2020), FY(2021), FY(2022), FY(2023), FY(2024)]);
  });

  test('build calendar halves calendar and cover beginning', () => {
    expect(
      buildCalendarForPeriod(CY(2028, Mar).newPeriodTo(CY(2030, Dec)), Halves)
    ).toStrictEqual([
      CY(2028, H1),
      CY(2028, H2),
      CY(2029, H1),
      CY(2029, H2),
      CY(2030, H1),
      CY(2030, H2),
    ]);
  });

  // test('build fiscal halves calendar and fill at end', () => {
  //   expect(
  //     buildCalendarForPeriod(
  //       FY(2028, Jul).newPeriodTo(FY(2030, Nov)),
  //       Halves,
  //       false,
  //       true
  //     )
  //   ).toStrictEqual([
  //     FY(2028, H1),
  //     FY(2028, H2),
  //     FY(2029, H1),
  //     FY(2029, H2),
  //     FY(2030, Q1),
  //     FY(2030, Oct),
  //     FY(2030, Nov),
  //   ]);
  // });

  test('build calendar quarters calendar with intermediate levels', () => {
    expect(
      buildCalendarForPeriod(
        CY(1985, May).newPeriodTo(CY(1987, Jun)),
        Quarters,
        true
      )
    ).toStrictEqual([
      CY(1985),
      CY(1985, H1),
      CY(1985, Q2),
      CY(1985, H2),
      CY(1985, Q3),
      CY(1985, Q4),
      CY(1986),
      CY(1986, H1),
      CY(1986, Q1),
      CY(1986, Q2),
      CY(1986, H2),
      CY(1986, Q3),
      CY(1986, Q4),
      CY(1987, H1),
      CY(1987, Q1),
      CY(1987, Q2),
    ]);
  });

  // test('build fiscal quarters calendar with intermediate levels and fill on both sides', () => {
  //   expect(
  //     buildCalendarForPeriod(
  //       FY(1985, Feb).newPeriodTo(FY(1987, Jul)),
  //       Quarters,
  //       true,
  //       true
  //     )
  //   ).toStrictEqual([
  //     FY(1985, Mar),
  //     FY(1985, Q4),
  //     FY(1986),
  //     FY(1986, H1),
  //     FY(1986, Q1),
  //     FY(1986, Q2),
  //     FY(1986, H2),
  //     FY(1986, Q3),
  //     FY(1986, Q4),
  //     FY(1987, Jul),
  //   ]);
  // });

  test('build full calendar tree', () => {
    expect(buildCalendarForPeriod(CY(2023), Months, true)).toStrictEqual([
      CY(2023),
      CY(2023, H1),
      CY(2023, Q1),
      CY(2023, Jan),
      CY(2023, Feb),
      CY(2023, Mar),
      CY(2023, Q2),
      CY(2023, Apr),
      CY(2023, May),
      CY(2023, Jun),
      CY(2023, H2),
      CY(2023, Q3),
      CY(2023, Jul),
      CY(2023, Aug),
      CY(2023, Sep),
      CY(2023, Q4),
      CY(2023, Oct),
      CY(2023, Nov),
      CY(2023, Dec),
    ]);
  });

  test('build full fiscal tree', () => {
    expect(buildCalendarForPeriod(FY(2023), Months, true)).toStrictEqual([
      FY(2023),
      FY(2023, H1),
      FY(2023, Q1),
      FY(2023, Jul),
      FY(2023, Aug),
      FY(2023, Sep),
      FY(2023, Q2),
      FY(2023, Oct),
      FY(2023, Nov),
      FY(2023, Dec),
      FY(2023, H2),
      FY(2023, Q3),
      FY(2023, Jan),
      FY(2023, Feb),
      FY(2023, Mar),
      FY(2023, Q4),
      FY(2023, Apr),
      FY(2023, May),
      FY(2023, Jun),
    ]);
  });
});
