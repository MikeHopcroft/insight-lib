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
} from '../../src/biz-calendar';
import {
  Half,
  Month,
  Quarter,
  Year,
  YearKind as K,
} from '../../src/biz-calendar/core';
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
