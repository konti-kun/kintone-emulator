import { ActionFunctionArgs } from "@remix-run/node";
import { dbSession } from "~/utils/db.server";

const sql = `
INSERT INTO fields (app_id, type, code, label) VALUES (?, ?, ?, ?)
ON CONFLICT(code) DO UPDATE SET label = excluded.label, type = excluded.type
`

export async function action({
  request,
  params,
}: ActionFunctionArgs) {
  const db = dbSession(params.session);
  const requestData = await request.json();
  db.serialize(() => {
    for (const key in requestData.properties) {
      db.run(sql, requestData.app, requestData.properties[key].type, key, requestData.properties.test.label);
    }
  });
  return Response.json({ revision: 1 });
}
