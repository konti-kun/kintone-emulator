import { ActionFunctionArgs } from "@remix-run/node";
import { all, dbSession, run } from "~/utils/db.server";

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const body: {
    record: { [key: string]: { value: string } };
    app: number | string;
    comment:
      | (number | string)
      | { text: string; mentions: { code: string; type: string }[] };
  } = await request.json();
  console.log("action", body);
  console.log("method", request.method);
  const db = dbSession(params.session);

  const targetRecord = await all<{ body: string }>(
    db,
    `SELECT body FROM records WHERE app_id = ? AND id = ?`,
    body.app,
    body.record
  );
  if (targetRecord.length === 0) {
    throw new Error("Record not found");
  }

  switch (request.method) {
    case "POST": {
      if (typeof body.comment !== "object") {
        throw new Error("Invalid comment");
      }
      await run(
        db,
        "INSERT INTO comments (app_id, record_id, message, mentions) VALUES (?, ?, ?, ?)",
        body.app,
        JSON.stringify(body.record),
        JSON.stringify(body.comment.text),
        JSON.stringify(body.comment.mentions)
      );
      break;
    }
    case "DELETE": {
      await run(
        db,
        "DELETE FROM comments WHERE app_id = ? AND record_id AND id = ?",
        body.app,
        body.record,
        body.comment
      );
      break;
    }
  }
  const recordResult = await all<{
    id: number;
  }>(db, `SELECT id FROM comments WHERE rowid = last_insert_rowid()`);
  return Response.json({
    id: recordResult[0].id.toString(),
  });
};
