import * as vscode from "vscode";

export class StatusBarManager implements vscode.Disposable {
  status!: vscode.StatusBarItem;
  constructor() {
    this.status = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      1
    );
    this.status.show();
    this.setInactive();
  }

  setActive() {
    this.status.text = "OpenFn: active";
    this.status.tooltip = "OpenFn Workspace detected";
    this.status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.background"
    );
  }

  setInactive() {
    this.status.text = "OpenFn: not active";
    this.status.tooltip = "OpenFn Workspace no detected";
    this.status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  }

  setAdaptor(adaptor: string) {
    this.status.text = `OpenFn: ${adaptor}`;
    this.status.tooltip = "OpenFn Workspace detected";
  }

  dispose() {
    if (this.status) this.status.dispose();
  }
}
