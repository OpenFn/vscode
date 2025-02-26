import * as vscode from "vscode";
import { Adaptor } from "../utils/adaptorHelper";

export class StatusBarManager implements vscode.Disposable {
  status!: vscode.StatusBarItem;
  currTxt: string = "";
  isBusy: boolean = false;
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
    this.currTxt = "OpenFn: active";
    this.setStatusText();
    this.status.tooltip = "OpenFn Workspace detected";
    this.status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.background"
    );
  }

  setStatusInactive() {
    this.currTxt = "OpenFn: not active";
    this.setStatusText();
    this.status.tooltip = "OpenFn Workspace no detected";
    this.status.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.warningBackground"
    );
  }

  setStatusAdaptor(adaptors: Adaptor[]) {
    this.currTxt = `${adaptors.map((a) => a.full).join(" + ")}`;
    this.setStatusText();
    this.status.tooltip = "OpenFn Workspace detected";
  }

  showOverrideText(text: string) {
    this.isBusy = true;
    this.status.text = text;
  }

  endOverrideText() {
    this.isBusy = false;
    this.status.text = this.currTxt;
  }

  private setStatusText() {
    if (this.isBusy) return;
    this.status.text = this.currTxt;
  }

  dispose() {
    if (this.status) this.status.dispose();
  }
}
