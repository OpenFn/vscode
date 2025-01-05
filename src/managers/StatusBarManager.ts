import * as vscode from "vscode";

export class StatusBarManager implements vscode.Disposable {
  status!: vscode.StatusBarItem;
  runWorkflows!: vscode.StatusBarItem;
  constructor() {
    this.status = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      2
    );
    this.status.show();
    this.setStatusInactive();

    this.runWorkflows = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      1
    );
    this.runWorkflows.command = "openfn.run-workflows";
  }

  setRunWorkflowsActive() {
    this.runWorkflows.show();
    this.runWorkflows.text = "$(debug-start) Run Workflow(s)";
    this.runWorkflows.tooltip = "Execute a workflow in this workspace";
    this.runWorkflows.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.background"
    );
  }
  setRunWorkflowsInactive() {
    this.runWorkflows.hide();
  }

  setStatusActive() {
    this.status.text = "OpenFn: active";
    this.status.tooltip = "OpenFn Workspace detected";
    this.status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.background"
    );
  }

  setStatusInactive() {
    this.status.text = "OpenFn: not active";
    this.status.tooltip = "OpenFn Workspace no detected";
    this.status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  }

  setStatusAdaptor(adaptor: string) {
    this.status.text = `OpenFn: ${adaptor}`;
    this.status.tooltip = "OpenFn Workspace detected";
  }

  dispose() {
    if (this.status) this.status.dispose();
    if (this.runWorkflows) this.runWorkflows.dispose();
  }
}
