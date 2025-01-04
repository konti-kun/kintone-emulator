import { ActionFunctionArgs, json } from "@remix-run/node";

export async function action({
  request,
}: ActionFunctionArgs) {
  const data = await request.json();
  return json({ revision: 1 });
}
