import {BizDate, YearKind, YearPart} from '../../src/types/biz-date';

describe('constructing biz date', () => {
  test('with normal FY', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.H1)).toMatchObject({
      year: YearKind.FY,
      part: YearPart.H1,
      calendarYear: 2022,
      calendarMonth: 12,
    });
  });

  test('with CY', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Q4)).toMatchObject({
      year: YearKind.CY,
      part: YearPart.Q4,
      calendarYear: 2022,
      calendarMonth: 12,
    });
  });

  test('with month', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Sep)).toMatchObject({
      year: YearKind.CY,
      part: YearPart.Sep,
      calendarYear: 2022,
      calendarMonth: 9,
    });
  });

  test('with TBD', () => {
    expect(new BizDate(YearKind.TBD, 2022, YearPart.Sep)).toMatchObject({
      year: YearKind.TBD,
      part: YearPart.None,
      calendarYear: 9999,
      calendarMonth: 12,
    });
  });
});
