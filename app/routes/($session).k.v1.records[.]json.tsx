import { ActionFunctionArgs } from "@remix-run/node";
import { all, dbSession } from "~/utils/db.server";
import sqlParser from 'node-sql-parser';
import { FieldTypes, getFieldTypes } from "~/utils/query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const replaceField = (expression: any, fieldTypes: FieldTypes) => {
  switch (expression.type) {
    case 'binary_expr':
      // 左辺と右辺を再帰的に探索
      replaceField(expression.left, fieldTypes);
      replaceField(expression.right, fieldTypes);
      break;
    case 'column_ref':
      switch (fieldTypes[expression.column]) {
        case 'CREATED_TIME':
        case 'UPDATED_TIME':
        case 'DATETIME':
          expression.column = `datetime(body->>'$.${expression.column}.value', '+9 hours')`;
          break;
        case 'DATE':
          expression.column = `date(body->>'$.${expression.column}.value', '+9 hours')`;
          break;
        default:
          expression.column = `body->>'$.${expression.column}.value'`;
          break;
      }
      break;
    case 'function':
      switch (expression.name.name[0].value) {
        case 'NOW':
          expression.name.name[0].value = 'datetime';
          expression.args.value = [{ type: 'single_quote_string', value: 'now' }, { type: 'single_quote_string', value: '+9 hours' }];
          break;
      }
  }
}

const generateRecords = (recordResult: { body: string }[], fieldTypes: FieldTypes) => {
  return recordResult.map((record) => {
    const body = JSON.parse(record.body);
    for (const key in body) {
      body[key].type = fieldTypes[key];
    }
    return body;
  });
}

export const loader = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const db = dbSession(params.session);
  const url = new URL(request.url);
  const app = url.searchParams.get('app');
  const query = url.searchParams.get('query');
  const fieldTypes = await getFieldTypes(db, app!);
  if (query === null) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recordResult = await all<{ body: any }>(db, `SELECT body FROM records WHERE app_id = ?`, app);
    return Response.json({ totalCount: recordResult.length.toString(), records: generateRecords(recordResult, fieldTypes) });

  }
  const parser = new sqlParser.Parser();
  const ast = parser.astify('select * from records where ' + query!);

  if (!('where' in ast) || ast.where === null) {
    throw new Error('invalid query');
  }

  const where = ast.where;

  console.log(JSON.stringify(where, null, 2));

  replaceField(where, fieldTypes);
  const newQuery = parser.sqlify(ast, { database: 'sqlite' });
  const afterQuery = newQuery.replace(/^.+WHERE/, '').replaceAll('"', '');
  console.log(afterQuery);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordResult = await all<{ body: any }>(db, `SELECT body FROM records WHERE app_id = ? and ${afterQuery}`, app);
  return Response.json({ totalCount: recordResult.length.toString(), records: generateRecords(recordResult, fieldTypes) });
}
