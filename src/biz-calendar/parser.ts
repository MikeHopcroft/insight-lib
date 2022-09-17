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
} from './construction';
import {
  TBD,
  Unknown,
  YearKind
} from './core';
import {
  IPeriod,
} from './interface';
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
 * @param str the string to parse
 * @returns a BizDate that matches the string description
 *
 * @throws Error, if the parse fails
 */
 export function parsePeriod(str: string): IPeriod {
  return parse(str);
}

/**
 * Use PeriodParser instead of calling the parse function directly to provide
 * a non-default fiscal year.
 */
 export class PeriodParser {
  private fiscalYearStartMonth: number;

  constructor(fiscalYearStartMonth = 7) {
    if (1 > fiscalYearStartMonth && fiscalYearStartMonth > 12) {
      throw new Error(`${fiscalYearStartMonth} is not a month`);
    }
    this.fiscalYearStartMonth = fiscalYearStartMonth;
  }

  parse(str: string): IPeriod {
    return parse(str);
  }
}

function parse(expr: string): IPeriod {
  return expectSingleResult(expectEOF(DATE.parse(lexer.parse(expr))));
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

const DATE = rule<TokenKind, IPeriod>();
const YEAR = rule<
  TokenKind,
  [
    (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
    number
  ]
>();
const PART = rule<TokenKind, (year: number, kind: YearKind) => IPeriod>();

function applyCY(
  value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
): [
  (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
  number
] {
  return [CY, +value[1].text];
}

function applyDate(
  value: [
    [
      (
        year: number,
        func: (year: number, kind: YearKind) => IPeriod
      ) => IPeriod,
      number
    ],
    ((year: number, kind: YearKind) => IPeriod) | undefined
  ]
): IPeriod {
  const func = value[1] === undefined ? Y : value[1];
  return value[0][0](value[0][1], func);
}

function applyFY(
  value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
): [
  (year: number, func: (year: number, kind: YearKind) => IPeriod) => IPeriod,
  number
] {
  return [FY, +value[1].text];
}

function applyHalf(
  value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
): (year: number, kind: YearKind) => IPeriod {
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

function applyMonth(
  value: Token<any>
): (year: number, kind: YearKind) => IPeriod {
  return MONTH_BUILDERs[value.kind - 7];
}

function applyQuarter(
  value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
): (year: number, kind: YearKind) => IPeriod {
  const n = +value[1].text;
  if (n < 1 || n > 4) {
    throw new Error(`There are four quarters in a year: ${n}`);
  }
  return QUARTER_BUILDERS[n - 1];
}

function applyReverse(
  value: [
    (year: number, kind: YearKind) => IPeriod,
    [
      (
        year: number,
        func: (year: number, kind: YearKind) => IPeriod
      ) => IPeriod,
      number
    ]
  ]
): IPeriod {
  return applyDate([value[1], value[0]]);
}

function applyTBD(): IPeriod {
  return new TBD();
}

function applyUnknown(): IPeriod {
  return new Unknown();
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
  [false, /^\s/g, TokenKind.Space],
]);

/*
DATE
  = YEAR (PART)?
  = PART YEAR
  = 'TBD'
  = 'UNKOWN'
*/
DATE.setPattern(
  alt(
    apply(seq(YEAR, opt(PART)), applyDate),
    apply(seq(PART, YEAR), applyReverse),
    apply(tok(TokenKind.TBD), applyTBD),
    apply(tok(TokenKind.Unknown), applyUnknown)
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
  = [Month]
  = Half Number in [1..2]
  = Quarter Number in [1..4]
*/
PART.setPattern(
  alt(
    apply(tok(TokenKind.Jan), applyMonth),
    apply(tok(TokenKind.Feb), applyMonth),
    apply(tok(TokenKind.Mar), applyMonth),
    apply(tok(TokenKind.Apr), applyMonth),
    apply(tok(TokenKind.May), applyMonth),
    apply(tok(TokenKind.Jun), applyMonth),
    apply(tok(TokenKind.Jul), applyMonth),
    apply(tok(TokenKind.Aug), applyMonth),
    apply(tok(TokenKind.Sep), applyMonth),
    apply(tok(TokenKind.Oct), applyMonth),
    apply(tok(TokenKind.Nov), applyMonth),
    apply(tok(TokenKind.Dec), applyMonth),
    apply(seq(tok(TokenKind.Half), tok(TokenKind.Number)), applyHalf),
    apply(seq(tok(TokenKind.Quarter), tok(TokenKind.Number)), applyQuarter)
  )
);
