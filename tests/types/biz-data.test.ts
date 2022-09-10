import {BizDate, dateResolution} from '../../src/types/biz-date';

describe('constructing biz date', () => {
  test('with normal FY', () => {
    expect(new BizDate('FY23 H1')).toStrictEqual(
      Object.assign(new BizDate(), {
        original: 'FY23 H1',
        fiscalNormalized: 'FY2023 H1',
        calendarYear: 2022,
        calendarMonth: 12,
        resolution: dateResolution.Half,
        valid: true,
      })
    );
  });

  test('with CY', () => {
    expect(new BizDate('CY2022 Q4')).toStrictEqual(
      Object.assign(new BizDate(), {
        original: 'CY2022 Q4',
        fiscalNormalized: 'FY2023 Q2',
        calendarYear: 2022,
        calendarMonth: 12,
        resolution: dateResolution.Quarter,
        valid: true,
      })
    );
  });

  test('with month', () => {
    expect(new BizDate('CY2022 Sep')).toStrictEqual(
      Object.assign(new BizDate(), {
        original: 'CY2022 Sep',
        fiscalNormalized: 'FY2023 Sep',
        calendarYear: 2022,
        calendarMonth: 9,
        resolution: dateResolution.Month,
        valid: true,
      })
    );
  });

  test('with TBD', () => {
    expect(new BizDate('TBD')).toStrictEqual(
      Object.assign(new BizDate(), {
        original: 'TBD',
        fiscalNormalized: 'TBD',
        calendarYear: 9999,
        calendarMonth: 12,
        resolution: dateResolution.Year,
        valid: true,
      })
    );
  });

  test('with invalid date', () => {
    expect(new BizDate('H1 23')).toStrictEqual(
      Object.assign(new BizDate(), {
        original: 'H1 23',
        fiscalNormalized: '',
        calendarYear: 0,
        calendarMonth: 0,
        resolution: dateResolution.Invalid,
        valid: false,
      })
    );
  });
});
