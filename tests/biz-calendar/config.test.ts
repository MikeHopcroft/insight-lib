import {
  parsePeriod,
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
  Range,
  Q1,
  Q2,
  Q3,
  Q4,
  H1,
  H2,
  Y,
} from '../../src/biz-calendar';
import {YearKind as K} from '../../src/biz-calendar/interface';
import {pObj, setConfig} from './test-support';

// math.test.ts tests fiscal year start config with the core calendar
// core.test.ts tests Period and its subclasses for different fiscal years

describe('configuring padding', () => {
  test('add one to all padding', () => {
    setConfig(7, '  ', '  ', '  ', ' ', false, ' ');
    expect(CY(2023, Y).toString()).toBe('CY2023');
    expect(FY(2023, Q1).toString()).toBe('FY2023  Q1');
    expect(FY(2023, H2).toString()).toBe('FY2023  H2');
    expect(FY(2023, Oct).toString()).toBe('FY2023  Oct');
    expect(CY(2023, Range(Jan, Nov)).toString()).toBe('CY2023  Jan - Nov');
    expect(CY(2023).toFiscal().toString()).toBe('FY2023  Jan  -  FY2024  Dec');
    expect(TBD().toString()).toBe(' TBD');
    setConfig();
  });

  test('make all padding tabs', () => {
    setConfig(7, '\t', '\t', '\t', '\t', false, '\t');
    expect(FY(2023, Q2).toString()).toBe('FY2023\tQ2');
    expect(FY(2023, H1).toString()).toBe('FY2023\tH1');
    expect(FY(2023, Oct).toString()).toBe('FY2023\tOct');
    expect(CY(2023, Range(Feb, Oct)).toString()).toBe('CY2023\tFeb\t-\tOct');
    expect(CY(2023).toFiscal().toString()).toBe('FY2023\tJan\t-\tFY2024\tDec');
    expect(TBD().toString()).toBe('\tTBD');
    setConfig();
  });

  test('make all padding newlines', () => {
    setConfig(7, '\n', '\n', '\n', '\n', false, '\n');
    expect(FY(2023, Q3).toString()).toBe('FY2023\nQ3');
    expect(FY(2023, H2).toString()).toBe('FY2023\nH2');
    expect(FY(2023, Oct).toString()).toBe('FY2023\nOct');
    expect(CY(2023, Range(Apr, Dec)).toString()).toBe('CY2023\nApr\n-\nDec');
    expect(CY(2023).toFiscal().toString()).toBe('FY2023\nJan\n-\nFY2024\nDec');
    expect(TBD().toString()).toBe('\nTBD');
    setConfig();
  });

  test('remove all padding', () => {
    setConfig(7, '', '', '', '', false, '');
    expect(FY(2023, Q4).toString()).toBe('FY2023Q4');
    expect(FY(2023, H2).toString()).toBe('FY2023H2');
    expect(FY(2023, Oct).toString()).toBe('FY2023Oct');
    expect(CY(2023, Range(May, Oct)).toString()).toBe('CY2023May-Oct');
    expect(CY(2023).toFiscal().toString()).toBe('FY2023Jan-FY2024Dec');
    expect(Unknown().toString()).toBe('Unknown');
    setConfig();
  });

  test('compact form', () => {
    setConfig(7, ' ', '', ' ', '', true, '');
    expect(FY(2056).toString()).toBe('FY56');
    expect(FY(2023, Q1).toString()).toBe('FY23 Q1');
    expect(FY(2023, H2).toString()).toBe('FY23 H2');
    expect(FY(2023, Aug).toString()).toBe('FY23Aug');
    expect(CY(2023, Range(Jul, Sep)).toString()).toBe('CY23Jul-Sep');
    expect(CY(2023).toFiscal().toString()).toBe('FY23Jan - FY24Dec');
    expect(Unknown().toString()).toBe('Unknown');
    setConfig();
  });
});

describe('parsing non-default padded strings', () => {
  test('parse compact form', () => {
    setConfig(7, ' ', '', '', '', true, '');
    expect(parsePeriod(FY(2023, Q1).toString())).toMatchObject(
      pObj(K.FY, 202207, 202209)
    );
    expect(parsePeriod(CY(2023, H2).toString())).toMatchObject(
      pObj(K.CY, 202307, 202312)
    );
    expect(parsePeriod(FY(2023, Oct).toString())).toMatchObject(
      pObj(K.FY, 202210, 202210)
    );
    expect(parsePeriod(CY(2023, Range(Feb, Oct)).toString())).toMatchObject(
      pObj(K.CY, 202302, 202310)
    );
    expect(parsePeriod(CY(2023).toFiscal().toString())).toMatchObject(
      pObj(K.FY, 202301, 202312)
    );
    setConfig();
  });

  test('parse mixed form', () => {
    setConfig(7, '\t', '\n', '\t', '   ', false, ' ');
    expect(parsePeriod(FY(2023, Q1).toString())).toMatchObject(
      pObj(K.FY, 202207, 202209)
    );
    expect(parsePeriod(CY(2023, H2).toString())).toMatchObject(
      pObj(K.CY, 202307, 202312)
    );
    expect(parsePeriod(FY(2023, Oct).toString())).toMatchObject(
      pObj(K.FY, 202210, 202210)
    );
    expect(parsePeriod(CY(2023, Range(Feb, Oct)).toString())).toMatchObject(
      pObj(K.CY, 202302, 202310)
    );
    expect(
      parsePeriod(CY(2023, Range(Mar, Jun)).toFiscal().toString())
    ).toMatchObject(pObj(K.FY, 202303, 202306));
    setConfig();
  });
});
