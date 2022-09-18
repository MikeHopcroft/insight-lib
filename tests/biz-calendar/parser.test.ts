import {parsePeriod} from '../../src/biz-calendar';
import {K, pObj} from './test-support';

describe('parsing biz periods', () => {
  test('parse CY', () => {
    expect(parsePeriod('CY2023 May')).toMatchObject(pObj(K.CY, 202305, 202305));
  });

  test('parse FY', () => {
    expect(parsePeriod('FY2023 Q1')).toMatchObject(pObj(K.FY, 202207, 202209));
  });

  test('parse short FY', () => {
    expect(parsePeriod('FY24 Q3')).toMatchObject(pObj(K.FY, 202401, 202403));
  });

  test('parse shorter FY', () => {
    expect(parsePeriod('FY24')).toMatchObject(pObj(K.FY, 202307, 202406));
  });

  test('parse TBD', () => {
    expect(parsePeriod('TBD')).toMatchObject(pObj(K.CY, 999911, 999911));
  });

  test('parse Unknown', () => {
    expect(parsePeriod('Unknown')).toMatchObject(pObj(K.CY, 999912, 999912));
  });

  test('loose parse', () => {
    expect(parsePeriod(' CY 23  H 2 ')).toMatchObject(
      pObj(K.CY, 202307, 202312)
    );
  });

  test('reverse parse', () => {
    expect(parsePeriod('Q3 FY2023')).toMatchObject(pObj(K.FY, 202301, 202303));
  });
});

describe('parsing biz periods with ranges', () => {
  test('parse basic month range', () => {
    expect(parsePeriod('CY22 Feb-Sep')).toMatchObject(
      pObj(K.CY, 202202, 202209)
    );
  });

  test('parse basic fiscal month range', () => {
    expect(parsePeriod('FY22 Feb-May')).toMatchObject(
      pObj(K.FY, 202202, 202205)
    );
  });

  test('parsing basic fiscal month range across fiscal year should throw Error', () => {
    const badFiscalRange = () => {
      parsePeriod('FY22 Feb-Sep');
    };
    expect(badFiscalRange).toThrowError();
  });
  
  test('parse fiscal month range across calendar year end', () => {
    expect(parsePeriod('FY22 Oct-Jan')).toMatchObject(
      pObj(K.FY, 202110, 202201)
    );
  });

  test('parse calendar month range across calendar year end', () => {
    expect(parsePeriod('CY22 Oct-Jan')).toMatchObject(
      pObj(K.CY, 202210, 202301)
    );
  });

  test('parse reverse month range', () => {
    expect(parsePeriod('Mar-Aug CY2022')).toMatchObject(
      pObj(K.CY, 202203, 202208)
    );
  });

  test('parse date range', () => {
    expect(parsePeriod('CY1985 H1 - CY01 Q3')).toMatchObject(
      pObj(K.CY, 198501, 200109)
    );
  });

  test('parse loosely formatted date range', () => {
    expect(parsePeriod('FY2023 Q1 -FY2025 Q2')).toMatchObject(
      pObj(K.FY, 202207, 202412));
  });

  test('parse compact date range with different year kinds', () => {
    expect(parsePeriod('FY2037H2-NovCY42')).toMatchObject(
      pObj(K.FY, 203701, 204211));
  });
});

describe('parsing errors', () => {
  test('no year kind', () => {
    const noK = () => {
      parsePeriod('2022 Sep');
    };
    expect(noK).toThrowError();
  });

  test('no year', () => {
    const noYear = () => {
      parsePeriod('CY H1');
    };
    expect(noYear).toThrowError();
  });

  test('bad part', () => {
    const badPart = () => {
      parsePeriod('FY2023 U76');
    };
    expect(badPart).toThrowError();
  });

  test('bad half', () => {
    const badHalf = () => {
      parsePeriod('CY2022 H4');
    };
    expect(badHalf).toThrowError();
  });

  test('year too long', () => {
    const yearTooLong = () => {
      parsePeriod('CY20245 H1');
    };
    expect(yearTooLong).toThrowError();
  });

  test('too many parts', () => {
    const tooManyParts = () => {
      parsePeriod('FY2023 H1 Q3');
    };
    expect(tooManyParts).toThrowError();
  });
});
