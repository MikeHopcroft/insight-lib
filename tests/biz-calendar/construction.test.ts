/* eslint @typescript-eslint/no-unused-vars: 0 */

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
  YearKind,
} from '../../src/biz-calendar/core';
import {K, pObj} from './test-support';

describe('constructing business periods', () => {
  test('fiscal year', () => {
    expect(FY(2024)).toMatchObject(pObj(K.FY, 202307, 202406));
  });

  test('fiscal year half', () => {
    expect(FY(2023, H1)).toMatchObject(pObj(K.FY, 202207, 202212));
  });

  test('fiscal year month', () => {
    expect(FY(25, Oct)).toMatchObject(pObj(K.FY, 202410, 202410));
  });

  test('calendar year quarter', () => {
    expect(CY(2022, Q4)).toMatchObject(pObj(K.CY, 202210, 202212));
  });

  test('calendar year month', () => {
    expect(CY(2022, Sep)).toMatchObject(pObj(K.CY, 202209, 202209));
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
    expect(CY(22, Range(Feb, Sep))).toMatchObject(
      pObj(K.CY, 202202, 202209)
    );
  });

  test('basic fiscal month range', () => {
    expect(FY(22, Range(Feb, May))).toMatchObject(
      pObj(K.FY, 202202, 202205)
    );
  });
  
  test('fiscal month range across calendar year end', () => {
    expect(FY(2022, Range(Oct, Jan))).toMatchObject(
      pObj(K.FY, 202110, 202201)
    );
  });

  test('calendar month range across calendar year end', () => {
    expect(CY(22, Range(Oct, Jan))).toMatchObject(
      pObj(K.CY, 202210, 202301)
    );
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
    const month = currentMonth(YearKind.FY);
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
    const month = currentQuarter(YearKind.FY);
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
    const month = currentHalf(YearKind.FY);
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
    const month = currentYear(YearKind.FY);
    expect(month).toBeInstanceOf(Year);
    expect(month.isFiscalPeriod()).toBeTruthy();
    expect(month.getStartYearMonth()).toBeLessThan(210000);
    expect(month.getStartYearMonth()).toBeGreaterThan(202000);
    expect(month.getEndYearMonth()).toBeLessThan(210000);
    expect(month.getEndYearMonth()).toBeGreaterThan(202000);
  });
});
