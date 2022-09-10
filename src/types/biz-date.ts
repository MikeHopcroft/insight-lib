const regex =
  /^((FY|CY)(\d{4}|\d{2}))( (H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))?|TBD|Unknown$/;

const months: {[key: string]: number} = {
  Jan: 1,
  Feb: 2,
  Mar: 3,
  Apr: 4,
  May: 5,
  Jun: 6,
  Jul: 7,
  Aug: 8,
  Sep: 9,
  Oct: 10,
  Nov: 11,
  Dec: 12,
};

export enum dateResolution {
  Year,
  Half,
  Quarter,
  Month,
  Invalid,
}

export class BizDate {
  original: string;
  fiscalNormalized: string;
  calendarYear: number;
  calendarMonth: number;
  resolution: dateResolution;
  valid: boolean;

  constructor(str = '') {
    let parts: [string, string, number, number, dateResolution] = [
      '',
      '',
      0,
      0,
      dateResolution.Invalid,
    ];
    if (str === '') {
      parts = thisMonth();
      this.valid = true;
    } else {
      if (regex.test(str)) {
        if (str === 'TBD' || str === 'Unknown') {
          parts = [str, str, 9999, 12, dateResolution.Year];
        } else {
          const matches = regex.exec(str)!;
          parts = parseMatches(str, matches[2], matches[3], matches[5]);
        }
        this.valid = true;
      } else {
        parts = [str, '', 0, 0, dateResolution.Invalid];
        this.valid = false;
      }
    }
    this.original = parts[0];
    this.fiscalNormalized = parts[1];
    this.calendarYear = parts[2];
    this.calendarMonth = parts[3];
    this.resolution = parts[4];
  }
}

function thisMonth(): [string, string, number, number, dateResolution] {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const calendar = `CY${year} ${toShortMonth(month)}`;
  const fiscalYear = calenderToFiscalYear(year, month);
  const fiscal = `FY${fiscalYear} ${toShortMonth(month)}`;
  return [calendar, fiscal, year, month, dateResolution.Month];
}

function parseMatches(
  str: string,
  fcy: string,
  y: string,
  hqm: string | undefined
): [string, string, number, number, dateResolution] {
  const fiscal = fcy === 'FY';
  let res = dateResolution.Year;
  let month = 12;
  let fiscal_hqm = '';
  if (hqm !== undefined) {
    switch (hqm) {
      case 'H1':
        month = fiscal ? 12 : 6;
        fiscal_hqm = fiscal ? 'H1' : 'H2';
        res = dateResolution.Half;
        break;
      case 'H2':
        month = fiscal ? 6 : 12;
        fiscal_hqm = fiscal ? 'H2' : 'H1';
        res = dateResolution.Half;
        break;
      case 'Q1':
        month = fiscal ? 9 : 3;
        fiscal_hqm = fiscal ? 'Q1' : 'Q3';
        res = dateResolution.Quarter;
        break;
      case 'Q2':
        month = fiscal ? 12 : 6;
        fiscal_hqm = fiscal ? 'Q2' : 'Q4';
        res = dateResolution.Quarter;
        break;
      case 'Q3':
        month = fiscal ? 3 : 9;
        fiscal_hqm = fiscal ? 'Q3' : 'Q1';
        res = dateResolution.Quarter;
        break;
      case 'Q4':
        month = fiscal ? 6 : 12;
        fiscal_hqm = fiscal ? 'Q4' : 'Q2';
        res = dateResolution.Quarter;
        break;
      default:
        month = toMonthOrd(hqm);
        fiscal_hqm = hqm;
        res = dateResolution.Month;
    }
  }
  let year = fiscal ? fiscalToCalendarYear(+y, month) : +y;
  year = year < 2000 ? 2000 + year : year;
  const fiscalStr =
    res === dateResolution.Year
      ? `FY${calenderToFiscalYear(year, month)}`
      : `FY${calenderToFiscalYear(year, month)} ${fiscal_hqm}`;
  return [str, fiscalStr, year, month, res];
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

function toShortMonth(month: number): string {
  for (const abbr in months) {
    if (months[abbr] === month) {
      return abbr;
    }
  }
  return '';
}

function toMonthOrd(month: string): number {
  return months[month];
}
