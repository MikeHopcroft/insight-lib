import {PeriodConfig} from '../../src/biz-calendar';
import {YearKind as K} from '../../src/biz-calendar/interface';

export function pObj(kind: K, start: number, end: number): object {
  return {
    kind: kind,
    startYearMonth: start,
    endYearMonth: end,
  };
}

export function setConfig(
  fiscal = 7,
  hqPad = ' ',
  monthPad = ' ',
  dateRangePad = ' ',
  monthRangePad = '',
  shortYear = false,
  tbdPad = ''
) {
  PeriodConfig.fiscalYearStartMonth = fiscal;
  PeriodConfig.stringHalfAndQuarterPad = hqPad;
  PeriodConfig.stringMonthPad = monthPad;
  PeriodConfig.stringDateRangePad = dateRangePad;
  PeriodConfig.stringMonthRangePad = monthRangePad;
  PeriodConfig.stringShortYear = shortYear;
  PeriodConfig.stringTBDPad = tbdPad;
}
