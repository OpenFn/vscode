import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

import { execute } from "./utils/execute";
import cleanupFilename from "./utils/cleanupFilename";
import generateTimestamp from "./utils/generateTimestamp";

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
export async function isAvailableWithInstall() {
  const isAvailable = await isOpenfnCLIAvailable();
  if (!isAvailable) {
    const pick = await vscode.window.showWarningMessage(
      "You don't have OpenFn CLI installed",
      INSTALL_CLI
    );
    if (pick === INSTALL_CLI)
      runTerminal("Installing OpenFn CLI", "npm install @openfn/cli -g");
  }
  return isAvailable;
}

export async function runWorkflowHelper(
  workflowInfo: {
    path: string;
    name?: string;
  },
  workspaceUri: vscode.Uri,
  inputPath?: string
) {
  // compute output path here!
  const outputPath = path.join(
    workspaceUri.fsPath,
    `./tmp/output/${generateTimestamp()}-${cleanupFilename(
      workflowInfo.name || "no-name"
    )}-output.json`
  );

  const isAvailable = await isAvailableWithInstall();
  if (isAvailable) {
    const dirPath = path.dirname(outputPath);
    fs.mkdirSync(dirPath, { recursive: true });
    runTerminal(
      "Running workflow",
      `openfn ${workflowInfo.path} ${
        inputPath ? "-s " + inputPath : ""
      } -o ${outputPath}`
    );
  }
}
