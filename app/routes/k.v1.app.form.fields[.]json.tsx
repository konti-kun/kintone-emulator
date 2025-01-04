import { ActionFunctionArgs, json } from "@remix-run/node";

export async function loader({
  params,
}: ActionFunctionArgs) {
  return json({ properties: { test: { type: "SINGLE_LINE_TEXT", code: "test", label: "Test", noLabel: false } } });
}
