import { expect, test } from "vitest";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";

test("アプリにレコードを追加し、検索できる", async () => {
  await fetch("http://localhost:3000/initialize", {
    method: "POST",
  });
  const client = new KintoneRestAPIClient({
    baseUrl: "http://localhost:3000",
    auth: {
      apiToken: "test",
    },
  });
  const result = await client.record.addRecord({
    app: 1,
    record: {
      test: {
        value: "test",
      },
    },
  });
  expect(result).toEqual({
    id: expect.any(Number),
    revision: 1,
  });
  const record = await client.record.getRecord({
    app: 1,
    id: result.id,
  });
  expect(record).toEqual({
    record: {
      test: {
        value: "test",
        type: "SINGLE_LINE_TEXT",
      },
    },
  });
});
