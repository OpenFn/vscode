import { exec } from "node:child_process";

export function execute(cmd: string) {
  return new Promise<string>((resolve, reject) => {
    exec(cmd, {}, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(error?.message || "");
    });
  });
}
