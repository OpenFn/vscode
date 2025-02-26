import { exec } from "node:child_process";

export function execute(cmd: string) {
  return new Promise<string>((resolve, reject) => {
    const rsp = exec(cmd);
    rsp.stdout?.on("data", (data) => {
      resolve(data);
    });
    rsp.on("error", reject);
    rsp.on("exit", resolve);
  });
}
