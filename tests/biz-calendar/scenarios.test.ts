import {IPeriod, parsePeriod} from '../../src/biz-calendar';

type Node = {
  id: number;
  name: string;
  bizPeriod: string;
};

type Wrapper = {
  node: Node;
  period?: IPeriod;
};

describe('sorting parsed periods for display', () => {
  test('display sort with stable order', () => {
    // Node set from somewhere (e.g. database)
    const nodes: Node[] = [
      {id: 11, name: 'April Fool', bizPeriod: 'FY2022 Apr'},
      {id: 12, name: 'May the Fourth', bizPeriod: 'FY2022 May'},
      {id: 2, name: 'Big Quarter', bizPeriod: 'FY2022 Q3'},
      {id: 6, name: 'Thing 2', bizPeriod: 'FY22 Feb'},
      {id: 9, name: "Someone's Quarter", bizPeriod: 'FY22 Q4'},
      {id: 13, name: 'Lost in Time', bizPeriod: 'FY2022 Jun'},
      {id: 14, name: 'Somnium', bizPeriod: 'FY2023 Jul - FY2024 Dec'},
      {id: 3, name: 'Stuff', bizPeriod: 'FY22 Q3'},
      {id: 15, name: "Let's Get Organized", bizPeriod: 'FY2023 H1'},
      {id: 21, name: 'Baseball', bizPeriod: 'FY2023Aug'},
      {id: 16, name: 'Who Uses CY?', bizPeriod: 'CY22Q3'},
      {id: 7, name: 'Demo', bizPeriod: 'FY22 Feb'},
      {id: 10, name: 'Weird Quarter', bizPeriod: 'FY2022Q4'},
      {id: 19, name: 'To', bizPeriod: 'FY23 Jul'},
      {id: 20, name: 'Jewel', bizPeriod: 'FY2023 Jul'},
      {id: 18, name: 'Remember', bizPeriod: 'FY23 Jul-Aug'},
      {id: 17, name: 'A Quarter', bizPeriod: 'FY23 Q1'},
      {id: 22, name: 'Sun', bizPeriod: 'FY23\nAug'},
      {id: 4, name: 'Thing 1', bizPeriod: 'FY22 Jan'},
      {id: 5, name: 'Spike', bizPeriod: 'FY22 Feb-Mar'},
      {id: 23, name: 'Special Project', bizPeriod: 'FY23 Sep - Jan'},
      {id: 24, name: 'Half Time', bizPeriod: 'FY23 H2'},
      {id: 25, name: 'Quarter Time', bizPeriod: 'FY2023 Q3'},
      {id: 28, name: 'Overlap', bizPeriod: 'FY23 Feb-Mar'},
      {id: 26, name: 'Overlap', bizPeriod: 'FY23 Jan-Mar'},
      {id: 29, name: 'Thinking Ahead', bizPeriod: 'FY2023 Q4'},
      {id: 8, name: 'Science', bizPeriod: 'CY22 Mar'},
      {id: 27, name: 'Overlap', bizPeriod: 'FY23 Jan-Feb'},
      {id: 1, name: 'Straggler', bizPeriod: 'CY21Dec'},
    ];

    // Service or client parses types stored as strings, like period dates,
    // perhaps using wrapper objects for the parsed values when the
    // values are returned from their dependencies.
    const wrappedAndParsed: Wrapper[] = [];
    for (const node of nodes) {
      try {
        wrappedAndParsed.push({
          node: node,
          period: parsePeriod(node.bizPeriod),
        });
      } catch (e) {
        console.log(`Could not parse ${node.bizPeriod}`);
        console.log(`Error: ${(e as Error).message}`)
      }
    }

    // Periods can be used to sort as expected
    const sorted = wrappedAndParsed.sort((wp1, wp2) => {
      return wp1.period!.compare(wp2.period!);
    });
    let previous: Wrapper = {node: {id: 0, name: 'zeroith', bizPeriod: ''}};
    for (const wrapper of sorted) {
      expect(wrapper.node.id - previous.node.id).toBe(1);
      previous = wrapper;
    }
  });
});
