import {
  CY,
  FY,
  Y,
  H1,
  H2,
  Q1,
  Q2,
  Q3,
  Q4,
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
  TBD,
  Unknown,
  periodFunction,
} from './construction';
import {Period, YearKind} from './core';
import {IPeriod} from './interface';
import {
  alt,
  apply,
  buildLexer,
  expectEOF,
  expectSingleResult,
  opt,
  rule,
  seq,
  tok,
  Token,
} from 'typescript-parsec';

/**
 * Parses a string in the form 'FY2023 Q1' or 'CY22 Sep'
 *
 * Parser examples:
 *    parsePeriod('CY2023 Sep')
 *    parsePeriod('FY2023 H1')
 *    parsePeriod('CY28 Q3')
 *    parsePeriod('FY23')
 *    parsePeriod('H2 FY24')
 *    parsePeriod('FY 2026   Q2')
 *    parsePeriod('FY24 Jun-Oct');
 *    parsePeriod('FY2061 Q1 - CY2072 H2')
 *
 * @param str the string to parse
 * @returns a period that matches the string description
 *
 * @throws Error, if the parse fails
 */
export function parsePeriod(str: string): IPeriod {
  return parse(str);
}

enum TokenKind {
  CY,
  FY,
  Half,
  Number,
  Quarter,
  TBD,
  Unknown,
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
  Dash,
  Space,
}

const MONTH_BUILDERs = [
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
];
const QUARTER_BUILDERS = [Q1, Q2, Q3, Q4];

type yearFunction = (year: number, func: periodFunction) => IPeriod;

const DATE = rule<TokenKind, IPeriod>();
const MONTH = rule<TokenKind, number>();
const PART = rule<TokenKind, periodFunction>();
const PERIOD = rule<TokenKind, IPeriod>();
const YEAR = rule<TokenKind, [yearFunction, number]>();

function applyCY(
  value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
): [yearFunction, number] {
  return [CY, +value[1].text];
}

function applyDate(
  value: [[yearFunction, number], periodFunction | undefined]
): IPeriod {
  const func = value[1] === undefined ? Y : value[1];
  return value[0][0](value[0][1], func);
}

function applyFY(
  value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
): [yearFunction, number] {
  return [FY, +value[1].text];
}

function applyHalf(
  value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
): periodFunction {
  const n = +value[1].text;
  if (n < 1 || n > 2) {
    throw new Error(`There are two halves in a year: ${n}`);
  }
  if (n === 1) {
    return H1;
  } else {
    return H2;
  }
}

function applyMonth(value: number): periodFunction {
  return MONTH_BUILDERs[value - 1]; // month ordinal to builders index
}

function applyMonthRange(
  value: [number, Token<TokenKind.Dash>, number]
): periodFunction {
  const startMonth = value[0];
  const endMonth = value[2];
  return (year: number, kind: YearKind): IPeriod => {
    return new Period(kind, year, startMonth, -1, endMonth);
  };
}

function applyMonthToken(value: Token<any>): number {
  return value.kind - 6; // token index to month ordinal
}

function applyPeriodToDate(value: IPeriod): IPeriod {
  return value;
}

function applyPeriodToDateRange(
  value: [IPeriod, Token<TokenKind.Dash>, IPeriod]
): IPeriod {
  return value[0].newPeriodTo(value[2]);
}

function applyQuarter(
  value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
): periodFunction {
  const n = +value[1].text;
  if (n < 1 || n > 4) {
    throw new Error(`There are four quarters in a year: ${n}`);
  }
  return QUARTER_BUILDERS[n - 1];
}

function applyReverse(value: [periodFunction, [yearFunction, number]]): IPeriod {
  return applyDate([value[1], value[0]]);
}

function applyTBD(): IPeriod {
  return TBD();
}

function applyUnknown(): IPeriod {
  return Unknown();
}

const lexer = buildLexer([
  [true, /^CY/g, TokenKind.CY],
  [true, /^FY/g, TokenKind.FY],
  [true, /^\d{1,4}/g, TokenKind.Number],
  [true, /^H/g, TokenKind.Half],
  [true, /^Q/g, TokenKind.Quarter],
  [true, /^TBD/g, TokenKind.TBD],
  [true, /^Unknown/g, TokenKind.Unknown],
  [true, /^Jan/g, TokenKind.Jan],
  [true, /^Feb/g, TokenKind.Feb],
  [true, /^Mar/g, TokenKind.Mar],
  [true, /^Apr/g, TokenKind.Apr],
  [true, /^May/g, TokenKind.May],
  [true, /^Jun/g, TokenKind.Jun],
  [true, /^Jul/g, TokenKind.Jul],
  [true, /^Aug/g, TokenKind.Aug],
  [true, /^Sep/g, TokenKind.Sep],
  [true, /^Oct/g, TokenKind.Oct],
  [true, /^Nov/g, TokenKind.Nov],
  [true, /^Dec/g, TokenKind.Dec],
  [true, /^-/g, TokenKind.Dash],
  [false, /^\s/g, TokenKind.Space],
]);

/*
PERIOD
  = DATE (- DATE)?
  = 'TBD'
  = 'UNKOWN'
*/
PERIOD.setPattern(
  alt(
    apply(DATE, applyPeriodToDate),
    apply(seq(DATE, tok(TokenKind.Dash), DATE), applyPeriodToDateRange),
    apply(tok(TokenKind.TBD), applyTBD),
    apply(tok(TokenKind.Unknown), applyUnknown)
  )
);

/*
DATE
  = YEAR (PART)?
  = PART YEAR
*/
DATE.setPattern(
  alt(
    apply(seq(YEAR, opt(PART)), applyDate),
    apply(seq(PART, YEAR), applyReverse)
  )
);

/*
YEAR
  = CY(\d{4}|\d{2})
  = FY(\d{4}|\d{2})
*/
YEAR.setPattern(
  alt(
    apply(seq(tok(TokenKind.CY), tok(TokenKind.Number)), applyCY),
    apply(seq(tok(TokenKind.FY), tok(TokenKind.Number)), applyFY)
  )
);

/*
PART
  = Half [1..2]
  = Quarter [1..4]
  = [Month] (- [Month])?
*/
PART.setPattern(
  alt(
    apply(seq(tok(TokenKind.Half), tok(TokenKind.Number)), applyHalf),
    apply(seq(tok(TokenKind.Quarter), tok(TokenKind.Number)), applyQuarter),
    apply(MONTH, applyMonth),
    apply(seq(MONTH, tok(TokenKind.Dash), MONTH), applyMonthRange)
  )
);

MONTH.setPattern(
  alt(
    apply(tok(TokenKind.Jan), applyMonthToken),
    apply(tok(TokenKind.Feb), applyMonthToken),
    apply(tok(TokenKind.Mar), applyMonthToken),
    apply(tok(TokenKind.Apr), applyMonthToken),
    apply(tok(TokenKind.May), applyMonthToken),
    apply(tok(TokenKind.Jun), applyMonthToken),
    apply(tok(TokenKind.Jul), applyMonthToken),
    apply(tok(TokenKind.Aug), applyMonthToken),
    apply(tok(TokenKind.Sep), applyMonthToken),
    apply(tok(TokenKind.Oct), applyMonthToken),
    apply(tok(TokenKind.Nov), applyMonthToken),
    apply(tok(TokenKind.Dec), applyMonthToken)
  )
);

function parse(expr: string): IPeriod {
  return expectSingleResult(expectEOF(PERIOD.parse(lexer.parse(expr))));
}
