import {
  BizPeriod,
  parseBizPeriod,
  tbd,
  thisMonth,
  YearKind as K,
  Period as P,
  unknown,
} from '../../src/types/biz-calendar';

function bdObj(k: K, p: P, y: number, m: number, fy: P = P.Jul): object {
  return {
    kind: k,
    period: p,
    endCalendarYear: y,
    endCalendarMonth: m,
    fiscalYearStartMonth: fy,
  };
}

describe('constructing biz periods', () => {
  test('with normal FY', () => {
    expect(new BizPeriod(K.FY, 2023, P.H1)).toMatchObject(
      bdObj(K.FY, P.H1, 2022, 12)
    );
  });

  test('with CY', () => {
    expect(new BizPeriod(K.CY, 2022, P.Q4)).toMatchObject(
      bdObj(K.CY, P.Q4, 2022, 12)
    );
  });

  test('with month', () => {
    expect(new BizPeriod(K.CY, 2022, P.Sep)).toMatchObject(
      bdObj(K.CY, P.Sep, 2022, 9)
    );
  });

  test('with TBD', () => {
    expect(new BizPeriod(K.TBD)).toMatchObject(
      bdObj(K.TBD, P.None, 9999, 11)
    );
  });
});

describe('transforming biz periods', () => {
  test('CY to FY', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Q3).toFiscalYear()
    ).toMatchObject(bdObj(K.FY, P.Q1, 2022, 9));
  });

  test('FY to CY', () => {
    expect(
      new BizPeriod(K.FY, 2023, P.H2).toCalendarYear()
    ).toMatchObject(bdObj(K.CY, P.H1, 2023, 6));
  });

  test('FY Half to end Month', () => {
    expect(new BizPeriod(K.FY, 2023, P.H2).toEndMonth()).toMatchObject(
      bdObj(K.FY, P.Jun, 2023, 6)
    );
  });

  test('CY to string', () => {
    expect(new BizPeriod(K.CY, 2022, P.Sep).toString()).toBe(
      'CY2022 Sep'
    );
  });

  test('FY to string', () => {
    expect(new BizPeriod(K.FY, 2023, P.Q2).toString()).toBe(
      'FY2023 Q2'
    );
  });

  test('Year to string', () => {
    expect(new BizPeriod(K.CY, 2022, P.Year).toString()).toBe(
      'CY2022'
    );
  });

  test('TBD to string', () => {
    expect(new BizPeriod(K.TBD).toString()).toBe('TBD');
  });

  test('Unknown to string', () => {
    expect(new BizPeriod(K.Unknown).toString()).toBe('Unknown');
  });

  test('Unknown to FY', () => {
    expect(new BizPeriod(K.Unknown).toFiscalYear()).toMatchObject(
      bdObj(K.Unknown, P.None, 9999, 12)
    );
  });
});

describe('comparing biz periods', () => {
  test('are equal', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).equals(
        new BizPeriod(K.CY, 2022, P.Sep)
      )
    ).toBeTruthy();
  });

  test('are not equal', () => {
    expect(
      new BizPeriod(K.FY, 2022, P.Aug).equals(thisMonth())
    ).toBeFalsy();
  });

  test('after', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).isAfter(
        new BizPeriod(K.CY, 2022, P.Aug)
      )
    ).toBeTruthy();
  });

  test('before', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).isBefore(
        new BizPeriod(K.FY, 2023, P.H1)
      )
    ).toBeTruthy();
  });

  test('before resolution', () => {
    expect(
      new BizPeriod(K.FY, 2023, P.Dec).isBefore(
        new BizPeriod(K.CY, 2022, P.H2)
      )
    ).toBeTruthy();
  });

  test('same month', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).endsSameMonth(
        new BizPeriod(K.FY, 2023, P.Q1)
      )
    ).toBeTruthy();
  });

  test('not after', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).isAfter(
        new BizPeriod(K.CY, 2022, P.Sep)
      )
    ).toBeFalsy();
  });

  test('not before', () => {
    expect(
      new BizPeriod(K.FY, 2026, P.Year).isBefore(
        new BizPeriod(K.CY, 2022, P.Sep)
      )
    ).toBeFalsy();
  });

  test('not same month', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).equals(
        new BizPeriod(K.FY, 2022, P.Sep)
      )
    ).toBeFalsy();
  });

  test('before tbd', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).isBefore(tbd())
    ).toBeTruthy();
  });

  test('before tbd', () => {
    expect(
      new BizPeriod(K.CY, 2022, P.Sep).isBefore(unknown())
    ).toBeTruthy();
  });
});

describe('parsing biz periods', () => {
  test('parse CY', () => {
    expect(parseBizPeriod('CY2023 May')).toMatchObject(
      bdObj(K.CY, P.May, 2023, 5)
    );
  });

  test('parse FY', () => {
    expect(parseBizPeriod('FY2023 Q1')).toMatchObject(
      bdObj(K.FY, P.Q1, 2022, 9)
    );
  });

  test('parse short FY', () => {
    expect(parseBizPeriod('FY24 Q3')).toMatchObject(
      bdObj(K.FY, P.Q3, 2024, 3)
    );
  });

  test('parse shorter FY', () => {
    expect(parseBizPeriod('FY24')).toMatchObject(
      bdObj(K.FY, P.Year, 2024, 6)
    );
  });

  test('parse TBD', () => {
    expect(parseBizPeriod('TBD')).toMatchObject(
      bdObj(K.TBD, P.None, 9999, 11)
    );
  });

  test('parse Unknown', () => {
    expect(parseBizPeriod('Unknown')).toMatchObject(
      bdObj(K.Unknown, P.None, 9999, 12)
    );
  });

  test('loose parse', () => {
    expect(parseBizPeriod(' CY 23  H 2 ')).toMatchObject(
      bdObj(K.CY, P.H2, 2023, 12)
    );
  });

  test('reverse parse', () => {
    expect(parseBizPeriod('Q3 FY2023')).toMatchObject(
      bdObj(K.FY, P.Q3, 2023, 3)
    );
  });
});

const noK = () => {
  parseBizPeriod('2022 Sep');
};

const noYear = () => {
  parseBizPeriod('CY H1');
};

const badPart = () => {
  parseBizPeriod('FY2023 U76');
};

const badHalf = () => {
  parseBizPeriod('CY2022 H4');
};

const yearTooLong = () => {
  parseBizPeriod('CY20245 H1');
};

const tooManyParts = () => {
  parseBizPeriod('FY2023 H1 Q3');
};

describe('parsing errors', () => {
  test('no year kind', () => {
    expect(noK).toThrowError();
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
