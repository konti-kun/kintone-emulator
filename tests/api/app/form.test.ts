import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { host } from "tests/config";

describe("アプリのフォームフィールドAPI", () => {
  beforeEach(async () => {
    await fetch(`http://${host}/form/initialize`, {
      method: "POST",
    });
  });

  afterEach(async () => {
    await fetch(`http://${host}/form/finalize`, {
      method: "POST",
    });
  });

  test("アプリにフィールドを追加し、確認し、削除できる", async () => {
    const client = new KintoneRestAPIClient({
      baseUrl: `http://${host}/form`,
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
      revision: "1",
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
    await client.app.deleteFormFields({
      app: 1,
      fields: ["test"],
    });
    expect(await client.app.getFormFields({ app: 1 })).toEqual({
      properties: {},
      revision: "1",
    });
  });
});
