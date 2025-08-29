import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { host } from "tests/config";

describe("アプリのレコードコメントAPI", () => {
  let client: KintoneRestAPIClient | undefined = undefined;
  let recordId: string;

  beforeEach(async () => {
    await fetch(`http://${host}/record/initialize`, {
      method: "POST",
    });
    client = new KintoneRestAPIClient({
      baseUrl: `http://${host}/record`,
      auth: {
        apiToken: "test",
      },
    });
    await client.app.addFormFields({
      app: 1,
      properties: {
        test: {
          type: "SINGLE_LINE_TEXT",
          code: "test",
          label: "Test",
        },
      },
    });

    // テスト用のレコードを作成
    const record = await client.record.addRecord({
      app: 1,
      record: {
        test: {
          value: "test",
        },
      },
    });
    recordId = record.id;
  });

  afterEach(async () => {
    await fetch(`http://${host}/record/finalize`, {
      method: "POST",
    });
  });

  test("レコードにコメントを追加できる", async () => {
    const result = await client!.record.addRecordComment({
      app: 1,
      record: recordId,
      comment: {
        text: "テストコメント",
      },
    });

    expect(result).toEqual({
      id: expect.any(String),
    });
  });

  test("mentionsを含むコメントを追加できる", async () => {
    const result = await client!.record.addRecordComment({
      app: 1,
      record: recordId,
      comment: {
        text: "@test さん、確認お願いします",
        mentions: [
          {
            code: "test",
            type: "USER",
          },
        ],
      },
    });

    expect(result).toEqual({
      id: expect.any(String),
    });
  });

  test("存在しないレコードIDでエラーになる", async () => {
    await expect(
      client!.record.addRecordComment({
        app: 1,
        record: "9999",
        comment: {
          text: "テストコメント",
        },
      })
    ).rejects.toThrow();
  });

  test("存在しないアプリIDでエラーになる", async () => {
    await expect(
      client!.record.addRecordComment({
        app: 9999,
        record: recordId,
        comment: {
          text: "テストコメント",
        },
      })
    ).rejects.toThrow();
  });
});
