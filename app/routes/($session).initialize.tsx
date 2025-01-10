import { ActionFunctionArgs } from "@remix-run/node";
import { dbSession, serialize } from "~/utils/db.server";
import dedent from "dedent";

const CREATE_TABLE_FIELDS = dedent`
  CREATE TABLE IF NOT EXISTS fields (
    id INTEGER PRIMARY KEY,
    app_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    type TEXT,
    code TEXT unique,
    label TEXT
  )
`;

const CREATE_TABLE_RECORDS = dedent`
  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY,
    revision INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    app_id INTEGER,
    body JSON
  )
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function action({ params }: ActionFunctionArgs) {
  const db = dbSession(params.session);
  await serialize(db, () => {
    db.run(CREATE_TABLE_FIELDS);
    db.run(CREATE_TABLE_RECORDS);
  });

  return Response.json({ result: 'ok' });
}
