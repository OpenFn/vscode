import * as vscode from "vscode";
import * as path from "path";
import { WorkflowData } from "./types";

export class TreeViewProvider implements vscode.TreeDataProvider<TreeviewItem> {
  constructor(private getWorkflowFiles: () => WorkflowData[]) {}
  private _onDidChangeTreeData: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData: vscode.Event<void> =
    this._onDidChangeTreeData.event;

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TreeviewItem): vscode.TreeItem {
    return element;
  }

  getChildren(
    element?: TreeviewItem | undefined
  ): vscode.ProviderResult<TreeviewItem[]> {
    if (!element) {
      return Promise.resolve(
        this.getWorkflowFiles().map(
          (file) =>
            new TreeviewItem(
              path.basename(file.filePath),
              file.filePath,
              vscode.TreeItemCollapsibleState.Collapsed,
              file.steps
            )
        )
      );
    } else {
      return element.steps.map(
        (step) =>
          new TreeviewItem(
            step.name || path.basename(step.expression),
            path.join(path.dirname(element.filePath), step.expression),
            vscode.TreeItemCollapsibleState.None,
            [], // no steps
            step.adaptor
          )
      );
    }
  }
}

export class TreeviewItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly filePath: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly steps: WorkflowData["steps"] = [],
    private readonly adaptor: string = "none",
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);
    this.tooltip = this.label;
    const adaptor_name = this.adaptor.match(/^\w+/)?.[0];
    if (adaptor_name === "none") {
      this.iconPath = path.join(
        __filename,
        "..",
        "..",
        "resources",
        "openfn-square.svg"
      );
    } else {
      // is sub-item
      this.iconPath = vscode.Uri.parse(
        `https://app.openfn.org/images/adaptors/${adaptor_name}-square.png`
      );
      this.command = {
        command: "openfn-workflows.itemclicked",
        title: "OpenFn Workflows ItemClicked",
        arguments: [this],
      };
    }
  }
}
