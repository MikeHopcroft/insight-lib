import {validateJSONStr} from '../../src/schema/schema';

describe('validating valid json documents', () => {
  test('valid account is valid', () => {
    const accountStr = `
      {
        "type": "Account",
        "id": "0123456789ABCDEF",
        "name": "Tailspin Toys",
        "link": "https://tailspintoys.com",
        "description": "This is a valid Account json object."
      }
    `;
    expect(validateJSONStr(accountStr)).toStrictEqual([true, '']);
  });

  test('valid Capability is valid', () => {
    const capabilityStr = `
      {
        "type": "Capability",
        "id": "123456789ABCDEF0",
        "name": "Tech check for patients",
        "link": "https://is.visualstudio.com/IS/_workitems/edit/521396",
        "description": "This is a valid Capability json object.",
        "reported": "FY23 Q1",
        "status": "Yellow",
        "note": "This is a note with more context about the capability."
      }
    `;
    expect(validateJSONStr(capabilityStr)).toStrictEqual([true, '']);
  });

  test('valid Customer Pattern is valid', () => {
    const customerPatternStr = `
      {
        "type": "Customer Pattern",
        "id": "23456789ABCDEF01",
        "name": "Resilient Clusters",
        "link": "https://is.visualstudio.com/IS/_workitems/edit/521397",
        "description": "This is a valid Customer Pattern json object.",
        "status": "Committed",
        "indicator": "Yellow"
      }
    `;
    expect(validateJSONStr(customerPatternStr)).toStrictEqual([true, '']);
  });
});
