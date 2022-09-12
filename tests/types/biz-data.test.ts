import {
  BizDate,
  parseBizDate,
  tbd,
  thisMonth,
  YearKind,
  YearPart,
  unknown,
} from '../../src/types/biz-date';

function bdObj(k: YearKind, p: YearPart, y: number, m: number): object {
  return {
    year: k,
    part: p,
    calendarYear: y,
    calendarMonth: m,
  };
}

describe('constructing biz date', () => {
  test('with normal FY', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.H1)).toMatchObject(
      bdObj(YearKind.FY, YearPart.H1, 2022, 12)
    );
  });

  test('with CY', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Q4)).toMatchObject(
      bdObj(YearKind.CY, YearPart.Q4, 2022, 12)
    );
  });

  test('with month', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Sep)).toMatchObject(
      bdObj(YearKind.CY, YearPart.Sep, 2022, 9)
    );
  });

  test('with TBD', () => {
    expect(new BizDate(YearKind.TBD)).toMatchObject(
      bdObj(YearKind.TBD, YearPart.None, 9999, 12)
    );
  });
});

describe('transforming biz dates', () => {
  test('CY to FY', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Q3).toFiscalYear()
    ).toMatchObject(bdObj(YearKind.FY, YearPart.Q1, 2022, 9));
  });

  test('FY to CY', () => {
    expect(
      new BizDate(YearKind.FY, 2023, YearPart.H2).toCalendarYear()
    ).toMatchObject(bdObj(YearKind.CY, YearPart.H1, 2023, 6));
  });

  test('FY Half to Month', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.H2).toMonth()).toMatchObject(
      bdObj(YearKind.FY, YearPart.Jun, 2023, 6)
    );
  });

  test('FY Month to Quarter', () => {
    expect(
      new BizDate(YearKind.FY, 2023, YearPart.Oct).toQuarter()
    ).toMatchObject(bdObj(YearKind.FY, YearPart.Q2, 2022, 12));
  });

  test('CY Quarter to Half', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Q2).toHalf()).toMatchObject(
      bdObj(YearKind.CY, YearPart.H1, 2022, 6)
    );
  });

  test('FY Month to Year', () => {
    expect(new BizDate(YearKind.FY, 2023, YearPart.Q2).toYear()).toMatchObject(
      bdObj(YearKind.FY, YearPart.Year, 2023, 6)
    );
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

  test('Year to string', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Year).toString()).toBe(
      'CY2022'
    );
  });

  test('TBD to string', () => {
    expect(new BizDate(YearKind.TBD).toString()).toBe('TBD');
  });

  test('Unknown to string', () => {
    expect(new BizDate(YearKind.Unknown).toString()).toBe('Unknown');
  });

  test('Unknown to FY', () => {
    expect(new BizDate(YearKind.Unknown).toFiscalYear()).toMatchObject(
      bdObj(YearKind.Unknown, YearPart.None, 9999, 12)
    );
  });
});

describe('comparing biz dates', () => {
  test('are equal', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).equals(
        new BizDate(YearKind.CY, 2022, YearPart.Sep)
      )
    ).toBeTruthy();
  });

  test('are not equal', () => {
    expect(
      new BizDate(YearKind.FY, 2022, YearPart.Aug).equals(thisMonth())
    ).toBeFalsy();
  });

  test('comparable', () => {
    expect(new BizDate(YearKind.CY, 2022, YearPart.Aug).comparable()).toBe(
      202208
    );
  });

  test('after', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).isAfter(
        new BizDate(YearKind.CY, 2022, YearPart.Aug)
      )
    ).toBeTruthy();
  });

  test('before', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).isBefore(
        new BizDate(YearKind.FY, 2023, YearPart.H1)
      )
    ).toBeTruthy();
  });

  test('same month', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).isSameMonth(
        new BizDate(YearKind.FY, 2023, YearPart.Q1)
      )
    ).toBeTruthy();
  });

  test('not after', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).isAfter(
        new BizDate(YearKind.CY, 2022, YearPart.Sep)
      )
    ).toBeFalsy();
  });

  test('not before', () => {
    expect(
      new BizDate(YearKind.FY, 2026, YearPart.Year).isBefore(
        new BizDate(YearKind.CY, 2022, YearPart.Sep)
      )
    ).toBeFalsy();
  });

  test('not same month', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).equals(
        new BizDate(YearKind.FY, 2022, YearPart.Sep)
      )
    ).toBeFalsy();
  });

  test('before tbd', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).isBefore(tbd())
    ).toBeTruthy();
  });

  test('before tbd', () => {
    expect(
      new BizDate(YearKind.CY, 2022, YearPart.Sep).isBefore(unknown())
    ).toBeTruthy();
  });
});

describe('parsing biz dates', () => {
  test('parse CY', () => {
    expect(parseBizDate('CY2023 May')).toMatchObject(
      bdObj(YearKind.CY, YearPart.May, 2023, 5)
    );
  });

  test('parse FY', () => {
    expect(parseBizDate('FY2023 Q1')).toMatchObject(
      bdObj(YearKind.FY, YearPart.Q1, 2022, 9)
    );
  });

  test('parse short FY', () => {
    expect(parseBizDate('FY24 Q3')).toMatchObject(
      bdObj(YearKind.FY, YearPart.Q3, 2024, 3)
    );
  });

  test('parse shorter FY', () => {
    expect(parseBizDate('FY24')).toMatchObject(
      bdObj(YearKind.FY, YearPart.Year, 2024, 6)
    );
  });

  test('parse TBD', () => {
    expect(parseBizDate('TBD')).toMatchObject(
      bdObj(YearKind.TBD, YearPart.None, 9999, 12)
    );
  });

  test('parse Unknown', () => {
    expect(parseBizDate('Unknown')).toMatchObject(
      bdObj(YearKind.Unknown, YearPart.None, 9999, 12)
    );
  });

  test('loose parse', () => {
    expect(parseBizDate(' CY 23  H 2 ')).toMatchObject(
      bdObj(YearKind.CY, YearPart.H2, 2023, 12)
    );
  });

  test('reverse parse', () => {
    expect(parseBizDate('Q3 FY2023')).toMatchObject(
      bdObj(YearKind.FY, YearPart.Q3, 2023, 3)
    );
  });
});

const noYearKind = () => {
  parseBizDate('2022 Sep');
};

const noYear = () => {
  parseBizDate('CY H1');
};

const badPart = () => {
  parseBizDate('FY2023 U76');
};

const badHalf = () => {
  parseBizDate('CY2022 H4');
};

const yearTooLong = () => {
  parseBizDate('CY20245 H1');
};

const tooManyParts = () => {
  parseBizDate('FY2023 H1 Q3');
};

describe('parsing errors', () => {
  test('no year kind', () => {
    expect(noYearKind).toThrowError();
  });

  test('no year', () => {
    expect(noYear).toThrowError();
  });

  test('bad part', () => {
    expect(badPart).toThrowError();
  });

  test('bad half', () => {
    expect(badHalf).toThrowError();
  });

  test('year too long', () => {
    expect(yearTooLong).toThrowError();
  });

  test('too many parts', () => {
    expect(tooManyParts).toThrowError();
  });
});
