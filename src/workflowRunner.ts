import * as vscode from "vscode";

import { execute } from "./utils/execute";

function runTerminal(name: string, command: string) {
  const terminal =
    vscode.window.terminals.find((t) => t.name === name) ||
    vscode.window.createTerminal(name);
  terminal.show();
  if (process.platform === "win32") terminal.sendText("cls");
  else terminal.sendText("clear");
  terminal.sendText(command);
}

function isOpenfnCLIAvailable() {
  return new Promise<boolean>((resolve) => {
    execute("openfn --version")
      .then(() => {
        resolve(true);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

const INSTALL_CLI = "Click to Install";
export async function runWorkflow(workflowPath: string) {
  const isAvailable = await isOpenfnCLIAvailable();
  if (!isAvailable) {
    const pick = await vscode.window.showWarningMessage(
      "You don't have OpenFn CLI installed",
      INSTALL_CLI
    );
    if (pick === INSTALL_CLI)
      runTerminal("Installing OpenFn CLI", "npm install @openfn/cli -g");
  } else {
    runTerminal("Running workflow", `openfn ${workflowPath}`);
  }
}
