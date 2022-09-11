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

describe('transforming biz date', () => {
  test('CY to FY', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Q3).toFiscalYear()
    ).toMatchObject({
      year: YearKind.FY,
      part: YearPart.Q1,
      calendarYear: 2022,
      calendarMonth: 9,
    });
  });

  test('FY to CY', () => {
    expect(
      new BizDate(YearKind.FY, 2023, YearPart.H2).toCalendarYear()
    ).toMatchObject({
      year: YearKind.CY,
      part: YearPart.H1,
      calendarYear: 2023,
      calendarMonth: 6,
    });
  });

  test('Unknown to FY', () => {
    expect(
      new BizDate(YearKind.Unknown, 3.1415, YearPart.Q4).toFiscalYear()
    ).toMatchObject({
      year: YearKind.Unknown,
      part: YearPart.None,
      calendarYear: 9999,
      calendarMonth: 12,
    });
  });
});
