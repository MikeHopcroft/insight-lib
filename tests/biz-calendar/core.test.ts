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
  currentMonth,
} from '../../src/biz-calendar';
import {Half, Period, Year} from '../../src/biz-calendar/core';
import {K, pObj} from './test-support';

describe('transforming business periods', () => {
  test('CY Quarter to FY Quarter', () => {
    expect(CY(2022, Q3).toFiscal()).toMatchObject(pObj(K.FY, 202207, 202209));
  });

  test('FY Half to CY Half', () => {
    expect(FY(2023, H2).toCalendar()).toMatchObject(pObj(K.CY, 202301, 202306));
  });
});

describe('business periods to strings', () => {
  test('CY Month to string', () => {
    expect(CY(2022, Sep).toString()).toBe('CY2022 Sep');
  });

  test('FY Quarter to string', () => {
    expect(FY(2023, Q2).toString()).toBe('FY2023 Q2');
  });

  test('Calendar Year to string', () => {
    expect(CY(2022, Y).toString()).toBe('CY2022');
  });

  test('Calender Half to Fiscal Half to string', () => {
    expect(CY(25, H2).toFiscal().toString()).toBe('FY2026 H1');
  });

  test('Calendar Year to Period string', () => {
    expect(CY(2023).toFiscal().toString()).toBe('FY2023 Jan - FY2024 Dec');
  });

  test('TBD to string', () => {
    expect(TBD().toString()).toBe('TBD');
  });

  test('Unknown to string', () => {
    expect(Unknown().toString()).toBe('Unknown');
  });

  test('Unknown to FY', () => {
    expect(Unknown().toFiscal()).toMatchObject(pObj(K.CY, 999912, 999912));
  });
});

describe('comparing biz periods', () => {
  test('compare Month before Month', () => {
    expect(CY(23, Jan).compare(CY(23, Feb))).toBeLessThan(0);
  });

  test('compare Half before overlapping Quarter', () => {
    expect(CY(23, H1).compare(CY(23, Q2))).toBeLessThan(0);
  });

  test('compare Month contained in Quarter', () => {
    expect(FY(24, Q4).compare(CY(2024, May))).toBeLessThan(0);
  });

  test('compare same Month', () => {
    expect(FY(25, Jun).compare(CY(2025, Jun))).toBe(0);
  });

  test('compare Month after Half', () => {
    expect(CY(2023, Mar).compare(FY(2023, H1))).toBeGreaterThan(0);
  });

  test('compare Month in Quarter', () => {
    expect(CY(3000, Nov).compare(FY(3001, Q2))).toBeGreaterThan(0);
  });

  test('Year contains Month', () => {
    expect(CY(2023).contains(FY(2023, Apr))).toBeTruthy();
  });

  test('Half does not contain Month', () => {
    expect(FY(2024, H2).contains(CY(2023, Jul))).toBeFalsy();
  });

  test('are equal', () => {
    expect(CY(2022, Sep).equals(CY(2022, Sep))).toBeTruthy();
  });

  test('are not equal', () => {
    expect(FY(2022, Aug).equals(currentMonth())).toBeFalsy();
  });

  test('after', () => {
    expect(CY(2022, Sep).isAfter(CY(2022, Aug))).toBeTruthy();
  });

  test('before', () => {
    expect(CY(2022, Aug).isBefore(FY(2023, Q2))).toBeTruthy();
  });

  test('before resolution', () => {
    expect(CY(2022, Dec).isBefore(FY(2023, H2))).toBeTruthy();
  });

  test('starts before', () => {
    expect(FY(2024, Q4).startsBefore(CY(2024, May))).toBeTruthy();
  });

  test("doesn't start before", () => {
    expect(CY(2025, H1).startsBefore(FY(2025, Dec))).toBeFalsy();
  });

  test('starts after', () => {
    expect(FY(2024, Jun).startsAfter(CY(2024, Q2))).toBeTruthy();
  });

  test("doesn't start after", () => {
    expect(CY(1985, Jul).startsAfter(FY(1986, H1))).toBeFalsy();
  });

  test('ends after', () => {
    expect(FY(2023, H1).endsAfter(FY(2023, Q1))).toBeTruthy();
  });

  test("doesn't end after", () => {
    expect(CY(2025, Q4).endsAfter(FY(2027, H1))).toBeFalsy();
  });

  test('ends before', () => {
    expect(FY(2056, Q1).endsBefore(FY(2056, H1))).toBeTruthy();
  });

  test("doesn't end before", () => {
    expect(CY(2024, H1).endsBefore(CY(2024, Range(Jan, May)))).toBeFalsy();
  });

  test('same month', () => {
    expect(CY(2022, Sep).endsSameMonth(FY(2023, Q1))).toBeTruthy();
  });

  test('not after', () => {
    expect(CY(2022, Sep).isAfter(CY(2022, Sep))).toBeFalsy();
  });

  test('not before', () => {
    expect(FY(2026, Y).isBefore(CY(2022, Sep))).toBeFalsy();
  });

  test('not same month', () => {
    expect(CY(2022, Sep).equals(FY(2022, Sep))).toBeFalsy();
  });

  test('before tbd', () => {
    expect(CY(2022, Sep).isBefore(TBD())).toBeTruthy();
  });

  test('before tbd', () => {
    expect(CY(2022, Sep).isBefore(Unknown())).toBeTruthy();
  });
});

