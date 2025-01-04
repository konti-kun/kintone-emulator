import { expect, test } from "vitest";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";

test("アプリにフィールドを追加する", async () => {
  await fetch("http://localhost:3000/initialize", {
    method: "POST",
  });
  const client = new KintoneRestAPIClient({
    baseUrl: "http://localhost:3000",
    auth: {
      apiToken: "test",
    },
  });
  const result = await client.app.addFormFields({
    app: 1,
    properties: {
      test: {
        type: "SINGLE_LINE_TEXT",
        code: "test",
        label: "Test",
      },
    },
  });
  expect(result).toEqual({
    revision: 1,
  });
  const formResult = await client.app.getFormFields({
    app: 1,
  });
  expect(formResult.properties).toHaveProperty("test");
  expect(formResult.properties.test).toEqual({
    type: "SINGLE_LINE_TEXT",
    code: "test",
    label: "Test",
    noLabel: false,
  });
});
