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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;

export enum YearKind {
  CY,
  FY,
  TBD,
  Unknown,
}

export enum YearPart {
  Year,
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
  None,
}

const partStr = [
  'Year',
  'H1',
  'H2',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'None',
];

enum Resolution {
  Half,
  Month,
  Quarter,
  Year,
}

// PartsTable is indexable by
// [month - 1: number][YearKind.CY|FY][Resolution]
const PartsTable = [
  [
    [YearPart.H1, YearPart.Jan, YearPart.Q1, YearPart.Year],
    [YearPart.H2, YearPart.Jan, YearPart.Q3, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Feb, YearPart.Q1, YearPart.Year],
    [YearPart.H2, YearPart.Feb, YearPart.Q3, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Mar, YearPart.Q1, YearPart.Year],
    [YearPart.H2, YearPart.Mar, YearPart.Q3, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Apr, YearPart.Q2, YearPart.Year],
    [YearPart.H2, YearPart.Apr, YearPart.Q4, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.May, YearPart.Q2, YearPart.Year],
    [YearPart.H2, YearPart.May, YearPart.Q4, YearPart.Year],
  ],
  [
    [YearPart.H1, YearPart.Jun, YearPart.Q2, YearPart.Year],
    [YearPart.H2, YearPart.Jun, YearPart.Q4, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Jul, YearPart.Q3, YearPart.Year],
    [YearPart.H1, YearPart.Jul, YearPart.Q1, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Aug, YearPart.Q3, YearPart.Year],
    [YearPart.H1, YearPart.Aug, YearPart.Q1, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Sep, YearPart.Q3, YearPart.Year],
    [YearPart.H1, YearPart.Sep, YearPart.Q1, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Oct, YearPart.Q4, YearPart.Year],
    [YearPart.H1, YearPart.Oct, YearPart.Q2, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Nov, YearPart.Q4, YearPart.Year],
    [YearPart.H1, YearPart.Nov, YearPart.Q2, YearPart.Year],
  ],
  [
    [YearPart.H2, YearPart.Dec, YearPart.Q4, YearPart.Year],
    [YearPart.H1, YearPart.Dec, YearPart.Q2, YearPart.Year],
  ],
];

export class BizDate {
  private year: YearKind;
  private part: YearPart;
  private calendarYear: number;
  private calendarMonth: number;

  constructor(kind: YearKind, year: number, part: YearPart) {
    this.year = kind;
    const vYear = validYear(year);
    if (kind === YearKind.CY || kind === YearKind.FY) {
      this.part = part;
      this.calendarMonth = calendarMonthFor(kind, part);
      if (kind === YearKind.CY) {
        this.calendarYear = vYear;
      } else {
        this.calendarYear = fiscalToCalendarYear(vYear, this.calendarMonth);
      }
    } else {
      this.part = YearPart.None;
      this.calendarYear = 9999;
      this.calendarMonth = 12;
    }
  }

  toCalendarYear(): BizDate {
    if (this.year === YearKind.FY) {
      return new BizDate(
        YearKind.CY,
        this.calendarYear,
        reverseYearPart(this.part)
      );
    } else {
      return this;
    }
  }

  toFiscalYear(): BizDate {
    if (this.year === YearKind.CY) {
      return new BizDate(
        YearKind.FY,
        calenderToFiscalYear(this.calendarYear, this.calendarMonth),
        reverseYearPart(this.part)
      );
    } else {
      return this;
    }
  }

  toHalf(): BizDate {
    return this.toResolution(Resolution.Half);
  }

  toMonth(): BizDate {
    return this.toResolution(Resolution.Month);
  }

  private toResolution(resolution: Resolution): BizDate {
    switch (this.year) {
      case YearKind.CY:
        return new BizDate(
          YearKind.CY,
          this.calendarYear,
          yearPartFor(YearKind.CY, this.calendarMonth, resolution)
        );
      case YearKind.FY:
        return new BizDate(
          YearKind.FY,
          calenderToFiscalYear(this.calendarYear, this.calendarMonth),
          yearPartFor(YearKind.FY, this.calendarMonth, resolution)
        );
      default:
        return this;
    }
  }

  toQuarter(): BizDate {
    return this.toResolution(Resolution.Quarter);
  }

  toString(): string {
    switch (this.year) {
      case YearKind.TBD:
        return 'TBD';
      case YearKind.CY:
        return `CY${this.calendarYear} ${partStr[this.part]}`;
      case YearKind.FY:
        return `FY${calenderToFiscalYear(
          this.calendarYear,
          this.calendarMonth
        )} ${partStr[this.part]}`;
      default:
        return 'Unknown';
    }
  }

  toYear(): BizDate {
    return this.toResolution(Resolution.Year);
  }
}

export function parseBizDate(str: string): BizDate {
  return parse(str);
}

export function thisHalf(yearKind = YearKind.CY): BizDate {
  return thisMonth(yearKind).toHalf();
}

export function thisQuarter(yearKind = YearKind.CY): BizDate {
  return thisMonth(yearKind).toQuarter();
}

