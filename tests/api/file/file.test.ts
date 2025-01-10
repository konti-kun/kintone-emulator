import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import { host } from "tests/config";
import { readFileSync } from "fs";

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
    const uploadResult = await client.file.uploadFile({
      file: {
        path: "./tests/api/file/test.txt",
      },
    });

    const result = await client.file.downloadFile({
      fileKey: uploadResult.fileKey,
    });
    const targetFile = readFileSync("./tests/api/file/test.txt");
    expect(new Uint8Array(result)).toStrictEqual(new Uint8Array(targetFile));
  });
});
