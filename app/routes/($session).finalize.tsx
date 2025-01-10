import { ActionFunctionArgs } from "@remix-run/node";
import { dbSession, serialize } from "~/utils/db.server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function action({ params }: ActionFunctionArgs) {
  const db = dbSession(params.session);
  await serialize(db, () => {
    db.run(
      "DROP TABLE fields",
    );
    db.run(
      "DROP TABLE records"
    );
    db.run(
      "DROP TABLE files"
    )
  });

  return Response.json({ result: 'ok' });
}