export function thisMonth(yearKind = YearKind.CY): BizDate {
  const dateNow = new Date();
  const yearNow = dateNow.getUTCFullYear();
  const monthNow = dateNow.getUTCMonth() + 1;
  if (yearKind === YearKind.CY) {
    return new BizDate(
      YearKind.CY,
      yearNow,
      yearPartFor(yearKind, monthNow, Resolution.Month)
    );
  } else {
    return new BizDate(
      YearKind.FY,
      calenderToFiscalYear(yearNow, monthNow),
      yearPartFor(yearKind, monthNow, Resolution.Month)
    );
  }
}

function calendarMonthFor(kind: YearKind, part: YearPart): number {
  switch (part) {
    case YearPart.H1:
    case YearPart.Q2:
      return kind === YearKind.CY ? 6 : 12;
    case YearPart.Year:
    case YearPart.H2:
    case YearPart.Q4:
    case YearPart.None:
      return kind === YearKind.CY ? 12 : 6;
    case YearPart.Q1:
      return kind === YearKind.CY ? 3 : 9;
    case YearPart.Q3:
      return kind === YearKind.CY ? 9 : 3;
    default:
      return part - 6;
  }
}

function calenderToFiscalYear(year: number, month: number): number {
  if (month > 6) {
    return year + 1;
  } else {
    return year;
  }
}

function fiscalToCalendarYear(year: number, month: number): number {
  if (month > 6) {
    return year - 1;
  } else {
    return year;
  }
}

function reverseYearPart(part: YearPart): number {
  switch (part) {
    case YearPart.H1:
      return YearPart.H2;
    case YearPart.H2:
      return YearPart.H1;
    case YearPart.Q1:
      return YearPart.Q3;
    case YearPart.Q2:
      return YearPart.Q4;
    case YearPart.Q3:
      return YearPart.Q1;
    case YearPart.Q4:
      return YearPart.Q2;
    default:
      return part;
  }
}

function validYear(year: number): number {
  let y = Math.floor(year);
  y = y < 0 ? -y : y;
  y = y > 9999 ? 9999 : y;
  return y;
}

function yearPartFor(year: YearKind, month: number, res: Resolution): YearPart {
  if (year === YearKind.TBD || year === YearKind.Unknown) {
    return YearPart.None;
  }
  return PartsTable[month - 1][year][res];
}

// ========== Parser ==========

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

const DATE = rule<TokenKind, BizDate>();
const YEAR = rule<TokenKind, [YearKind, number]>();
const PART = rule<TokenKind, YearPart>();

function applyCY(
  value: [Token<TokenKind.CY>, Token<TokenKind.Number>]
): [YearKind, number] {
  let year = +value[1].text;
  if (year < 1) {
    throw new Error(`Years must be whole numbers: ${year}`);
  }
  if (year > 9999) {
    throw new Error(`Years must be less than 10,000: ${year}`);
  }
  year = year < 100 ? 2000 + year : year;
  return [YearKind.CY, year];
}

function applyDate(value: [[YearKind, number], YearPart | undefined]): BizDate {
  const part = value[1] === undefined ? YearPart.Year : value[1];
  return new BizDate(value[0][0], value[0][1], part);
}

function applyFY(
  value: [Token<TokenKind.FY>, Token<TokenKind.Number>]
): [YearKind, number] {
  let year = +value[1].text;
  if (year < 1) {
    throw new Error(`Years must be whole numbers: ${year}`);
  }
  if (year > 9999) {
    throw new Error(`Years must be less than 10,000: ${year}`);
  }
  year = year < 100 ? 2000 + year : year;
  return [YearKind.FY, year];
}

function applyHalf(
  value: [Token<TokenKind.Half>, Token<TokenKind.Number>]
): YearPart {
  const n = +value[1].text;
  if (n < 1 || n > 2) {
    throw new Error(`There are two halves in a year: ${n}`);
  }
  return n; // YearPart[1..2]
}

function applyMonth(value: Token<any>): YearPart {
  return value.kind; // YearPart[7..18]
}

function applyQuarter(
  value: [Token<TokenKind.Quarter>, Token<TokenKind.Number>]
): YearPart {
  const n = +value[1].text;
  if (n < 1 || n > 4) {
    throw new Error(`There are four quarters in a year: ${n}`);
  }
  return n + 2; // YearPart[3..6]
}

function applyTBD(): BizDate {
  return new BizDate(YearKind.TBD, 9999, YearPart.None);
}

function applyUnknown(): BizDate {
  return new BizDate(YearKind.Unknown, 9999, YearPart.None);
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
  = YEAR PART
  = 'TBD'
  = 'UNKOWN'
*/
DATE.setPattern(
  alt(
    apply(seq(YEAR, opt(PART)), applyDate),
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
  = Half HalfNumber
  = Quarter QuarterNumber
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

function parse(expr: string): BizDate {
  return expectSingleResult(expectEOF(DATE.parse(lexer.parse(expr))));
}
