import { ActionFunctionArgs } from "@remix-run/node";
import { all, dbSession, run } from "~/utils/db.server";
import type { KintoneRecordField } from '@kintone/rest-api-client';

type Record = {
  [fieldCode: string]: KintoneRecordField.OneOf;
}

export const loader = async ({
  request,
  params,
}: ActionFunctionArgs) => {
  const db = dbSession(params.session);
  const url = new URL(request.url);
  const app = url.searchParams.get('app');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recordResult = await all<{ body: any }>(db, `SELECT body FROM records WHERE app_id = ? and id = ?`, app, url.searchParams.get('id'));
  const body: Record = JSON.parse(recordResult[0].body);
  const fieldsResult = await all<{ code: string, type: KintoneRecordField.OneOf['type'] }>(db, `SELECT code, type FROM fields WHERE app_id = ?`, app);
  for (const field of fieldsResult) {
    if (body[field.code]) {
      body[field.code].type = field.type;
    }
  }
  return Response.json({ record: body });
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const body = await request.json();
  const db = dbSession(body.session);
  await run(db, "INSERT INTO records (app_id, body) VALUES (?, ?)", body.app, JSON.stringify(body.record));
  return Response.json({
    id: 1,
    revision: 1,
  });
}
