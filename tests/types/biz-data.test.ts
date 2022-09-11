import {
  BizDate,
  parseBizDate,
  YearKind,
  YearPart,
} from '../../src/types/biz-date';

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

  test('FY Half to Month', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.H2).toMonth()).toMatchObject(
      {
        year: YearKind.FY,
        part: YearPart.Jun,
        calendarYear: 2023,
        calendarMonth: 6,
      }
    );
  });

  test('FY Month to Quarter', () => {
    expect(
      new BizDate(YearKind.FY, 2023, YearPart.Oct).toQuarter()
    ).toMatchObject({
      year: YearKind.FY,
      part: YearPart.Q2,
      calendarYear: 2022,
      calendarMonth: 12,
    });
  });

  test('CY Quarter to Half', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Q2).toHalf()).toMatchObject({
      year: YearKind.CY,
      part: YearPart.H1,
      calendarYear: 2022,
      calendarMonth: 6,
    });
  });

  test('FY Month to Year', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.Q2).toYear()).toMatchObject({
      year: YearKind.FY,
      part: YearPart.Year,
      calendarYear: 2023,
      calendarMonth: 6,
    });
  });

  test('CY to string', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Sep).toString()).toBe(
      'CY2022 Sep'
    );
  });

  test('FY to string', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.Q2).toString()).toBe(
      'FY2023 Q2'
    );
  });

  test('TBD to string', () => {
    expect(new BizDate(YearKind.TBD, 2023, YearPart.Q2).toString()).toBe('TBD');
  });

  test('Unknown to string', () => {
    expect(new BizDate(YearKind.Unknown, 0, YearPart.None).toString()).toBe(
      'Unknown'
    );
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

describe('parsing biz dates', () => {
  test('parse CY', () => {
    expect(parseBizDate('CY2023 May')).toMatchObject({
      year: YearKind.CY,
      part: YearPart.May,
      calendarYear: 2023,
      calendarMonth: 5,
    });
  });

  test('parse FY', () => {
    expect(parseBizDate('FY2023 Q1')).toMatchObject({
      year: YearKind.FY,
      part: YearPart.Q1,
      calendarYear: 2022,
      calendarMonth: 9,
    });
  });

  test('parse short FY', () => {
    expect(parseBizDate('FY24 Q3')).toMatchObject({
      year: YearKind.FY,
      part: YearPart.Q3,
      calendarYear: 2024,
      calendarMonth: 3,
    });
  });

  test('parse TBD', () => {
    expect(parseBizDate('TBD')).toMatchObject({
      year: YearKind.TBD,
      part: YearPart.None,
      calendarYear: 9999,
      calendarMonth: 12,
    });
  });

  test('parse Unknown', () => {
    expect(parseBizDate('Unknown')).toMatchObject({
      year: YearKind.Unknown,
      part: YearPart.None,
      calendarYear: 9999,
      calendarMonth: 12,
    });
  });
});
