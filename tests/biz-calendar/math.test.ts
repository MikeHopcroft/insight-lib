import {PeriodConfig} from '../../src/biz-calendar';
import {
  addMonths,
  calendarToFiscal,
  checkKind,
  checkMonth,
  checkYear,
  ifShortYear,
  fiscalToCalendar,
  lengthInMonths,
  subtractMonths,
  yearAndMonth,
  yearMonth,
  tickMonth,
} from '../../src/biz-calendar/math';
import {YearKind as K} from '../../src/biz-calendar/core';

describe('checking Period inputs', () => {
  test('checking CY', () => {
    expect(checkKind(0)).toBe(K.CY);
  });

  test('checking FY', () => {
    expect(checkKind(1)).toBe(K.FY);
  });

  test('checking ?Y', () => {
    const twoYear = () => {
      checkKind(2);
    };
    expect(twoYear).toThrowError();

    const badYear = () => {
      checkKind(-1);
    };
    expect(badYear).toThrowError();
  });

  test('checking lowest month', () => {
    expect(checkMonth(1)).toBe(1);
  });

  test('checking good month', () => {
    expect(checkMonth(8)).toBe(8);
  });

  test('checking highest month', () => {
    expect(checkMonth(12)).toBe(12);
  });

  test('checking month zero', () => {
    const monthZero = () => {
      checkMonth(0);
    };
    expect(monthZero).toThrowError();
  });

  test('checking month thirteen', () => {
    const monthThirteen = () => {
      checkMonth(13);
    };
    expect(monthThirteen).toThrowError();
  });

  test('checking lowest year', () => {
    expect(checkYear(-1)).toBe(1999); // FY0 -> FY2000 -> CY1999
  });

  test('checking normal year', () => {
    expect(checkYear(2023)).toBe(2023);
  });

  test('checking normal short year', () => {
    expect(checkYear(2032)).toBe(2032);
  });

  test('checking highest year', () => {
    expect(checkYear(9999)).toBe(9999);
  });

  test('checking negative year', () => {
    const negativeYear = () => {
      checkYear(-2);
    };
    expect(negativeYear).toThrowError();
  });

  test('checking Y10k', () => {
    const y10k = () => {
      checkYear(10000);
    };
    expect(y10k).toThrowError();
  });
});

describe('converting between year kinds', () => {
  test('calendar to default fiscal start', () => {
    expect(
      calendarToFiscal(2022, 7, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2023, 1]);
  });

  test('calendar start to default fiscal', () => {
    expect(
      calendarToFiscal(2022, 1, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2022, 7]);
  });

  test('calendar to default fiscal', () => {
    expect(
      calendarToFiscal(2019, 2, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2019, 8]);
  });

  test('calendar to default fiscal end', () => {
    expect(
      calendarToFiscal(2025, 6, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2025, 12]);
  });

  test('calendar end to default fiscal', () => {
    expect(
      calendarToFiscal(2042, 12, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2043, 6]);
  });

  test('calendar to configured fiscal start', () => {
    expect(calendarToFiscal(2022, 4, 4)).toStrictEqual([2023, 1]);
  });

  test('calendar start to configured fiscal', () => {
    expect(calendarToFiscal(2022, 1, 5)).toStrictEqual([2022, 9]);
  });

  test('calendar to configured fiscal', () => {
    expect(calendarToFiscal(2019, 2, 8)).toStrictEqual([2019, 7]);
  });

  test('calendar to configured fiscal end', () => {
    expect(calendarToFiscal(2025, 9, 10)).toStrictEqual([2025, 12]);
  });

  test('calendar end to configured fiscal', () => {
    expect(calendarToFiscal(2042, 12, 11)).toStrictEqual([2043, 2]);
  });

  test('calendar and fiscal year match', () => {
    expect(calendarToFiscal(2025, 6, 1)).toStrictEqual([2025, 6]);
  });

  test('default fiscal to calendar start', () => {
    expect(
      fiscalToCalendar(2023, 7, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2023, 1]);
  });

  test('default fiscal start to calendar', () => {
    expect(
      fiscalToCalendar(2022, 1, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2021, 7]);
  });

  test('default fiscal to calendar', () => {
    expect(
      fiscalToCalendar(2019, 2, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2018, 8]);
  });

  test('default fiscal to calendar end', () => {
    expect(
      fiscalToCalendar(2025, 6, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2024, 12]);
  });

  test('default fiscal end to calendar', () => {
    expect(
      fiscalToCalendar(2042, 12, PeriodConfig.fiscalYearStartMonth)
    ).toStrictEqual([2042, 6]);
  });

  test('configured fiscal to calendar start', () => {
    expect(fiscalToCalendar(2023, 10, 4)).toStrictEqual([2023, 1]);
  });

  test('configured fiscal start to calendar', () => {
    expect(fiscalToCalendar(2022, 1, 5)).toStrictEqual([2021, 5]);
  });

  test('configured fiscal to calendar', () => {
    expect(fiscalToCalendar(2019, 2, 8)).toStrictEqual([2018, 9]);
  });

  test('configured fiscal to calendar end', () => {
    expect(fiscalToCalendar(2026, 3, 10)).toStrictEqual([2025, 12]);
  });

  test('configured fiscal end to calendar', () => {
    expect(fiscalToCalendar(2042, 12, 11)).toStrictEqual([2042, 10]);
  });

  test('fiscalToCalendar and calendarToFiscal are inverse', () => {
    expect(
      calendarToFiscal(
        ...fiscalToCalendar(2023, 3, PeriodConfig.fiscalYearStartMonth),
        PeriodConfig.fiscalYearStartMonth
      )
    ).toStrictEqual([2023, 3]);
  });
});

