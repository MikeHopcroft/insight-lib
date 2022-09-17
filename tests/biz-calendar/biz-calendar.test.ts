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
  parsePeriod,
  currentMonth,
} from '../../src/biz-calendar';

enum K {
  CY,
  FY,
}

function bdObj(kind: K, start: number, end: number): object {
  return {
    kind: kind,
    startYearMonth: start,
    endYearMonth: end,
  };
}

describe('constructing business periods', () => {
  test('fiscal year', () => {
    expect(FY(2024)).toMatchObject(
      bdObj(K.FY, 202310, 202409)
    );
  });

  test('fiscal year half', () => {
    expect(FY(2023, H1)).toMatchObject(bdObj(K.FY, 202207, 202212));
  });

  test('calendar year quarter', () => {
    expect(CY(2022, Q4)).toMatchObject(bdObj(K.CY, 202210, 202212));
  });

  test('calendar year month', () => {
    expect(CY(2022, Sep)).toMatchObject(bdObj(K.CY, 202209, 202209));
  });

  test('TBD', () => {
    expect(TBD()).toMatchObject(bdObj(K.CY, 999911, 999911));
  });

  test('Unknown', () => {
    expect(Unknown()).toMatchObject(bdObj(K.CY, 999912, 999912));
  });
});

describe('transforming business periods', () => {
  test('CY Quarter to FY Quarter', () => {
    expect(CY(2022, Q3).toFiscal()).toMatchObject(
      bdObj(K.FY, 202207, 202209)
    );
  });

  test('FY Half to CY Half', () => {
    expect(FY(2023, H2).toCalendar()).toMatchObject(
      bdObj(K.CY, 202301, 202306)
    );
  });

  test('FY Half to end Month', () => {
    expect(FY(2023, H2).getEndMonth()).toMatchObject(
      bdObj(K.FY, 202306, 202306)
    );
  });

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
    expect(CY(2023).toFiscal().toString()).toBe('FY2023 Jan - FY2024 Dec')
  });

  test('TBD to string', () => {
    expect(TBD().toString()).toBe('TBD');
  });

  test('Unknown to string', () => {
    expect(Unknown().toString()).toBe('Unknown');
  });

  test('Unknown to FY', () => {
    expect(Unknown().toFiscal()).toMatchObject(
      bdObj(K.CY, 999912, 999912)
    );
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
  })

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
    expect(CY(2022, Sep).isBefore(TBD())).toBeTruthy();
  });

  test('before tbd', () => {
    expect(CY(2022, Sep).isBefore(Unknown())).toBeTruthy();
  });
});

describe('parsing biz periods', () => {
  test('parse CY', () => {
    expect(parsePeriod('CY2023 May')).toMatchObject(
      bdObj(K.CY, 202305, 202305)
    );
  });

  test('parse FY', () => {
    expect(parsePeriod('FY2023 Q1')).toMatchObject(
      bdObj(K.FY, 202207, 202209)
    );
  });

  test('parse short FY', () => {
    expect(parsePeriod('FY24 Q3')).toMatchObject(
      bdObj(K.FY, 202401, 202403)
    );
  });

  test('parse shorter FY', () => {
    expect(parsePeriod('FY24')).toMatchObject(bdObj(K.FY, 202307, 202406));
  });

  test('parse TBD', () => {
    expect(parsePeriod('TBD')).toMatchObject(bdObj(K.CY, 999911, 999911));
  });

  test('parse Unknown', () => {
    expect(parsePeriod('Unknown')).toMatchObject(
      bdObj(K.CY, 999912, 999912)
    );
  });

  test('loose parse', () => {
    expect(parsePeriod(' CY 23  H 2 ')).toMatchObject(
      bdObj(K.CY, 202307, 202312)
    );
  });

  test('reverse parse', () => {
    expect(parsePeriod('Q3 FY2023')).toMatchObject(
      bdObj(K.FY, 202301, 202303)
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
