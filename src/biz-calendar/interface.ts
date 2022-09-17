import {Month, YearKind} from './core';

export interface IPeriod {
  compare(date: IPeriod): number;
  contains(date: IPeriod): boolean;
  endsAfter(date: IPeriod): boolean;
  endsBefore(date: IPeriod): boolean;
  endsSameMonth(date: IPeriod): boolean;
  equals(date: IPeriod): boolean;
  getEndCalendarMonth(): number;
  getEndCalendarYear(): number;
  getEndFiscalMonth(): number;
  getEndFiscalYear(): number;
  getEndMonth(): Month;
  getStartCalendarMonth(): number;
  getStartCalendarYear(): number;
  getStartFiscalMonth(): number;
  getStartFiscalYear(): number;
  getStartMonth(): Month;
  isAfter(date: IPeriod): boolean;
  isBefore(date: IPeriod): boolean;
  isCalendarPeriod(): boolean;
  isFiscalPeriod(): boolean;
  startsAfter(date: IPeriod): boolean;
  startsBefore(date: IPeriod): boolean;
  startsSameMonth(date: IPeriod): boolean;
  toCalendar(): IPeriod;
  toFiscal(): IPeriod;
  toMonths(): Month[];
  toString(): string;
  getEndYearMonth(): number;
  getKind(): YearKind;
  getStartYearMonth(): number;
}


