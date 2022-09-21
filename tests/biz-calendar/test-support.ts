import {YearKind as K} from '../../src/biz-calendar/core';

export function pObj(kind: K, start: number, end: number): object {
  return {
    kind: kind,
    startYearMonth: start,
    endYearMonth: end,
  };
}
