import {IPeriod, parsePeriod} from '../../src/biz-calendar';

type Node = {
  id: number;
  name: string;
  date: string;
  period: IPeriod | undefined;
};

describe('sorting periods for display', () => {
  test('display sort with stable order', () => {
    const objects: Node[] = [
      {id: 11, name: 'April Fool', date: 'FY2022 Apr', period: undefined},
      {id: 12, name: 'May the Fourth', date: 'FY2022 May', period: undefined},
      {id: 2, name: 'Big Quarter', date: 'FY2022 Q3', period: undefined},
      {id: 6, name: 'Thing 2', date: 'FY22 Feb', period: undefined},
      {id: 9, name: "Someone's Quarter", date: 'FY22 Q4', period: undefined},
      {id: 13, name: 'Lost in Time', date: 'FY2022 Jun', period: undefined},
      {
        id: 14,
        name: 'Somnium',
        date: 'FY2023 Jul - FY2024 Dec',
        period: undefined,
      },
      {id: 3, name: 'Stuff', date: 'FY22 Q3', period: undefined},
      {
        id: 15,
        name: "Let's Get Organized",
        date: 'FY2023 H1',
        period: undefined,
      },
      {id: 21, name: 'Baseball', date: 'FY2023Aug', period: undefined},
      {id: 16, name: 'Who Uses CY?', date: 'CY22Q3', period: undefined},
      {id: 7, name: 'Demo', date: 'FY22 Feb', period: undefined},
      {id: 10, name: 'Weird Quarter', date: 'FY2022Q4', period: undefined},
      {id: 19, name: 'To', date: 'FY23 Jul', period: undefined},
      {id: 20, name: 'Jewel', date: 'FY2023 Jul', period: undefined},
      {id: 18, name: 'Remember', date: 'FY23 Jul-Aug', period: undefined},
      {id: 17, name: 'A Quarter', date: 'FY23 Q1', period: undefined},
      {id: 22, name: 'Sun', date: 'FY23\nAug', period: undefined},
      {id: 4, name: 'Thing 1', date: 'FY22 Jan', period: undefined},
      {id: 5, name: 'Spike', date: 'FY22 Feb-Mar', period: undefined},
      {
        id: 23,
        name: 'Special Project',
        date: 'FY23 Sep - Jan',
        period: undefined,
      },
      {id: 24, name: 'Half Time', date: 'FY23 H2', period: undefined},
      {id: 25, name: 'Quarter Time', date: 'FY2023 Q3', period: undefined},
      {id: 28, name: 'Overlap', date: 'FY23 Feb-Mar', period: undefined},
      {id: 26, name: 'Overlap', date: 'FY23 Jan-Mar', period: undefined},
      {id: 29, name: 'Thinking Ahead', date: 'FY2023 Q4', period: undefined},
      {id: 8, name: 'Science', date: 'CY22 Mar', period: undefined},
      {id: 27, name: 'Overlap', date: 'FY23 Jan-Feb', period: undefined},
      {id: 1, name: 'Straggler', date: 'CY21Dec', period: undefined},
    ];
    for (const o of objects) {
      o.period = parsePeriod(o.date);
    }
    const sorted = objects.sort((o1, o2) => {
      return o1.period!.compare(o2.period!);
    });
    let previous: Node = {id: 0, name: 'zeroith', date: '', period: undefined};
    for (const o of sorted) {
      console.log(o);
      expect(o.id - previous.id).toBe(1);
      previous = o;
    }
  });
});
