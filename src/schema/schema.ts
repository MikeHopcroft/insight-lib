import Ajv from 'ajv';

import core from './schemas/core.schema.json';
import account from './schemas/Account.schema.json';
import capability from './schemas/Capability.schema.json';
import impact from './schemas/CustomerImpact.schema.json';
import customerPattern from './schemas/CustomerPattern.schema.json';
import customerScenario from './schemas/CustomerScenario.schema.json';
import industry from './schemas/Industry.schema.json';
import insight from './schemas/Insight.schema.json';
import macroTrend from './schemas/MacroForce.schema.json';
import productGroup from './schemas/ProductGroup.schema.json';
import regulatoryPattern from './schemas/RegulatoryPattern.schema.json';
import solutionPlay from './schemas/SolutionPlay.schema.json';
import marketForce from './schemas/Trend.schema.json';
import work from './schemas/Work.schema.json';
import edge from './schemas/Edge.schema.json';

const prefix = 'https://microsoft.com/is/';

const ajv = new Ajv();
ajv.addSchema(core, 'https://microsoft.com/is/core');
ajv.addSchema(account);
ajv.addSchema(capability);
ajv.addSchema(customerPattern);
ajv.addSchema(customerScenario);
ajv.addSchema(impact);
ajv.addSchema(industry);
ajv.addSchema(insight);
ajv.addSchema(macroTrend);
ajv.addSchema(marketForce);
ajv.addSchema(productGroup);
ajv.addSchema(regulatoryPattern);
ajv.addSchema(solutionPlay);
ajv.addSchema(work);
ajv.addSchema(edge);

export function validateJSONObj(json: Object): [boolean, string] {
  if (ajv.validate(schemaForJSONObj(json), json)) {
    return [true, ''];
  } else {
    return [false, ajv.errorsText(ajv.errors!)];
  }
}

export function validateJSONStr(json: string): [boolean, string] {
  try {
    const obj = JSON.parse(json);
    return validateJSONObj(obj);
  } catch (e: any) {
    return [false, e.message];
  }
}

function schemaForJSONObj(json: any): string {
  return prefix + json['type'].replace(/\s/g, '');
}
