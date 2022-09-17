export enum K {
  CY,
  FY,
}

export function pObj(kind: K, start: number, end: number): object {
  return {
    kind: kind,
    startYearMonth: start,
    endYearMonth: end,
  };
}
