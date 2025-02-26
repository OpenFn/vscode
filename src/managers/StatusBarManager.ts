import * as vscode from "vscode";
import { Adaptor } from "../utils/adaptorHelper";

export class StatusBarManager implements vscode.Disposable {
  status!: vscode.StatusBarItem;
  constructor() {
    this.status = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      2
    );
    this.status.show();
    this.setStatusInactive();
    this.status.command = "openfn.run-workflows";
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

  setStatusAdaptor(adaptors: Adaptor[]) {
    this.status.text = `${adaptors.map((a) => a.full).join(" + ")}`;
    this.status.tooltip = "OpenFn Workspace detected";
  }

  dispose() {
    if (this.status) this.status.dispose();
  }
}