describe('combining and splitting periods', () => {
  test('Combine two months', () => {
    expect(FY(23, Oct).newPeriodTo(FY(23, Nov))).toMatchObject(
      pObj(K.FY, 202210, 202211)
    );
  });

  test('Combine two ranges', () => {
    expect(CY(22, Range(Dec, Mar)).newPeriodFrom(FY(2018))).toMatchObject(
      pObj(K.CY, 201707, 202303)
    );
  });

  test('combine overlapping periods', () => {
    expect(CY(2024).newPeriodCombinedWith(FY(2024))).toMatchObject(
      pObj(K.CY, 202307, 202412)
    );
  });

  test('combine two quarters into a half', () => {
    let period = FY(23, Q1).newPeriodCombinedWith(FY(23, Q2));
    expect(period).toBeInstanceOf(Half);
    expect(period).toMatchObject(FY(23, H1));
    expect(period.toString()).toBe('FY2023 H1');
  });

  test('combine two quarters into a half with to', () => {
    let period = CY(23, Q3).newPeriodTo(CY(23, Q4));
    expect(period).toBeInstanceOf(Half);
    expect(period).toMatchObject(CY(23, H2));
    expect(period.toString()).toBe('CY2023 H2');
  });

  test('combine two quarters into a half with from', () => {
    let period = FY(23, Q2).newPeriodFrom(FY(23, Q1));
    expect(period).toBeInstanceOf(Half);
    expect(period).toMatchObject(FY(23, H1));
    expect(period.toString()).toBe('FY2023 H1');
  });

  test('combination is normal for quarters from different year kinds', () => {
    let period = FY(23, Q1).newPeriodTo(CY(22, Q4));
    expect(period).toBeInstanceOf(Period);
    expect(period).toMatchObject(FY(23, Range(Jul, Dec)));
    expect(period.toString()).toBe('FY2023 Jul-Dec');
  });

  test('combination is normal for non-adjacent quarters', () => {
    let period = FY(23, Q1).newPeriodTo(FY(23, Q3));
    expect(period).toBeInstanceOf(Period);
    expect(period).toMatchObject(FY(23, Range(Jul, Mar)));
    expect(period.toString()).toBe('FY2023 Jul-Mar');
  });

  test('combination is normal for quarter combining with another type', () => {
    let period = FY(23, Q4).newPeriodTo(FY(24));
    expect(period).toBeInstanceOf(Period);
    expect(period).toMatchObject(pObj(K.FY, 202304, 202406));
    expect(period.toString()).toBe('FY2023 Apr - FY2024 Jun');
  });

  // test('combine two halves into a year', () => {
    
  // });

  test('CY Quarter to start month', () => {
    expect(CY(2019, Q4).getStartMonth()).toMatchObject(
      pObj(K.CY, 201910, 201910)
    );
  });

  test('FY Half to end Month', () => {
    expect(FY(2023, H2).getEndMonth()).toMatchObject(
      pObj(K.FY, 202306, 202306)
    );
  });

  test('months from month', () => {
    expect(FY(20, May).toMonths()).toMatchObject([pObj(K.FY, 202005, 202005)]);
  });

  test('months from quarter', () => {
    expect(CY(2028, Q3).toMonths()).toMatchObject([
      pObj(K.CY, 202807, 202807),
      pObj(K.CY, 202808, 202808),
      pObj(K.CY, 202809, 202809),
    ]);
  });

  test('months from half', () => {
    expect(FY(12, H2).toMonths()).toMatchObject([
      pObj(K.FY, 201201, 201201),
      pObj(K.FY, 201202, 201202),
      pObj(K.FY, 201203, 201203),
      pObj(K.FY, 201204, 201204),
      pObj(K.FY, 201205, 201205),
      pObj(K.FY, 201206, 201206),
    ]);
  });

  test('months from long arbitrary range', () => {
    const range = CY(2000).newPeriodTo(CY(2020, Nov)).toMonths();
    expect(range.length).toBe(251);
    expect(range[0]).toMatchObject(pObj(K.CY, 200001, 200001));
    expect(range[133]).toMatchObject(pObj(K.CY, 201102, 201102));
    expect(range[250]).toMatchObject(pObj(K.CY, 202011, 202011));
  });
});

describe('direct Period tests', () => {
  test('FY with end month ordinal before start month ordinal', () => {
    expect(new Period(1, 2021, 10, -1, 1)).toMatchObject(
      pObj(K.FY, 202110, 202201)
    );
  });

  test('FY with explict end month ordinal before start month ordinal', () => {
    expect(new Period(1, 2021, 10, 2022, 1)).toMatchObject(
      pObj(K.FY, 202110, 202201)
    );
  });

  test('CY with explicit end month ordinal before start month ordinal', () => {
    expect(new Period(0, 2022, 10, 2023, 1)).toMatchObject(
      pObj(K.CY, 202210, 202301)
    );
  });
});
