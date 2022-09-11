import {buildLexer} from 'typescript-parsec';

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

const Months = [
  YearPart.None,
  YearPart.Jan,
  YearPart.Feb,
  YearPart.Mar,
  YearPart.Apr,
  YearPart.May,
  YearPart.Jun,
  YearPart.Jul,
  YearPart.Aug,
  YearPart.Sep,
  YearPart.Oct,
  YearPart.Nov,
  YearPart.Dec,
];

export class BizDate {
  year: YearKind;
  part: YearPart;
  calendarYear: number;
  calendarMonth: number;

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

  toCYStr(): string {
    return '';
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

  toFYStr(): string {
    return '';
  }
}

export function parseBizDate(str: string): BizDate {
  return thisMonth();
}

export function thisHalf(yearKind = YearKind.CY): BizDate {
  return thisMonth(yearKind);
}

export function thisQuarter(yearKind = YearKind.CY): BizDate {
  return thisMonth(yearKind);
}

export function thisMonth(yearKind = YearKind.CY): BizDate {
  const dateNow = new Date();
  const yearNow = dateNow.getUTCFullYear();
  const monthNow = dateNow.getUTCMonth();
  if (yearKind === YearKind.CY) {
    return new BizDate(YearKind.CY, yearNow, yearPartFor(monthNow));
  } else {
    return new BizDate(
      YearKind.FY,
      calenderToFiscalYear(yearNow, monthNow),
      yearPartFor(monthNow)
    );
  }
}

function calendarMonthFor(kind: YearKind, part: YearPart): number {
  switch (part) {
    case YearPart.H1:
    case YearPart.Q2:
      return kind === YearKind.CY ? 6 : 12;
    case YearPart.H2:
    case YearPart.Q4:
      return kind === YearKind.CY ? 12 : 6;
    case YearPart.Q1:
      return kind === YearKind.CY ? 3 : 9;
    case YearPart.Q3:
      return kind === YearKind.CY ? 9 : 3;
    case YearPart.Jan:
      return 1;
    case YearPart.Feb:
      return 2;
    case YearPart.Mar:
      return 3;
    case YearPart.Apr:
      return 4;
    case YearPart.May:
      return 5;
    case YearPart.Jun:
      return 6;
    case YearPart.Jul:
      return 7;
    case YearPart.Aug:
      return 8;
    case YearPart.Sep:
      return 9;
    case YearPart.Oct:
      return 10;
    case YearPart.Nov:
      return 11;
    case YearPart.Dec:
      return 12;
    default:
      return 12;
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

function yearPartFor(month: number): YearPart {
  return Months[month];
}

// ========== Parser ==========

enum TokenKind {
  YearSpec,
  YearNumber,
  YearPart,
  Month,
  Number,
  TBD,
  Unknown,
  Space,
}

const lexer = buildLexer([
  [true, /^(FY)|(CY)/g, TokenKind.YearSpec],
  [true, /^\d{4}|\d{2}/g, TokenKind.YearNumber],
  [true, /^H|Q/g, TokenKind.YearPart],
  [true, /^\d/g, TokenKind.Number],
  [
    true,
    /^(Jan)|(Feb)|(Mar)|(Apr)|(May)|(Jun)|(Jul)|(Aug)|(Sep)|(Oct)|(Nov)|(Dec)/g,
    TokenKind.Month,
  ],
  [true, /^TBD/g, TokenKind.TBD],
  [true, /^Unknown/g, TokenKind.Unknown],
  [false, /^\s/g, TokenKind.Space],
]);
