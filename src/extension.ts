import * as vscode from "vscode";
import { OpenFnExtension } from "./OpenfnExtension";
import { WorkflowManager } from "./managers/WorkflowManager";
import { TreeViewProvider } from "./TreeViewProvider";
import { StatusBarManager } from "./managers/StatusBarManager";
import { CompletionManager } from "./managers/CompletionManager";

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("OpenFn support only works in a workspace");
    return;
  } else if (workspaceFolder.length > 1) {
    vscode.window.showErrorMessage(
      "OpenFn support not available in multi-workspace"
    );
    return;
  }
  const activeWorkspace = workspaceFolder[0];

  // start
  const workflowManager = new WorkflowManager(vscode, activeWorkspace.uri);
  const treeviewProvider = new TreeViewProvider(
    () => workflowManager.workflowFiles
  );
  const statusBarManager = new StatusBarManager();
  const completionManager = new CompletionManager();
  const openfnExtension = new OpenFnExtension(
    workflowManager,
    treeviewProvider,
    statusBarManager,
    completionManager
  );
  context.subscriptions.push(openfnExtension);
}

// This method is called when your extension is deactivated
export function deactivate() {}
