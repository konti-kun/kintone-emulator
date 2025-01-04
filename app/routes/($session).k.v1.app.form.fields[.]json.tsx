import { ActionFunctionArgs } from "@remix-run/node";
import { all, dbSession } from "~/utils/db.server";

type Property = {
  type: string;
  code: string;
  label: string;
  noLabel: boolean;
}

export async function loader({
  params,
}: ActionFunctionArgs) {
  const db = dbSession(params.session);
  const result = await all<Property>(db, `SELECT code, type, label FROM fields WHERE app_id = ?`, 1);

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