describe('years and months and yearMonths', () => {
  test('adding to month in a year', () => {
    expect(addMonths(4, 3)).toStrictEqual([7, 0]);
  });

  test('adding to a month across a year boundary', () => {
    expect(addMonths(8, 7)).toStrictEqual([3, 1]);
  });

  test('adding to a month across multiple year boundaries', () => {
    expect(addMonths(10, 25)).toStrictEqual([11, 2]);
  });

  test('trying to add to an invalid month ordinal throws', () => {
    const monthZero = () => {
      addMonths(0, 3);
    };
    const monthThirteen = () => {
      addMonths(13, 5);
    };
    expect(monthZero).toThrowError();
    expect(monthThirteen).toThrowError();
  });

  test('adding a negative number of months works', () => {
    expect(addMonths(5, -2)).toStrictEqual([3, 0]);
  });

  test('subtracting from month in a year', () => {
    expect(subtractMonths(4, 3)).toStrictEqual([1, 0]);
  });

  test('subtracting from a month across a year boundary', () => {
    expect(subtractMonths(6, 10)).toStrictEqual([8, -1]);
  });

  test('subtracting from a month to year 12', () => {
    expect(subtractMonths(3, 3)).toStrictEqual([12, -1]);
  });

  test('subtracting from a month across multiple year boundaries', () => {
    expect(subtractMonths(7, 38)).toStrictEqual([5, -3]);
  });

  test('subtracting from an invalid month ordinal throws', () => {
    const monthZero = () => {
      subtractMonths(0, 3);
    };
    const monthThirteen = () => {
      subtractMonths(13, 5);
    };
    expect(monthZero).toThrowError();
    expect(monthThirteen).toThrowError();
  });

  test('combining', () => {
    expect(yearMonth(2022, 1)).toBe(202201);
  });

  test('pulling apart', () => {
    expect(yearAndMonth(201912)).toStrictEqual([2019, 12]);
  });

  test('are inverse', () => {
    expect(yearMonth(...yearAndMonth(202407))).toBe(202407);
  });

  test('length of a year in months', () => {
    expect(lengthInMonths(202301, 202312)).toBe(12);
  });

  test('length of one month', () => {
    expect(lengthInMonths(202402, 202402)).toBe(1);
  });

  test('period length less than a year', () => {
    expect(lengthInMonths(202204, 202206)).toBe(3);
  });

  test('period length less than a year, across a year', () => {
    expect(lengthInMonths(202209, 202306)).toBe(10);
  });

  test('period length greater than a year', () => {
    expect(lengthInMonths(202203, 202502)).toBe(36);
  });

  test('period length greater than a year, between years', () => {
    expect(lengthInMonths(202205, 202403)).toBe(23);
  });

  test('inverted range is an error', () => {
    const invertedRange = () => {
      lengthInMonths(202502, 202304);
    };
    expect(invertedRange).toThrowError();
  });
});

describe('incrementing months', () => {
  test('basic tick', () => {
    expect(tickMonth(202003)).toBe(202004);
  });

  test('annual roll over tick', () => {
    expect(tickMonth(202312)).toBe(202401);
  });
});

describe('year shortening', () => {
  test('checking default short year', () => {
    expect(ifShortYear(2023)).toBe(2023);
  });

  test('with short year true', () => {
    PeriodConfig.stringShortYear = true;
    expect(ifShortYear(2023)).toBe(23);
    expect(ifShortYear(42)).toBe(42);
    PeriodConfig.stringShortYear = false;
  });
});
