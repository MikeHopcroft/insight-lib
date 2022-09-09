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
});
