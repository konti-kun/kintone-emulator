import { jsx, jsxs } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable, unstable_composeUploadHandlers, unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import sqlite3 from "sqlite3";
import sqlParser from "node-sql-parser";
import dedent from "dedent";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App,
  links
}, Symbol.toStringTag, { value: "Module" }));
const singleton = (name, valueFactory) => {
  var _a;
  const g = global;
  g.__singletons ?? (g.__singletons = {});
  (_a = g.__singletons)[name] ?? (_a[name] = valueFactory());
  return g.__singletons[name];
};
const dbSession = (session) => singleton(session ?? "sqlite", () => new sqlite3.Database(":memory:"));
const serialize = (db, callback) => new Promise((resolve) => {
  db.serialize(() => {
    callback();
    resolve();
  });
});
const run = (db, sql, ...params) => new Promise((resolve, reject) => {
  db.run(sql, params, (err) => {
    if (err) {
      reject(err);
    } else {
      resolve();
    }
  });
});
const all = (db, sql, ...params) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) {
      reject(err);
    } else {
      resolve(rows);
    }
  });
});
const insertSql = `
INSERT INTO fields (app_id, type, code, label) VALUES (?, ?, ?, ?)
`;
async function action$4({
  request,
  params
}) {
  const method = request.method;
  const db = dbSession(params.session);
  const url = new URL(request.url);
  switch (method) {
    case "POST": {
      const requestData = await request.json();
      await serialize(db, () => {
        for (const key in requestData.properties) {
          db.run(insertSql, requestData.app, requestData.properties[key].type, key, requestData.properties.test.label);
        }
      });
      break;
    }
    case "DELETE": {
      const hasQuery = url.search.length > 0;
      const json = hasQuery ? {} : await request.json();
      for (const [key, value] of url.searchParams.entries()) {
        if (key.includes("fields")) {
          json.fields = json.fields || [];
          json.fields.push(value);
        } else {
          json[key] = value;
        }
      }
      await serialize(db, () => {
        for (const code of json.fields) {
          db.run("DELETE FROM fields WHERE app_id = ? AND code = ?", json.app, code);
        }
      });
      break;
    }
  }
  return Response.json({ revision: "1" });
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$4
}, Symbol.toStringTag, { value: "Module" }));
async function loader$3({
  request,
  params
}) {
  const db = dbSession(params.session);
  const url = new URL(request.url);
  const result = await all(db, `SELECT code, type, label FROM fields WHERE app_id = ?`, Number(url.searchParams.get("app")));
  const properties = {};
  for (const row of result) {
    properties[row.code] = {
      type: row.type,
      code: row.code,
      label: row.label,
      noLabel: false
    };
  }
  return Response.json({ properties, revision: "1" });
}
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$3
}, Symbol.toStringTag, { value: "Module" }));
const getFieldTypes = async (db, app) => {
  const fieldsResult = await all(db, `SELECT code, type FROM fields WHERE app_id = ?`, app);
  const fieldTypes = {};
  for (const field of fieldsResult) {
    fieldTypes[field.code] = field.type;
  }
  return fieldTypes;
};
const replaceField = (param) => {
  const { expression, fieldTypes } = param;
  switch (expression.type) {
    case "binary_expr":
      replaceField({ expression: expression.left, fieldTypes });
      replaceField({ expression: expression.right, fieldTypes });
      break;
    case "column_ref":
      switch (fieldTypes[expression.column]) {
        case "CREATED_TIME":
        case "UPDATED_TIME":
        case "DATETIME":
          expression.column = `datetime(body->>'$.${expression.column}.value', '+9 hours')`;
          break;
        case "DATE":
          expression.column = `date(body->>'$.${expression.column}.value', '+9 hours')`;
          break;
        default:
          expression.column = `body->>'$.${expression.column}.value'`;
          break;
      }
      break;
    case "var":
      if (expression.name === "id" && expression.prefix === "$") {
        delete expression.prefix;
        delete expression.name;
        delete expression.members;
        expression.type = "column_ref";
        expression.column = "id";
        expression.table = null;
      }
      break;
    case "function":
      switch (expression.name.name[0].value) {
        case "NOW":
          expression.name.name[0].value = "datetime";
          expression.args.value = [{ type: "single_quote_string", value: "now" }, { type: "single_quote_string", value: "+9 hours" }];
          break;
      }
  }
};
const generateRecords = ({ recordResult, fieldTypes, fields }) => {
  return recordResult.map((record) => {
    const body = JSON.parse(record.body);
    for (const key in body) {
      body[key].type = fieldTypes[key];
    }
    if (fields.length > 0) {
      for (const key in body) {
        if (!fields.includes(key)) {
          delete body[key];
        }
      }
    }
    body["$revision"] = { value: record.revision.toString(), type: "__REVISION__" };
    body["$id"] = { value: record.id.toString(), type: "RECORD_NUMBER" };
    return body;
  });
};
const hasWhereClause = (query) => {
  return !(query.trim().toLowerCase().startsWith("order by") || query.trim().toLowerCase().startsWith("limit ") || query.trim().toLowerCase().startsWith("offset "));
};
const replaceUniCodeField = (query) => {
  const includedJp = new RegExp(`(?<!['"\\u30a0-\\u30ff\\u3040-\\u309f\\u3005-\\u3006\\u30e0-\\u9fcf])\\w*[\\u30a0-\\u30ff\\u3040-\\u309f\\u3005-\\u3006\\u30e0-\\u9fcf]+\\w*(?!['"])`, "g");
  return query.replace(includedJp, (match) => `\`${match}\``);
};
const loader$2 = async ({
  request,
  params
}) => {
  try {
    const db = dbSession(params.session);
    const url = new URL(request.url);
    const app = url.searchParams.get("app");
    const _query = url.searchParams.get("query");
    const query = _query ? replaceUniCodeField(_query).replaceAll('"', "'") : null;
    const fields = [];
    for (const [key, value] of url.searchParams.entries()) {
      if (key.includes("fields")) {
        fields.push(value);
      }
    }
    const fieldTypes = await getFieldTypes(db, app);
    if (query === null) {
      const recordResult = await all(db, `SELECT id, revision, body FROM records WHERE app_id = ?`, app);
      return Response.json({ totalCount: recordResult.length.toString(), records: generateRecords({ recordResult, fieldTypes, fields }) });
    }
    const parser = new sqlParser.Parser();
    const prefixSql = `select 1 from records ${hasWhereClause(query) ? "where " : ""}`;
    console.log(prefixSql + query);
    const ast = parser.astify(prefixSql + query);
    if ("where" in ast && ast.where !== null) {
      replaceField({ expression: ast.where, fieldTypes });
    }
    if ("orderby" in ast && ast.orderby !== null) {
      for (const order of ast.orderby) {
        replaceField({ expression: order.expr, fieldTypes });
      }
    }
    const newQuery = parser.sqlify(ast, { database: "sqlite" });
    const afterQuery = newQuery.replaceAll('"', "").replace(/SELECT 1 FROM records (WHERE)?/g, "");
    try {
      const recordResult = await all(db, `SELECT id, revision, body FROM records WHERE app_id = ? ${hasWhereClause(query) ? "and" : ""} ${afterQuery}`, app);
      return Response.json({
        totalCount: recordResult.length.toString(),
        records: generateRecords({ recordResult, fieldTypes, fields })
      });
    } catch (e) {
      return Response.json(
        {
          id: "1505999166-897850006",
          code: "CB_VA01",
          message: "query: クエリ記法が間違っています。"
        },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error(e);
    return Response.json({
      id: "test",
      code: "error",
      message: e
    }, { status: 500 });
  }
};
const route3 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  loader: loader$2
}, Symbol.toStringTag, { value: "Module" }));
const loader$1 = async ({ request, params }) => {
  const db = dbSession(params.session);
  const url = new URL(request.url);
  const app = url.searchParams.get("app");
  const recordResult = await all(
    db,
    `SELECT id, revision, body FROM records WHERE app_id = ? and id = ?`,
    app,
    url.searchParams.get("id")
  );
  const body = JSON.parse(recordResult[0].body);
  const id = recordResult[0].id;
  const revision = recordResult[0].revision;
  const fieldsResult = await all(db, `SELECT code, type FROM fields WHERE app_id = ?`, app);
  for (const field of fieldsResult) {
    if (body[field.code]) {
      body[field.code].type = field.type;
    }
  }
  body["$id"] = { value: id.toString(), type: "RECORD_NUMBER" };
  body["$revision"] = { value: revision.toString(), type: "__REVISION__" };
  return Response.json(
    { record: body },
    {
      headers: {
        "Access-Control-Allow-Origin": "http://localhost:3000",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*"
      }
    }
  );
};
const action$3 = async ({ request, params }) => {
  const body = await request.json();
  console.log("action", body);
  console.log("method", request.method);
  const db = dbSession(params.session);
  switch (request.method) {
    case "POST": {
      await run(
        db,
        "INSERT INTO records (app_id, revision, body) VALUES (?, 1, ?)",
        body.app,
        JSON.stringify(body.record)
      );
      break;
    }
    case "PUT": {
      if (body.id) {
        const targetRecord = await all(
          db,
          `SELECT body FROM records WHERE app_id = ? AND id = ?`,
          body.app,
          body.id
        );
        const recordBody = {
          ...JSON.parse(targetRecord[0].body),
          ...body.record
        };
        await run(
          db,
          "UPDATE records SET body = ?, revision = revision + 1 WHERE app_id = ? AND id = ?",
          JSON.stringify(recordBody),
          body.app,
          body.id
        );
      } else if (body.updateKey) {
        const query = `SELECT body FROM records WHERE app_id = ? AND body->>'$.${body.updateKey.field}.value' = ?`;
        console.log(query);
        const targetRecord = await all(
          db,
          query,
          body.app,
          body.updateKey.value
        );
        console.log(targetRecord);
        const recordBody = {
          ...JSON.parse(targetRecord[0].body),
          ...body.record
        };
        await run(
          db,
          `UPDATE records SET body = ?, revision = revision + 1 WHERE app_id = ? AND body->>'$.${body.updateKey.field}.value' = ?`,
          JSON.stringify(recordBody),
          body.app,
          body.updateKey.value
        );
      }
      break;
    }
  }
  const recordResult = await all(
    db,
    `SELECT id,revision,body FROM records WHERE rowid = last_insert_rowid()`
  );
  return Response.json({
    id: recordResult[0].id.toString(),
    revision: recordResult[0].revision.toString()
  });
};
const route4 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$3,
  loader: loader$1
}, Symbol.toStringTag, { value: "Module" }));
const loader = async ({ request, params }) => {
  const db = dbSession(params.session);
  const fileKey = new URL(request.url).searchParams.get("fileKey");
  const recordResult = await all(db, `SELECT data, content_type, filename FROM files WHERE id = ?`, fileKey);
  const blob = new Blob([new Uint8Array(recordResult[0].data)], { type: recordResult[0].content_type });
  return new Response(
    await blob.arrayBuffer(),
    {
      headers: {
        "Content-Disposition": `attachment; filename="${recordResult[0].filename}"`
      }
    }
  );
};
const action$2 = async ({
  request,
  params
}) => {
  const db = dbSession(params.session);
  const uploadHandler = unstable_composeUploadHandlers(
    async ({ contentType, data, filename }) => {
      const raw = [];
      for await (const chunk of data) {
        raw.push(chunk);
      }
      const _data = await new Blob(raw).arrayBuffer();
      const buffer = Buffer.from(_data);
      await run(
        db,
        `INSERT INTO files (filename, data, content_type) VALUES (?, ?, ?)`,
        filename,
        buffer,
        contentType
      );
      const recordResult = await all(db, `SELECT id FROM files WHERE rowid = last_insert_rowid()`);
      return recordResult[0].id.toString();
    },
    unstable_createMemoryUploadHandler()
  );
  const formData = await unstable_parseMultipartFormData(
    request,
    uploadHandler
  );
  return Response.json({
    fileKey: formData.get("file")
  });
};
const route5 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$2,
  loader
}, Symbol.toStringTag, { value: "Module" }));
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
const CREATE_TABLE_FILES = dedent`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    filename TEXT,
    content_type TEXT,
    data BLOB
  )
`;
async function action$1({ params }) {
  const db = dbSession(params.session);
  await serialize(db, () => {
    db.run(CREATE_TABLE_FIELDS);
    db.run(CREATE_TABLE_RECORDS);
    db.run(CREATE_TABLE_FILES);
  });
  return Response.json({ result: "ok" });
}
const route6 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action: action$1
}, Symbol.toStringTag, { value: "Module" }));
async function action({ params }) {
  const db = dbSession(params.session);
  await serialize(db, () => {
    db.run(
      "DROP TABLE fields"
    );
    db.run(
      "DROP TABLE records"
    );
    db.run(
      "DROP TABLE files"
    );
  });
  return Response.json({ result: "ok" });
}
const route7 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  action
}, Symbol.toStringTag, { value: "Module" }));
const meta = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" }
  ];
};
function Index() {
  return /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-16", children: [
    /* @__PURE__ */ jsxs("header", { className: "flex flex-col items-center gap-9", children: [
      /* @__PURE__ */ jsxs("h1", { className: "leading text-2xl font-bold text-gray-800 dark:text-gray-100", children: [
        "Welcome to ",
        /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Remix" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "h-[144px] w-[434px]", children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/logo-light.png",
            alt: "Remix",
            className: "block w-full dark:hidden"
          }
        ),
        /* @__PURE__ */ jsx(
          "img",
          {
            src: "/logo-dark.png",
            alt: "Remix",
            className: "hidden w-full dark:block"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "flex flex-col items-center justify-center gap-4 rounded-3xl border border-gray-200 p-6 dark:border-gray-700", children: [
      /* @__PURE__ */ jsx("p", { className: "leading-6 text-gray-700 dark:text-gray-200", children: "What's next?" }),
      /* @__PURE__ */ jsx("ul", { children: resources.map(({ href, text, icon }) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        "a",
        {
          className: "group flex items-center gap-3 self-stretch p-3 leading-normal text-blue-700 hover:underline dark:text-blue-500",
          href,
          target: "_blank",
          rel: "noreferrer",
          children: [
            icon,
            text
          ]
        }
      ) }, href)) })
    ] })
  ] }) });
}
const resources = [
  {
    href: "https://remix.run/start/quickstart",
    text: "Quick Start (5 min)",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "20",
        viewBox: "0 0 20 20",
        fill: "none",
        className: "stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8.51851 12.0741L7.92592 18L15.6296 9.7037L11.4815 7.33333L12.0741 2L4.37036 10.2963L8.51851 12.0741Z",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      }
    )
  },
  {
    href: "https://remix.run/start/tutorial",
    text: "Tutorial (30 min)",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "20",
        viewBox: "0 0 20 20",
        fill: "none",
        className: "stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M4.561 12.749L3.15503 14.1549M3.00811 8.99944H1.01978M3.15503 3.84489L4.561 5.2508M8.3107 1.70923L8.3107 3.69749M13.4655 3.84489L12.0595 5.2508M18.1868 17.0974L16.635 18.6491C16.4636 18.8205 16.1858 18.8205 16.0144 18.6491L13.568 16.2028C13.383 16.0178 13.0784 16.0347 12.915 16.239L11.2697 18.2956C11.047 18.5739 10.6029 18.4847 10.505 18.142L7.85215 8.85711C7.75756 8.52603 8.06365 8.21994 8.39472 8.31453L17.6796 10.9673C18.0223 11.0653 18.1115 11.5094 17.8332 11.7321L15.7766 13.3773C15.5723 13.5408 15.5554 13.8454 15.7404 14.0304L18.1868 16.4767C18.3582 16.6481 18.3582 16.926 18.1868 17.0974Z",
            strokeWidth: "1.5",
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }
        )
      }
    )
  },
  {
    href: "https://remix.run/docs",
    text: "Remix Docs",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "20",
        viewBox: "0 0 20 20",
        fill: "none",
        className: "stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M9.99981 10.0751V9.99992M17.4688 17.4688C15.889 19.0485 11.2645 16.9853 7.13958 12.8604C3.01467 8.73546 0.951405 4.11091 2.53116 2.53116C4.11091 0.951405 8.73546 3.01467 12.8604 7.13958C16.9853 11.2645 19.0485 15.889 17.4688 17.4688ZM2.53132 17.4688C0.951566 15.8891 3.01483 11.2645 7.13974 7.13963C11.2647 3.01471 15.8892 0.951453 17.469 2.53121C19.0487 4.11096 16.9854 8.73551 12.8605 12.8604C8.73562 16.9853 4.11107 19.0486 2.53132 17.4688Z",
            strokeWidth: "1.5",
            strokeLinecap: "round"
          }
        )
      }
    )
  },
  {
    href: "https://rmx.as/discord",
    text: "Join Discord",
    icon: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        width: "24",
        height: "20",
        viewBox: "0 0 24 20",
        fill: "none",
        className: "stroke-gray-600 group-hover:stroke-current dark:stroke-gray-300",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            d: "M15.0686 1.25995L14.5477 1.17423L14.2913 1.63578C14.1754 1.84439 14.0545 2.08275 13.9422 2.31963C12.6461 2.16488 11.3406 2.16505 10.0445 2.32014C9.92822 2.08178 9.80478 1.84975 9.67412 1.62413L9.41449 1.17584L8.90333 1.25995C7.33547 1.51794 5.80717 1.99419 4.37748 2.66939L4.19 2.75793L4.07461 2.93019C1.23864 7.16437 0.46302 11.3053 0.838165 15.3924L0.868838 15.7266L1.13844 15.9264C2.81818 17.1714 4.68053 18.1233 6.68582 18.719L7.18892 18.8684L7.50166 18.4469C7.96179 17.8268 8.36504 17.1824 8.709 16.4944L8.71099 16.4904C10.8645 17.0471 13.128 17.0485 15.2821 16.4947C15.6261 17.1826 16.0293 17.8269 16.4892 18.4469L16.805 18.8725L17.3116 18.717C19.3056 18.105 21.1876 17.1751 22.8559 15.9238L23.1224 15.724L23.1528 15.3923C23.5873 10.6524 22.3579 6.53306 19.8947 2.90714L19.7759 2.73227L19.5833 2.64518C18.1437 1.99439 16.6386 1.51826 15.0686 1.25995ZM16.6074 10.7755L16.6074 10.7756C16.5934 11.6409 16.0212 12.1444 15.4783 12.1444C14.9297 12.1444 14.3493 11.6173 14.3493 10.7877C14.3493 9.94885 14.9378 9.41192 15.4783 9.41192C16.0471 9.41192 16.6209 9.93851 16.6074 10.7755ZM8.49373 12.1444C7.94513 12.1444 7.36471 11.6173 7.36471 10.7877C7.36471 9.94885 7.95323 9.41192 8.49373 9.41192C9.06038 9.41192 9.63892 9.93712 9.6417 10.7815C9.62517 11.6239 9.05462 12.1444 8.49373 12.1444Z",
            strokeWidth: "1.5"
          }
        )
      }
    )
  }
];
const route8 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Index,
  meta
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-BPXDpiE6.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-VJ49-gok.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-DaeFpr-q.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js", "/assets/components-VJ49-gok.js"], "css": ["/assets/root-DIgr2wtl.css"] }, "routes/($session).k.v1.preview.app.form.fields[.]json": { "id": "routes/($session).k.v1.preview.app.form.fields[.]json", "parentId": "root", "path": ":session?/k/v1/preview/app/form/fields.json", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).k.v1.preview.app.form.fields_._json-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/($session).k.v1.app.form.fields[.]json": { "id": "routes/($session).k.v1.app.form.fields[.]json", "parentId": "root", "path": ":session?/k/v1/app/form/fields.json", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).k.v1.app.form.fields_._json-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/($session).k.v1.records[.]json": { "id": "routes/($session).k.v1.records[.]json", "parentId": "root", "path": ":session?/k/v1/records.json", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).k.v1.records_._json-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/($session).k.v1.record[.]json": { "id": "routes/($session).k.v1.record[.]json", "parentId": "root", "path": ":session?/k/v1/record.json", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).k.v1.record_._json-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/($session).k.v1.file[.]json": { "id": "routes/($session).k.v1.file[.]json", "parentId": "root", "path": ":session?/k/v1/file.json", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": true, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).k.v1.file_._json-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/($session).initialize": { "id": "routes/($session).initialize", "parentId": "root", "path": ":session?/initialize", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).initialize-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/($session).finalize": { "id": "routes/($session).finalize", "parentId": "root", "path": ":session?/finalize", "index": void 0, "caseSensitive": void 0, "hasAction": true, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/(_session).finalize-l0sNRNKZ.js", "imports": [], "css": [] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-DnPs6FvX.js", "imports": ["/assets/jsx-runtime-56DGgGmo.js"], "css": [] } }, "url": "/assets/manifest-d93439af.js", "version": "d93439af" };
const mode = "production";
const assetsBuildDirectory = "build/client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "v3_routeConfig": false, "v3_singleFetch": true, "v3_lazyRouteDiscovery": true, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/($session).k.v1.preview.app.form.fields[.]json": {
    id: "routes/($session).k.v1.preview.app.form.fields[.]json",
    parentId: "root",
    path: ":session?/k/v1/preview/app/form/fields.json",
    index: void 0,
    caseSensitive: void 0,
    module: route1
  },
  "routes/($session).k.v1.app.form.fields[.]json": {
    id: "routes/($session).k.v1.app.form.fields[.]json",
    parentId: "root",
    path: ":session?/k/v1/app/form/fields.json",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  },
  "routes/($session).k.v1.records[.]json": {
    id: "routes/($session).k.v1.records[.]json",
    parentId: "root",
    path: ":session?/k/v1/records.json",
    index: void 0,
    caseSensitive: void 0,
    module: route3
  },
  "routes/($session).k.v1.record[.]json": {
    id: "routes/($session).k.v1.record[.]json",
    parentId: "root",
    path: ":session?/k/v1/record.json",
    index: void 0,
    caseSensitive: void 0,
    module: route4
  },
  "routes/($session).k.v1.file[.]json": {
    id: "routes/($session).k.v1.file[.]json",
    parentId: "root",
    path: ":session?/k/v1/file.json",
    index: void 0,
    caseSensitive: void 0,
    module: route5
  },
  "routes/($session).initialize": {
    id: "routes/($session).initialize",
    parentId: "root",
    path: ":session?/initialize",
    index: void 0,
    caseSensitive: void 0,
    module: route6
  },
  "routes/($session).finalize": {
    id: "routes/($session).finalize",
    parentId: "root",
    path: ":session?/finalize",
    index: void 0,
    caseSensitive: void 0,
    module: route7
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route8
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};
