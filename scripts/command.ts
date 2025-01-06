import * as childProcess from "child_process";
import { setTimeout } from "timers/promises";

const cp = childProcess.spawn("pnpm", ["run", "start"], {
  env: { ...process.env, PORT: "12345" },
});

// 情報がほしいときはコメントアウトを外す
// cp.stdout?.on("data", (data) => {
//   console.log(data.toString());
// });

await setTimeout(1000);

childProcess.execSync("pnpm run test", {
  stdio: "inherit",
});

if (cp.pid) process.kill(cp.pid);
