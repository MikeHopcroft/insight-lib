import {
  IPeriod,
  Period,
  Month,
  Quarter,
  Year,
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
  PeriodParser,
  parsePeriod,
  currentHalf,
  currentQuarter,
  currentMonth,
  currentYear,
} from '../../src/types/biz-calendar';

enum K {
  CY,
  FY,
  TBD,
  Unknown,
}

function bdObj(kind: K, start: number, end: number, fy: number = 7): object {
  return {
    kind: kind,
    startYearMonth: start,
    endYearMonth: end,
    fiscalYearStartMonth: fy,
  };
}

describe('constructing business periods', () => {
  test('fiscal year half', () => {
    expect(FY(2023, H1)).toMatchObject(bdObj(K.FY, 202207, 202212, 7));
  });

  test('calendar year quarter', () => {
    expect(CY(2022, Q4)).toMatchObject(bdObj(K.CY, 202210, 202212, 7));
  });

  test('calendar year month', () => {
    expect(CY(2022, Sep)).toMatchObject(bdObj(K.CY, 202209, 202209, 7));
  });

  test('with TBD', () => {
    expect(new TBD()).toMatchObject(bdObj(K.TBD, 999911, 999911, 7));
  });
});

describe('transforming biz periods', () => {
  test('CY to FY', () => {
    expect(CY(2022, Q3).toFiscal()).toMatchObject(
      bdObj(K.FY, 202207, 202209, 7)
    );
  });

  test('FY to CY', () => {
    expect(FY(2023, H2).toCalendar()).toMatchObject(
      bdObj(K.CY, 202301, 202306, 7)
    );
  });

  test('FY Half to end Month', () => {
    expect(FY(2023, H2).getEndMonth()).toMatchObject(
      bdObj(K.FY, 202306, 202306, 7)
    );
  });

  test('CY to string', () => {
    expect(CY(2022, Sep).toString()).toBe('CY2022 Sep');
  });

  test('FY to string', () => {
    expect(FY(2023, Q2).toString()).toBe('FY2023 Q2');
  });

  test('Year to string', () => {
    expect(CY(2022, Y).toString()).toBe('CY2022');
  });

  test('TBD to string', () => {
    expect(new TBD().toString()).toBe('TBD');
  });

  test('Unknown to string', () => {
    expect(new Unknown().toString()).toBe('Unknown');
  });

  test('Unknown to FY', () => {
    expect(new Unknown().toFiscal()).toMatchObject(
      bdObj(K.Unknown, 999912, 999912, 7)
    );
  });
});

describe('comparing biz periods', () => {
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
    expect(CY(2022, Sep).isBefore(new TBD())).toBeTruthy();
  });

  test('before tbd', () => {
    expect(CY(2022, Sep).isBefore(new Unknown())).toBeTruthy();
  });
});

describe('parsing biz periods', () => {
  test('parse CY', () => {
    expect(parsePeriod('CY2023 May')).toMatchObject(
      bdObj(K.CY, 202305, 202305, 7)
    );
  });

  test('parse FY', () => {
    expect(parsePeriod('FY2023 Q1')).toMatchObject(
      bdObj(K.FY, 202207, 202209, 7)
    );
  });

  test('parse short FY', () => {
    expect(parsePeriod('FY24 Q3')).toMatchObject(
      bdObj(K.FY, 202401, 202403, 7)
    );
  });

  test('parse shorter FY', () => {
    expect(parsePeriod('FY24')).toMatchObject(bdObj(K.FY, 202307, 202406, 7));
  });

  test('parse TBD', () => {
    expect(parsePeriod('TBD')).toMatchObject(bdObj(K.TBD, 999911, 999911, 7));
  });

  test('parse Unknown', () => {
    expect(parsePeriod('Unknown')).toMatchObject(
      bdObj(K.Unknown, 999912, 999912, 7)
    );
  });

  test('loose parse', () => {
    expect(parsePeriod(' CY 23  H 2 ')).toMatchObject(
      bdObj(K.CY, 202307, 202312, 7)
    );
  });

  test('reverse parse', () => {
    expect(parsePeriod('Q3 FY2023')).toMatchObject(
      bdObj(K.FY, 202301, 202303, 7)
    );
  });
});

const noK = () => {
  parsePeriod('2022 Sep');
};

const noYear = () => {
  parsePeriod('CY H1');
};

const badPart = () => {
  parsePeriod('FY2023 U76');
};

const badHalf = () => {
  parsePeriod('CY2022 H4');
};

const yearTooLong = () => {
  parsePeriod('CY20245 H1');
};

const tooManyParts = () => {
  parsePeriod('FY2023 H1 Q3');
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
