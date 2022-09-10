import {validateJSONStr} from '../../src/schema/schema';

describe('validating valid json documents', () => {
  test('minimum valid Account is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Account",
          "id": "0123456789ABCDEF",
          "name": "Tailspin Toys"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Account is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Account",
          "id": "0123456789ABCDEF",
          "name": "Tailspin Toys",
          "link": "https://tailspintoys.com",
          "description": "This is a valid Account json object."
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('minimum valid Capability is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Capability",
          "id": "123456789ABCDEF0",
          "name": "Tech check for patients"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Capability is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Capability",
          "id": "123456789ABCDEF0",
          "name": "Tech check for patients",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521396",
          "description": "This is a valid Capability json object.",
          "reported": "FY23 Q1",
          "indicator": "Green",
          "note": "This is a note with more context about the capability."
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('minimum valid Impact is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Impact",
          "id": "456789ABCDEF0123",
          "name": "Foo Services adoption is blocked"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Impact is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Impact",
          "id": "456789ABCDEF0123",
          "name": "Cognitive Services adoption is blocked",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521398",
          "description": "Enterprise adoption of Foo Services is blocked due to incompatability with installed systems."
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('minimum valid Customer Pattern is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Pattern",
          "id": "23456789ABCDEF01",
          "name": "Resilient Clusters"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Customer Pattern is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Pattern",
          "id": "23456789ABCDEF01",
          "name": "Resilient Clusters",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521397",
          "description": "This is a valid Customer Pattern json object.",
          "status": "Committed",
          "indicator": "Yellow"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('full valid Customer Pattern is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Pattern",
          "id": "23456789ABCDEF01",
          "name": "Resilient Clusters",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521397",
          "description": "This is a valid Customer Pattern json object.",
          "due": "FY23 H2",
          "status": "Committed",
          "indicator": "Yellow",
          "reported": "FY22 Q3",
          "note": "This is a full Customer Patter."
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('minimum valid Customer Scenario is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Scenario",
          "id": "3456789ABCDEF012",
          "name": "Virtual Appointments"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Customer Scenario is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Customer Scenario",
          "id": "3456789ABCDEF012",
          "name": "Virtual Appointments",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521397",
          "description": "This is a valid Customer Scenario json object."
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Industry is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Industry",
          "id": "56789ABCDEF01234",
          "name": "FSI",
          "description": "Financial Services and Insurance"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('minimum valid Insight is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Insight",
          "id": "56789ABCDEF01234",
          "name": "Networks are hard",
          "kind": "Add"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Insight is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Insight",
          "id": "56789ABCDEF01234",
          "name": "Networks are hard",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521398",
          "description": "They're even harder than you think they are.",
          "kind": "Add",
          "reported": "FY1994 H1",
          "indicator": "Yellow",
          "note": "Can we make them easier?"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Macro Force is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Macro Force",
          "id": "6789ABCDEF012345",
          "name": "Climate Change"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Product Group is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Product Group",
          "id": "789ABCDEF0123456",
          "name": "Azure Service Three"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Regulatory Pattern is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Regulatory Pattern",
          "id": "89ABCDEF01234567",
          "name": "Data Protection",
          "link": "https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679&from=EN#d1e1374-1-1",
          "description": "GDPR, CCPA, PIPL, and other data protection laws require specific care and proof points."
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Solution PLay is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Solution Play",
          "id": "89ABCDEF01234567",
          "name": "Industrial Metaverse"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Trend is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Trend",
          "id": "ABCDEF012345676890",
          "name": "Metaverse"
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid Work is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Work",
          "id": "BCDEF012345676890A",
          "name": "Deliver a Feature",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521399",
          "description": "This is an important feature for many customers.",
          "due": "FY23 Q3",
          "status": "At Risk"
        }
      `)
    ).toStrictEqual([true, '']);
  });
});

describe('validating system json documents', () => {
  test('valid system Insight is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Insight",
          "id": "56789ABCDEF01234",
          "name": "Networks are hard",
          "link": "https://is.visualstudio.com/IS/_workitems/edit/521398",
          "description": "They're even harder than you think they are.",
          "kind": "Add",
          "reported": "FY1994 H1",
          "indicator": "Yellow",
          "note": "Can we make them easier?",
          "tag": {
            "timestamp": "2022-09-10T11:51:45.832+00:00",
            "upn": "somename"
          }
        }
      `)
    ).toStrictEqual([true, '']);
  });

  test('valid system Edge is valid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Edge",
          "id": "0123456789ABCDEFFEDCBA9876543210",
          "from": {
            "id": "0123456789ABCDEF",
            "type": "Industry",
            "name": "Retail"
          },
          "pred": "includes",
          "to": {
            "id": "ABCDEF0123456789",
            "type": "Account",
            "name": "Tailspin Toys"
          },
          "tag": {
            "timestamp": "2022-09-10T11:51:45.832+00:00",
            "upn": "somename"
          }
        }
      `)
    ).toStrictEqual([true, '']);
  });
});

describe('validating invalid json documents', () => {
  test('unkown type is invalid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Widget",
          "id": "56789ABCDEF01234",
          "name": "Gear Grinder"
        }
      `)
    ).toStrictEqual([
      false,
      'no schema with key or ref "https://microsoft.com/is/Widget"',
    ]);
  });

  test('improperly formatted business date is invalid', () => {
    expect(
      validateJSONStr(`
        {
          "type": "Work",
          "id": "56789ABCDEF01234",
          "name": "Do Things",
          "due": "H2 2023"
        }
      `)
    ).toStrictEqual([
      false,
      'data/due must match pattern "^((FY|CY)(\\d{2}|\\d{4}) ((H(1|2)|Q(1|2|3|4)|(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)))|TBD|Unknown)$"',
    ]);
  });
});
