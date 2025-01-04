import { ActionFunctionArgs } from "@remix-run/node";
import { dbSession, run } from "~/utils/db.server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function action({ params }: ActionFunctionArgs) {
  const db = dbSession(params.session);

  run(db,
    "CREATE TABLE IF NOT EXISTS fields (id INTEGER PRIMARY KEY, app_id INTEGER, type TEXT, code TEXT unique, label TEXT)",
  )

  return Response.json({ result: 'ok' });
}
