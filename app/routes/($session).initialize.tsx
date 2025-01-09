import { ActionFunctionArgs } from "@remix-run/node";
import { dbSession, serialize } from "~/utils/db.server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function action({ params }: ActionFunctionArgs) {
  const db = dbSession(params.session);
  await serialize(db, () => {
    db.run(
      "CREATE TABLE IF NOT EXISTS fields (id INTEGER PRIMARY KEY, app_id INTEGER, type TEXT, code TEXT unique, label TEXT)",
    );
    db.run(
      "CREATE TABLE IF NOT EXISTS records (id INTEGER PRIMARY KEY, revision INTEGER, app_id INTEGER, body JSON)",
    );
  });

  return Response.json({ result: 'ok' });
}
