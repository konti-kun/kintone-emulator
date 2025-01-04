import { ActionFunctionArgs } from "@remix-run/node";
import { all, dbSession } from "~/utils/db.server";
import type { KintoneRecordField } from '@kintone/rest-api-client';

type Property = {
  type: KintoneRecordField.OneOf['type'];
  code: string;
  label: string;
  noLabel: boolean;
}

export async function loader({
  request,
  params,
}: ActionFunctionArgs) {
  const db = dbSession(params.session);
  const url = new URL(request.url);
  const result = await all<Property>(db, `SELECT code, type, label FROM fields WHERE app_id = ?`, Number(url.searchParams.get('app')));

  const properties: {
    [key: string]: Property
  } = {};
  for (const row of result) {
    properties[row.code] = {
      type: row.type,
      code: row.code,
      label: row.label,
      noLabel: false,
    };
  }

  return Response.json({ properties });
}
